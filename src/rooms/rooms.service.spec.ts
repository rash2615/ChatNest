import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomsService } from './rooms.service';
import { Room } from './entities/room.entity';
import { User } from '../users/entities/user.entity';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';

describe('RoomsService', () => {
  let service: RoomsService;
  let roomRepository: Repository<Room>;
  let userRepository: Repository<User>;

  const mockRoomRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: getRepositoryToken(Room),
          useValue: mockRoomRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    roomRepository = module.get<Repository<Room>>(getRepositoryToken(Room));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a room successfully', async () => {
      const createRoomDto = {
        name: 'Test Room',
        description: 'Test Description',
        createdBy: 'user-1',
      };

      const mockRoom = {
        id: '1',
        ...createRoomDto,
        members: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRoomRepository.findOne.mockResolvedValue(null);
      mockRoomRepository.create.mockReturnValue(mockRoom);
      mockUserRepository.findOne.mockResolvedValue({ id: 'user-1' });
      mockRoomRepository.save.mockResolvedValue(mockRoom);

      const result = await service.create(createRoomDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Room');
    });

    it('should throw ConflictException if room name already exists', async () => {
      const createRoomDto = {
        name: 'Existing Room',
        createdBy: 'user-1',
      };

      mockRoomRepository.findOne.mockResolvedValue({ id: '1', name: 'Existing Room' });

      await expect(service.create(createRoomDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('joinRoom', () => {
    it('should add user to room members', async () => {
      const mockRoom = {
        id: 'room-1',
        name: 'Test Room',
        members: [],
      };

      const mockUser = {
        id: 'user-1',
        username: 'testuser',
      };

      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRoomRepository.save.mockResolvedValue({
        ...mockRoom,
        members: [mockUser],
      });

      const result = await service.joinRoom('room-1', 'user-1');

      expect(result.members).toContainEqual(mockUser);
    });

    it('should throw ConflictException if user is already a member', async () => {
      const mockRoom = {
        id: 'room-1',
        name: 'Test Room',
        members: [{ id: 'user-1' }],
      };

      mockRoomRepository.findOne.mockResolvedValue(mockRoom);

      await expect(service.joinRoom('room-1', 'user-1')).rejects.toThrow(ConflictException);
    });
  });
});

