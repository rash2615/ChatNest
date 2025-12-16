import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatGateway],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
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

  describe('handleMessage', () => {
    it('should broadcast message to all clients', () => {
      const mockClient = {
        id: 'test-client-id',
        emit: jest.fn(),
      } as any;

      gateway.server = {
        emit: jest.fn(),
      } as any;

      const messageData = {
        message: 'Hello world',
        username: 'testuser',
      };

      gateway.handleMessage(messageData, mockClient);

      expect(gateway.server.emit).toHaveBeenCalledWith('message', {
        clientId: 'test-client-id',
        message: 'Hello world',
        username: 'testuser',
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

      gateway['connectedClients'].set('client-1', {} as any);
      gateway['connectedClients'].set('client-2', {} as any);

      gateway.handleGetConnectedUsers(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('connectedUsers', {
        users: ['client-1', 'client-2'],
        count: 2,
      });
    });
  });
});

