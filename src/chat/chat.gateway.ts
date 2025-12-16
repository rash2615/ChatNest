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

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { message: string; username?: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Message received from ${client.id}: ${data.message}`);
    
    // Diffuser le message à tous les clients connectés
    this.server.emit('message', {
      clientId: client.id,
      message: data.message,
      username: data.username || 'Anonymous',
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('getConnectedUsers')
  handleGetConnectedUsers(@ConnectedSocket() client: Socket) {
    const connectedUsers = Array.from(this.connectedClients.keys());
    client.emit('connectedUsers', {
      users: connectedUsers,
      count: connectedUsers.length,
    });
  }
}

