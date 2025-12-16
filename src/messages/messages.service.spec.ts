import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessagesService } from './messages.service';
import { Message } from './entities/message.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('MessagesService', () => {
  let service: MessagesService;
  let repository: Repository<Message>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getRepositoryToken(Message),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    repository = module.get<Repository<Message>>(getRepositoryToken(Message));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a message successfully', async () => {
      const createMessageDto = {
        content: 'Hello world',
        userId: 'user-1',
        username: 'testuser',
        roomId: 'room-1',
      };

      const mockMessage = {
        id: '1',
        ...createMessageDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockMessage);
      mockRepository.save.mockResolvedValue(mockMessage);

      const result = await service.create(createMessageDto);

      expect(result).toBeDefined();
      expect(result.content).toBe('Hello world');
    });
  });

  describe('findOne', () => {
    it('should return a message by id', async () => {
      const mockMessage = {
        id: '1',
        content: 'Test message',
        userId: 'user-1',
        username: 'testuser',
      };

      mockRepository.findOne.mockResolvedValue(mockMessage);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if message does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a message if user is owner', async () => {
      const mockMessage = {
        id: '1',
        content: 'Original',
        userId: 'user-1',
        username: 'testuser',
      };

      mockRepository.findOne.mockResolvedValue(mockMessage);
      mockRepository.save.mockResolvedValue({ ...mockMessage, content: 'Updated' });

      const result = await service.update('1', { content: 'Updated' }, 'user-1');

      expect(result.content).toBe('Updated');
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const mockMessage = {
        id: '1',
        content: 'Original',
        userId: 'user-1',
        username: 'testuser',
      };

      mockRepository.findOne.mockResolvedValue(mockMessage);

      await expect(
        service.update('1', { content: 'Updated' }, 'user-2'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

