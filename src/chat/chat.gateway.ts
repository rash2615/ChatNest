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
import { Logger } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { RoomsService } from '../rooms/rooms.service';

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

  constructor(
    private readonly messagesService: MessagesService,
    private readonly roomsService: RoomsService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
    
    // Notifier tous les clients qu'un nouvel utilisateur s'est connecté
    this.server.emit('userConnected', {
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
    
    // Retirer l'utilisateur de toutes les salles
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      const rooms = this.userRooms.get(userId);
      if (rooms) {
        rooms.forEach((roomId) => {
          client.leave(`room:${roomId}`);
        });
        this.userRooms.delete(userId);
      }
    }
    
    // Notifier tous les clients qu'un utilisateur s'est déconnecté
    this.server.emit('userDisconnected', {
      clientId: client.id,
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
    @MessageBody() data: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = this.roomsService.joinRoom(data.roomId, data.userId);
      
      // Rejoindre la salle Socket.IO
      client.join(`room:${data.roomId}`);
      
      // Garder une trace des salles de l'utilisateur
      if (!this.userRooms.has(data.userId)) {
        this.userRooms.set(data.userId, new Set());
      }
      this.userRooms.get(data.userId)?.add(data.roomId);
      
      // Notifier les autres membres de la salle
      this.server.to(`room:${data.roomId}`).emit('userJoinedRoom', {
        roomId: data.roomId,
        userId: data.userId,
        timestamp: new Date().toISOString(),
      });
      
      // Confirmer à l'utilisateur qu'il a rejoint
      client.emit('roomJoined', {
        roomId: data.roomId,
        room: room,
        timestamp: new Date().toISOString(),
      });
      
      this.logger.log(`User ${data.userId} joined room ${data.roomId}`);
    } catch (error) {
      client.emit('error', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.roomsService.leaveRoom(data.roomId, data.userId);
      
      // Quitter la salle Socket.IO
      client.leave(`room:${data.roomId}`);
      
      // Retirer la salle de la liste de l'utilisateur
      const userRooms = this.userRooms.get(data.userId);
      if (userRooms) {
        userRooms.delete(data.roomId);
      }
      
      // Notifier les autres membres de la salle
      this.server.to(`room:${data.roomId}`).emit('userLeftRoom', {
        roomId: data.roomId,
        userId: data.userId,
        timestamp: new Date().toISOString(),
      });
      
      // Confirmer à l'utilisateur qu'il a quitté
      client.emit('roomLeft', {
        roomId: data.roomId,
        timestamp: new Date().toISOString(),
      });
      
      this.logger.log(`User ${data.userId} left room ${data.roomId}`);
    } catch (error) {
      client.emit('error', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: {
      content: string;
      userId: string;
      username: string;
      roomId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Créer le message via le service
      const message = this.messagesService.create({
        content: data.content,
        userId: data.userId,
        username: data.username,
        roomId: data.roomId,
      });

      // Si le message est dans une salle, l'envoyer uniquement aux membres de la salle
      if (data.roomId) {
        this.server.to(`room:${data.roomId}`).emit('newMessage', {
          message: message,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Sinon, diffuser à tous les clients connectés
        this.server.emit('newMessage', {
          message: message,
          timestamp: new Date().toISOString(),
        });
      }

      this.logger.log(
        `Message sent by ${data.username} in ${data.roomId || 'global'}`,
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
      const messages = this.messagesService.findByRoomId(data.roomId);
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
  handleGetConnectedUsers(@ConnectedSocket() client: Socket) {
    const connectedUsers = Array.from(this.connectedClients.keys());
    client.emit('connectedUsers', {
      users: connectedUsers,
      count: connectedUsers.length,
    });
  }

  @SubscribeMessage('getRoomMembers')
  async handleGetRoomMembers(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const members = this.roomsService.getRoomMembers(data.roomId);
      client.emit('roomMembers', {
        roomId: data.roomId,
        members: members,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      client.emit('error', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private getUserIdFromSocket(client: Socket): string | null {
    // Récupérer l'ID utilisateur depuis les données du socket
    // Cela peut être passé lors de la connexion ou stocké dans les handshake data
    return (client.handshake.query?.userId as string) || null;
  }
}

