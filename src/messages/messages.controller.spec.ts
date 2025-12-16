import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('MessagesController', () => {
  let controller: MessagesController;
  let service: MessagesService;

  const mockMessagesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByUserId: jest.fn(),
    findByRoomId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: mockMessagesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MessagesController>(MessagesController);
    service = module.get<MessagesService>(MessagesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a message', async () => {
      const createMessageDto = {
        content: 'Hello',
        userId: 'user-1',
        username: 'testuser',
      };

      const mockResult = { id: '1', ...createMessageDto };
      mockMessagesService.create.mockResolvedValue(mockResult);

      const req = { user: { userId: 'user-1' } };
      const result = await controller.create(createMessageDto, req as any);

      expect(service.create).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should return all messages', async () => {
      const mockMessages = [
        { id: '1', content: 'Message 1' },
        { id: '2', content: 'Message 2' },
      ];

      mockMessagesService.findAll.mockResolvedValue(mockMessages);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockMessages);
    });
  });
});

