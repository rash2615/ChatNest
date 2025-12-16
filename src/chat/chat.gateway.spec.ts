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
            joinRoom: jest.fn(),
            leaveRoom: jest.fn(),
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

  describe('handleJoinRoom', () => {
    it('should join a room successfully', async () => {
      const mockRoom = {
        id: 'room-1',
        name: 'Test Room',
        members: ['user-1'],
      };

      const mockClient = {
        id: 'client-1',
        join: jest.fn(),
        emit: jest.fn(),
      } as any;

      const mockServer = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn(),
        }),
        emit: jest.fn(),
      };

      gateway.server = mockServer as any;
      jest.spyOn(roomsService, 'joinRoom').mockReturnValue(mockRoom as any);

      await gateway.handleJoinRoom(
        { roomId: 'room-1', userId: 'user-1' },
        mockClient,
      );

      expect(roomsService.joinRoom).toHaveBeenCalledWith('room-1', 'user-1');
      expect(mockClient.join).toHaveBeenCalledWith('room:room-1');
      expect(mockClient.emit).toHaveBeenCalledWith('roomJoined', expect.any(Object));
    });
  });

  describe('handleSendMessage', () => {
    it('should send a message successfully', async () => {
      const mockMessage = {
        id: 'msg-1',
        content: 'Hello',
        userId: 'user-1',
        username: 'testuser',
        roomId: 'room-1',
      };

      const mockClient = {
        id: 'client-1',
        emit: jest.fn(),
      } as any;

      gateway.server = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn(),
        }),
        emit: jest.fn(),
      } as any;

      jest.spyOn(messagesService, 'create').mockReturnValue(mockMessage as any);

      await gateway.handleSendMessage(
        {
          content: 'Hello',
          userId: 'user-1',
          username: 'testuser',
          roomId: 'room-1',
        },
        mockClient,
      );

      expect(messagesService.create).toHaveBeenCalled();
    });
  });
});
