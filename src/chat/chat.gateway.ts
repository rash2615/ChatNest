import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { RoomsService } from '../rooms/rooms.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedClients = new Map<string, Socket>();
  private userRooms = new Map<string, Set<string>>(); // userId -> Set of roomIds
  private userSockets = new Map<string, string>(); // userId -> socketId
  private typingUsers = new Map<string, Set<string>>(); // roomId -> Set of userIds

  constructor(
    private readonly messagesService: MessagesService,
    private readonly roomsService: RoomsService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Authentifier l'utilisateur via JWT
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token as string);
      const userId = payload.sub;
      const user = await this.usersService.findOne(userId);

      // Stocker les informations utilisateur dans le socket
      (client as any).user = {
        userId: user.id,
        username: user.username,
        email: user.email,
      };

      // Mettre à jour le statut utilisateur
      await this.usersService.update(userId, { isOnline: true, lastSeen: new Date() } as any);

      this.connectedClients.set(client.id, client);
      this.userSockets.set(userId, client.id);

      this.logger.log(`User ${user.username} (${userId}) connected: ${client.id}`);

      // Notifier tous les clients qu'un utilisateur est en ligne
      this.server.emit('userStatusChanged', {
        userId: userId,
        username: user.username,
        isOnline: true,
        timestamp: new Date().toISOString(),
      });

      // Envoyer la liste des utilisateurs en ligne au nouveau client
      const onlineUsers = Array.from(this.userSockets.keys()).map((uid) => ({
        userId: uid,
        socketId: this.userSockets.get(uid),
      }));
      client.emit('onlineUsers', { users: onlineUsers });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = (client as any).user;
    if (!user) {
      this.connectedClients.delete(client.id);
      return;
    }

    const userId = user.userId;
    this.logger.log(`User ${user.username} (${userId}) disconnected: ${client.id}`);

    // Mettre à jour le statut utilisateur
    try {
      await this.usersService.update(userId, { isOnline: false, lastSeen: new Date() } as any);
    } catch (error) {
      this.logger.error(`Error updating user status: ${error.message}`);
    }

    // Retirer l'utilisateur de toutes les salles
    const rooms = this.userRooms.get(userId);
    if (rooms) {
      rooms.forEach((roomId) => {
        client.leave(`room:${roomId}`);
        // Retirer de la liste des utilisateurs en train de taper
        const typing = this.typingUsers.get(roomId);
        if (typing) {
          typing.delete(userId);
        }
      });
      this.userRooms.delete(userId);
    }

    this.connectedClients.delete(client.id);
    this.userSockets.delete(userId);

    // Notifier tous les clients qu'un utilisateur est hors ligne
    this.server.emit('userStatusChanged', {
      userId: userId,
      username: user.username,
      isOnline: false,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    this.logger.log(`Ping received from client: ${client.id}`);
    return {
      event: 'pong',
      data: {
        message: 'pong',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = (client as any).user;
      if (!user) {
        client.emit('error', {
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const userId = user.userId;
      const room = await this.roomsService.joinRoom(data.roomId, userId);

      // Rejoindre la salle Socket.IO
      client.join(`room:${data.roomId}`);

      // Garder une trace des salles de l'utilisateur
      if (!this.userRooms.has(userId)) {
        this.userRooms.set(userId, new Set());
      }
      this.userRooms.get(userId)?.add(data.roomId);

      // Notifier les autres membres de la salle
      this.server.to(`room:${data.roomId}`).emit('userJoinedRoom', {
        roomId: data.roomId,
        userId: userId,
        username: user.username,
        timestamp: new Date().toISOString(),
      });

      // Confirmer à l'utilisateur qu'il a rejoint
      client.emit('roomJoined', {
        roomId: data.roomId,
        room: room,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`User ${user.username} (${userId}) joined room ${data.roomId}`);
    } catch (error) {
      client.emit('error', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = (client as any).user;
      if (!user) {
        client.emit('error', {
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const userId = user.userId;
      await this.roomsService.leaveRoom(data.roomId, userId);

      // Quitter la salle Socket.IO
      client.leave(`room:${data.roomId}`);

      // Retirer la salle de la liste de l'utilisateur
      const userRooms = this.userRooms.get(userId);
      if (userRooms) {
        userRooms.delete(data.roomId);
      }

      // Retirer de la liste des utilisateurs en train de taper
      const typingSet = this.typingUsers.get(data.roomId);
      if (typingSet) {
        typingSet.delete(userId);
      }

      // Notifier les autres membres de la salle
      this.server.to(`room:${data.roomId}`).emit('userLeftRoom', {
        roomId: data.roomId,
        userId: userId,
        username: user.username,
        timestamp: new Date().toISOString(),
      });

      // Confirmer à l'utilisateur qu'il a quitté
      client.emit('roomLeft', {
        roomId: data.roomId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`User ${user.username} (${userId}) left room ${data.roomId}`);
    } catch (error) {
      client.emit('error', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { roomId?: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;
    if (!user) return;

    const userId = user.userId;
    const roomId = data.roomId || 'global';

    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Set());
    }

    const typingSet = this.typingUsers.get(roomId);

    if (data.isTyping) {
      typingSet.add(userId);
    } else {
      typingSet.delete(userId);
    }

    // Notifier les autres utilisateurs dans la salle
    if (roomId === 'global') {
      client.broadcast.emit('userTyping', {
        userId,
        username: user.username,
        isTyping: data.isTyping,
        roomId: null,
      });
    } else {
      this.server.to(`room:${roomId}`).emit('userTyping', {
        userId,
        username: user.username,
        isTyping: data.isTyping,
        roomId,
      });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: {
      content: string;
      roomId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = (client as any).user;
      if (!user) {
        client.emit('error', {
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Arrêter l'indicateur de frappe
      if (data.roomId) {
        const typingSet = this.typingUsers.get(data.roomId);
        if (typingSet) {
          typingSet.delete(user.userId);
          this.server.to(`room:${data.roomId}`).emit('userTyping', {
            userId: user.userId,
            username: user.username,
            isTyping: false,
            roomId: data.roomId,
          });
        }
      }

      // Créer le message via le service
      const message = await this.messagesService.create({
        content: data.content,
        userId: user.userId,
        username: user.username,
        roomId: data.roomId,
      });

      const messagePayload = {
        id: message.id,
        content: message.content,
        userId: message.userId,
        username: message.username,
        roomId: message.roomId,
        timestamp: message.createdAt || new Date(),
      };

      // Si le message est dans une salle, l'envoyer uniquement aux membres de la salle
      if (data.roomId) {
        this.server.to(`room:${data.roomId}`).emit('newMessage', messagePayload);
      } else {
        // Sinon, diffuser à tous les clients connectés
        this.server.emit('newMessage', messagePayload);
      }

      this.logger.log(
        `Message sent by ${user.username} in ${data.roomId || 'global'}`,
      );
    } catch (error) {
      client.emit('error', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('getRoomMessages')
  async handleGetRoomMessages(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const messages = await this.messagesService.findByRoomId(data.roomId);
      client.emit('roomMessages', {
        roomId: data.roomId,
        messages: messages,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      client.emit('error', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('getConnectedUsers')
  async handleGetConnectedUsers(@ConnectedSocket() client: Socket) {
    try {
      const onlineUserIds = Array.from(this.userSockets.keys());
      const users = await Promise.all(
        onlineUserIds.map(async (userId) => {
          const user = await this.usersService.findOne(userId);
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen,
          };
        }),
      );

      client.emit('connectedUsers', {
        users: users,
        count: users.length,
      });
    } catch (error) {
      client.emit('error', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('getRoomMembers')
  async handleGetRoomMembers(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const memberIds = await this.roomsService.getRoomMembers(data.roomId);
      // Enrichir avec les informations utilisateur et le statut en ligne
      const enrichedMembers = await Promise.all(
        memberIds.map(async (memberId) => {
          const user = await this.usersService.findOne(memberId);
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            isOnline: this.userSockets.has(memberId),
          };
        }),
      );
      client.emit('roomMembers', {
        roomId: data.roomId,
        members: enrichedMembers,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      client.emit('error', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

