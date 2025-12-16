import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('MessagesService', () => {
  let service: MessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessagesService],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a message successfully', () => {
      const createMessageDto = {
        content: 'Hello world',
        userId: 'user-1',
        username: 'testuser',
      };

      const message = service.create(createMessageDto);

      expect(message).toBeDefined();
      expect(message.content).toBe('Hello world');
      expect(message.userId).toBe('user-1');
      expect(message.username).toBe('testuser');
      expect(message.id).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all messages', () => {
      service.create({
        content: 'Message 1',
        userId: 'user-1',
        username: 'user1',
      });

      service.create({
        content: 'Message 2',
        userId: 'user-2',
        username: 'user2',
      });

      const messages = service.findAll();

      expect(messages).toHaveLength(2);
    });

    it('should filter messages by roomId', () => {
      service.create({
        content: 'Message 1',
        userId: 'user-1',
        username: 'user1',
        roomId: 'room-1',
      });

      service.create({
        content: 'Message 2',
        userId: 'user-2',
        username: 'user2',
        roomId: 'room-2',
      });

      const messages = service.findAll('room-1');

      expect(messages).toHaveLength(1);
      expect(messages[0].roomId).toBe('room-1');
    });
  });

  describe('findOne', () => {
    it('should return a message by id', () => {
      const createdMessage = service.create({
        content: 'Test message',
        userId: 'user-1',
        username: 'user1',
      });

      const message = service.findOne(createdMessage.id);

      expect(message).toBeDefined();
      expect(message.id).toBe(createdMessage.id);
    });

    it('should throw NotFoundException if message does not exist', () => {
      expect(() => {
        service.findOne('non-existent-id');
      }).toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a message', () => {
      const createdMessage = service.create({
        content: 'Original message',
        userId: 'user-1',
        username: 'user1',
      });

      const updatedMessage = service.update(
        createdMessage.id,
        { content: 'Updated message' },
        'user-1',
      );

      expect(updatedMessage.content).toBe('Updated message');
    });

    it('should throw ForbiddenException if user is not the owner', () => {
      const createdMessage = service.create({
        content: 'Original message',
        userId: 'user-1',
        username: 'user1',
      });

      expect(() => {
        service.update(createdMessage.id, { content: 'Updated' }, 'user-2');
      }).toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a message', () => {
      const createdMessage = service.create({
        content: 'Test message',
        userId: 'user-1',
        username: 'user1',
      });

      service.remove(createdMessage.id, 'user-1');

      expect(() => {
        service.findOne(createdMessage.id);
      }).toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', () => {
      const createdMessage = service.create({
        content: 'Test message',
        userId: 'user-1',
        username: 'user1',
      });

      expect(() => {
        service.remove(createdMessage.id, 'user-2');
      }).toThrow(ForbiddenException);
    });
  });
});

