import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const existingRoom = await this.roomRepository.findOne({
      where: { name: createRoomDto.name },
    });
    if (existingRoom) {
      throw new ConflictException('Une salle avec ce nom existe déjà');
    }

    const room = this.roomRepository.create({
      name: createRoomDto.name,
      description: createRoomDto.description,
      createdBy: createRoomDto.createdBy,
    });

    const creator = await this.userRepository.findOne({
      where: { id: createRoomDto.createdBy },
    });
    if (creator) {
      room.members = [creator];
    }

    return await this.roomRepository.save(room);
  }

  async findAll(): Promise<Room[]> {
    return await this.roomRepository.find({
      relations: ['members'],
    });
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['members'],
    });
    if (!room) {
      throw new NotFoundException(`Salle avec l'ID ${id} introuvable`);
    }
    return room;
  }

  async findByUserId(userId: string): Promise<Room[]> {
    return await this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.members', 'member')
      .where('room.createdBy = :userId', { userId })
      .orWhere('member.id = :userId', { userId })
      .getMany();
  }

  async update(id: string, updateRoomDto: UpdateRoomDto, userId: string): Promise<Room> {
    const room = await this.findOne(id);

    if (room.createdBy !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier cette salle');
    }

    if (updateRoomDto.name) {
      const existingRoom = await this.roomRepository.findOne({
        where: { name: updateRoomDto.name },
      });
      if (existingRoom && existingRoom.id !== id) {
        throw new ConflictException('Une salle avec ce nom existe déjà');
      }
      room.name = updateRoomDto.name;
    }

    if (updateRoomDto.description !== undefined) {
      room.description = updateRoomDto.description;
    }

    return await this.roomRepository.save(room);
  }

  async remove(id: string, userId: string): Promise<void> {
    const room = await this.findOne(id);

    if (room.createdBy !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à supprimer cette salle');
    }

    await this.roomRepository.remove(room);
  }

  async joinRoom(roomId: string, userId: string): Promise<Room> {
    const room = await this.findOne(roomId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} introuvable`);
    }

    const isMember = room.members.some((member) => member.id === userId);
    if (isMember) {
      throw new ConflictException('Vous êtes déjà membre de cette salle');
    }

    room.members.push(user);
    return await this.roomRepository.save(room);
  }

  async leaveRoom(roomId: string, userId: string): Promise<Room> {
    const room = await this.findOne(roomId);

    if (room.createdBy === userId) {
      throw new ForbiddenException('Le créateur de la salle ne peut pas la quitter');
    }

    room.members = room.members.filter((member) => member.id !== userId);
    return await this.roomRepository.save(room);
  }

  async getRoomMembers(roomId: string): Promise<string[]> {
    const room = await this.findOne(roomId);
    return room.members.map((member) => member.id);
  }
}

