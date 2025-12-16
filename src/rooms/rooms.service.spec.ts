import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';

describe('RoomsService', () => {
  let service: RoomsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomsService],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a room successfully', () => {
      const createRoomDto = {
        name: 'Test Room',
        description: 'Test Description',
        createdBy: 'user-1',
      };

      const room = service.create(createRoomDto);

      expect(room).toBeDefined();
      expect(room.name).toBe('Test Room');
      expect(room.createdBy).toBe('user-1');
      expect(room.members).toContain('user-1');
    });

    it('should throw ConflictException if room name already exists', () => {
      const createRoomDto = {
        name: 'Test Room',
        createdBy: 'user-1',
      };

      service.create(createRoomDto);

      expect(() => {
        service.create({
          ...createRoomDto,
          createdBy: 'user-2',
        });
      }).toThrow(ConflictException);
    });
  });

  describe('joinRoom', () => {
    it('should add user to room members', () => {
      const room = service.create({
        name: 'Test Room',
        createdBy: 'user-1',
      });

      const updatedRoom = service.joinRoom(room.id, 'user-2');

      expect(updatedRoom.members).toContain('user-2');
      expect(updatedRoom.members).toHaveLength(2);
    });

    it('should throw ConflictException if user is already a member', () => {
      const room = service.create({
        name: 'Test Room',
        createdBy: 'user-1',
      });

      expect(() => {
        service.joinRoom(room.id, 'user-1');
      }).toThrow(ConflictException);
    });
  });

  describe('leaveRoom', () => {
    it('should remove user from room members', () => {
      const room = service.create({
        name: 'Test Room',
        createdBy: 'user-1',
      });

      service.joinRoom(room.id, 'user-2');
      const updatedRoom = service.leaveRoom(room.id, 'user-2');

      expect(updatedRoom.members).not.toContain('user-2');
      expect(updatedRoom.members).toHaveLength(1);
    });

    it('should throw ForbiddenException if creator tries to leave', () => {
      const room = service.create({
        name: 'Test Room',
        createdBy: 'user-1',
      });

      expect(() => {
        service.leaveRoom(room.id, 'user-1');
      }).toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update room if user is creator', () => {
      const room = service.create({
        name: 'Test Room',
        createdBy: 'user-1',
      });

      const updatedRoom = service.update(room.id, { name: 'Updated Room' }, 'user-1');

      expect(updatedRoom.name).toBe('Updated Room');
    });

    it('should throw ForbiddenException if user is not creator', () => {
      const room = service.create({
        name: 'Test Room',
        createdBy: 'user-1',
      });

      expect(() => {
        service.update(room.id, { name: 'Updated Room' }, 'user-2');
      }).toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove room if user is creator', () => {
      const room = service.create({
        name: 'Test Room',
        createdBy: 'user-1',
      });

      service.remove(room.id, 'user-1');

      expect(() => {
        service.findOne(room.id);
      }).toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not creator', () => {
      const room = service.create({
        name: 'Test Room',
        createdBy: 'user-1',
      });

      expect(() => {
        service.remove(room.id, 'user-2');
      }).toThrow(ForbiddenException);
    });
  });
});

