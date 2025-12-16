import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('RoomsController', () => {
  let controller: RoomsController;
  let service: RoomsService;

  const mockRoomsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
    getRoomMembers: jest.fn(),
    findByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        {
          provide: RoomsService,
          useValue: mockRoomsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RoomsController>(RoomsController);
    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a room', async () => {
      const createRoomDto = {
        name: 'Test Room',
        createdBy: 'user-1',
      };

      const mockResult = { id: '1', ...createRoomDto };
      mockRoomsService.create.mockResolvedValue(mockResult);

      const req = { user: { userId: 'user-1' } };
      const result = await controller.create(createRoomDto, req as any);

      expect(service.create).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('joinRoom', () => {
    it('should join a room', async () => {
      const mockRoom = { id: 'room-1', name: 'Test Room', members: [] };
      mockRoomsService.joinRoom.mockResolvedValue(mockRoom);

      const req = { user: { userId: 'user-1' } };
      const result = await controller.joinRoom('room-1', req as any);

      expect(service.joinRoom).toHaveBeenCalledWith('room-1', 'user-1');
      expect(result).toEqual(mockRoom);
    });
  });
});

