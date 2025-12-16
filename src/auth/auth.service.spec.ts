import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      };

      jest.spyOn(usersService, 'findByEmail').mockReturnValue(mockUser as any);

      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await service.login(loginDto);

      expect(result).toBeDefined();
      expect(result.message).toBe('Connexion réussie');
      expect(result.user).toBeDefined();
      expect('password' in result.user).toBe(false);
    });

    it('should throw UnauthorizedException with invalid email', async () => {
      jest.spyOn(usersService, 'findByEmail').mockReturnValue(undefined);

      const loginDto = {
        email: 'wrong@example.com',
        password: 'password123',
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      };

      jest.spyOn(usersService, 'findByEmail').mockReturnValue(mockUser as any);

      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const registerDto = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '1',
        ...registerDto,
      };

      jest.spyOn(usersService, 'create').mockReturnValue(mockUser as any);

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(result.message).toBe('Inscription réussie');
      expect(result.user).toBeDefined();
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
      };

      jest
        .spyOn(usersService, 'create')
        .mockImplementation(() => {
          throw new ConflictException('Un utilisateur avec cet email existe déjà');
        });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});

