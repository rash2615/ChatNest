import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoomsService {
  private rooms: Room[] = [];

  create(createRoomDto: CreateRoomDto): Room {
    const existingRoom = this.rooms.find(
      (room) => room.name.toLowerCase() === createRoomDto.name.toLowerCase(),
    );
    if (existingRoom) {
      throw new ConflictException('Une salle avec ce nom existe déjà');
    }

    const room = new Room({
      id: uuidv4(),
      name: createRoomDto.name,
      description: createRoomDto.description,
      createdBy: createRoomDto.createdBy,
      members: [createRoomDto.createdBy],
    });

    this.rooms.push(room);
    return room;
  }

  findAll(): Room[] {
    return this.rooms;
  }

  findOne(id: string): Room {
    const room = this.rooms.find((room) => room.id === id);
    if (!room) {
      throw new NotFoundException(`Salle avec l'ID ${id} introuvable`);
    }
    return room;
  }

  findByUserId(userId: string): Room[] {
    return this.rooms.filter((room) => 
      room.members.includes(userId) || room.createdBy === userId
    );
  }

  update(id: string, updateRoomDto: UpdateRoomDto, userId: string): Room {
    const room = this.findOne(id);

    if (room.createdBy !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier cette salle');
    }

    if (updateRoomDto.name) {
      const existingRoom = this.rooms.find(
        (r) => r.name.toLowerCase() === updateRoomDto.name.toLowerCase() && r.id !== id,
      );
      if (existingRoom) {
        throw new ConflictException('Une salle avec ce nom existe déjà');
      }
      room.name = updateRoomDto.name;
    }

    if (updateRoomDto.description !== undefined) {
      room.description = updateRoomDto.description;
    }

    room.updatedAt = new Date();
    return room;
  }

  remove(id: string, userId: string): void {
    const room = this.findOne(id);

    if (room.createdBy !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à supprimer cette salle');
    }

    const roomIndex = this.rooms.findIndex((room) => room.id === id);
    this.rooms.splice(roomIndex, 1);
  }

  joinRoom(roomId: string, userId: string): Room {
    const room = this.findOne(roomId);

    if (room.members.includes(userId)) {
      throw new ConflictException('Vous êtes déjà membre de cette salle');
    }

    room.members.push(userId);
    room.updatedAt = new Date();
    return room;
  }

  leaveRoom(roomId: string, userId: string): Room {
    const room = this.findOne(roomId);

    if (room.createdBy === userId) {
      throw new ForbiddenException('Le créateur de la salle ne peut pas la quitter');
    }

    if (!room.members.includes(userId)) {
      throw new NotFoundException('Vous n\'êtes pas membre de cette salle');
    }

    room.members = room.members.filter((memberId) => memberId !== userId);
    room.updatedAt = new Date();
    return room;
  }

  getRoomMembers(roomId: string): string[] {
    const room = this.findOne(roomId);
    return room.members;
  }
}

