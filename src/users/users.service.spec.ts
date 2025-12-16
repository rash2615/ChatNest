import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user successfully', () => {
      const createUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = service.create(createUserDto);

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect('password' in user).toBe(false); // Password should be hidden
      expect(user.id).toBeDefined();
    });

    it('should throw ConflictException if email already exists', () => {
      const createUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      service.create(createUserDto);

      expect(() => {
        service.create({
          ...createUserDto,
          username: 'anotheruser',
        });
      }).toThrow(ConflictException);
    });

    it('should throw ConflictException if username already exists', () => {
      const createUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      service.create(createUserDto);

      expect(() => {
        service.create({
          ...createUserDto,
          email: 'another@example.com',
        });
      }).toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return an array of users without passwords', () => {
      service.create({
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123',
      });

      service.create({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password456',
      });

      const users = service.findAll();

      expect(users).toHaveLength(2);
      users.forEach((user) => {
        expect('password' in user).toBe(false);
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', () => {
      const createdUser = service.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const user = service.findOne(createdUser.id);

      expect(user).toBeDefined();
      expect(user.id).toBe(createdUser.id);
      expect('password' in user).toBe(false);
    });

    it('should throw NotFoundException if user does not exist', () => {
      expect(() => {
        service.findOne('non-existent-id');
      }).toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user', () => {
      const createdUser = service.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const updatedUser = service.update(createdUser.id, {
        username: 'updateduser',
      });

      expect(updatedUser.username).toBe('updateduser');
      expect(updatedUser.email).toBe('test@example.com');
    });

    it('should throw NotFoundException if user does not exist', () => {
      expect(() => {
        service.update('non-existent-id', { username: 'newuser' });
      }).toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a user', () => {
      const createdUser = service.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      service.remove(createdUser.id);

      expect(() => {
        service.findOne(createdUser.id);
      }).toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user does not exist', () => {
      expect(() => {
        service.remove('non-existent-id');
      }).toThrow(NotFoundException);
    });
  });
});

