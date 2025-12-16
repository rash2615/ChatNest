import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserWithoutPassword } from './entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  private users: User[] = [];

  create(createUserDto: CreateUserDto): UserWithoutPassword {
    const existingUser = this.users.find(
      (user) => user.email === createUserDto.email,
    );
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const existingUsername = this.users.find(
      (user) => user.username === createUserDto.username,
    );
    if (existingUsername) {
      throw new ConflictException('Ce nom d\'utilisateur est déjà pris');
    }

    const user = new User({
      id: uuidv4(),
      username: createUserDto.username,
      email: createUserDto.email,
      password: createUserDto.password,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
    });

    this.users.push(user);
    return this.sanitizeUser(user);
  }

  findAll(): UserWithoutPassword[] {
    return this.users.map((user) => this.sanitizeUser(user));
  }

  findOne(id: string): UserWithoutPassword {
    const user = this.users.find((user) => user.id === id);
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable`);
    }
    return this.sanitizeUser(user);
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((user) => user.email === email);
  }

  findByUsername(username: string): User | undefined {
    return this.users.find((user) => user.username === username);
  }

  update(id: string, updateUserDto: UpdateUserDto): UserWithoutPassword {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable`);
    }

    if (updateUserDto.email) {
      const existingUser = this.users.find(
        (user) => user.email === updateUserDto.email && user.id !== id,
      );
      if (existingUser) {
        throw new ConflictException('Un utilisateur avec cet email existe déjà');
      }
    }

    if (updateUserDto.username) {
      const existingUsername = this.users.find(
        (user) => user.username === updateUserDto.username && user.id !== id,
      );
      if (existingUsername) {
        throw new ConflictException('Ce nom d\'utilisateur est déjà pris');
      }
    }

    const user = this.users[userIndex];
    Object.assign(user, updateUserDto);
    user.updatedAt = new Date();

    return this.sanitizeUser(user);
  }

  remove(id: string): void {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable`);
    }
    this.users.splice(userIndex, 1);
  }

  private sanitizeUser(user: User): UserWithoutPassword {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

