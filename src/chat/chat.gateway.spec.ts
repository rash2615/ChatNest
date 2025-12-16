import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { MessagesService } from '../messages/messages.service';
import { RoomsService } from '../rooms/rooms.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let messagesService: MessagesService;
  let roomsService: RoomsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: MessagesService,
          useValue: {
            create: jest.fn(),
            findByRoomId: jest.fn(),
          },
        },
        {
          provide: RoomsService,
          useValue: {
            getRoomMembers: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    messagesService = module.get<MessagesService>(MessagesService);
    roomsService = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should add client to connectedClients and emit userConnected', () => {
      const mockClient = {
        id: 'test-client-id',
        emit: jest.fn(),
      } as any;

      gateway.server = {
        emit: jest.fn(),
      } as any;

      gateway.handleConnection(mockClient);

      expect(gateway['connectedClients'].has('test-client-id')).toBe(true);
      expect(gateway.server.emit).toHaveBeenCalledWith('userConnected', expect.any(Object));
    });
  });

  describe('handleDisconnect', () => {
    it('should remove client from connectedClients and emit userDisconnected', () => {
      const mockClient = {
        id: 'test-client-id',
        emit: jest.fn(),
      } as any;

      gateway['connectedClients'].set('test-client-id', mockClient);
      gateway.server = {
        emit: jest.fn(),
      } as any;

      gateway.handleDisconnect(mockClient);

      expect(gateway['connectedClients'].has('test-client-id')).toBe(false);
      expect(gateway.server.emit).toHaveBeenCalledWith('userDisconnected', expect.any(Object));
    });
  });

  describe('handlePing', () => {
    it('should return pong event', () => {
      const mockClient = {
        id: 'test-client-id',
        emit: jest.fn(),
      } as any;

      const result = gateway.handlePing(mockClient);

      expect(result).toBeDefined();
      expect(result.event).toBe('pong');
      expect(result.data.message).toBe('pong');
    });
  });

  describe('handleSendMessage', () => {
    it('should broadcast message to all clients', async () => {
      const mockClient = {
        id: 'test-client-id',
        emit: jest.fn(),
      } as any;

      gateway.server = {
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
      } as any;

      const messageData = {
        content: 'Hello world',
        userId: 'user-1',
        username: 'testuser',
      };

      const mockMessage = {
        id: 'msg-1',
        content: 'Hello world',
        userId: 'user-1',
        username: 'testuser',
        timestamp: new Date(),
      };

      jest.spyOn(messagesService, 'create').mockResolvedValue(mockMessage as any);

      await gateway.handleSendMessage(messageData, mockClient);

      expect(messagesService.create).toHaveBeenCalledWith({
        content: 'Hello world',
        userId: 'user-1',
        username: 'testuser',
      });
      expect(gateway.server.emit).toHaveBeenCalledWith('newMessage', {
        message: mockMessage,
        timestamp: expect.any(String),
      });
    });
  });

  describe('handleGetConnectedUsers', () => {
    it('should emit connectedUsers to client', () => {
      const mockClient = {
        id: 'test-client-id',
        emit: jest.fn(),
      } as any;

      const mockClient1 = { id: 'client-1' } as any;
      const mockClient2 = { id: 'client-2' } as any;

      gateway['connectedClients'].set('client-1', mockClient1);
      gateway['connectedClients'].set('client-2', mockClient2);

      gateway.handleGetConnectedUsers(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('connectedUsers', {
        users: ['client-1', 'client-2'],
        count: 2,
      });
    });
  });
});


