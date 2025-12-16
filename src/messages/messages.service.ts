import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    const message = this.messageRepository.create(createMessageDto);
    return await this.messageRepository.save(message);
  }

  async findAll(roomId?: string): Promise<Message[]> {
    if (roomId) {
      return await this.messageRepository.find({
        where: { roomId },
        order: { createdAt: 'ASC' },
      });
    }
    return await this.messageRepository.find({
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messageRepository.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message avec l'ID ${id} introuvable`);
    }
    return message;
  }

  async findByUserId(userId: string): Promise<Message[]> {
    return await this.messageRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  async findByRoomId(roomId: string): Promise<Message[]> {
    return await this.messageRepository.find({
      where: { roomId },
      order: { createdAt: 'ASC' },
    });
  }

  async update(id: string, updateMessageDto: UpdateMessageDto, userId: string): Promise<Message> {
    const message = await this.findOne(id);

    if (message.userId !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier ce message');
    }

    if (updateMessageDto.content) {
      message.content = updateMessageDto.content;
    }

    return await this.messageRepository.save(message);
  }

  async remove(id: string, userId: string): Promise<void> {
    const message = await this.findOne(id);

    if (message.userId !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à supprimer ce message');
    }

    await this.messageRepository.remove(message);
  }

  async removeAllByRoomId(roomId: string): Promise<void> {
    await this.messageRepository.delete({ roomId });
  }
}

