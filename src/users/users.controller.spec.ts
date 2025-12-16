import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', () => {
      const createUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = controller.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
      expect('password' in result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', () => {
      service.create({
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123',
      });

      const result = controller.findAll();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', () => {
      const createdUser = service.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const result = controller.findOne(createdUser.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdUser.id);
    });
  });

  describe('update', () => {
    it('should update a user', () => {
      const createdUser = service.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const result = controller.update(createdUser.id, {
        username: 'updateduser',
      });

      expect(result.username).toBe('updateduser');
    });
  });

  describe('remove', () => {
    it('should remove a user', () => {
      const createdUser = service.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(() => {
        controller.remove(createdUser.id);
      }).not.toThrow();
    });
  });
});

