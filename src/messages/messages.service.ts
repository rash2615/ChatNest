import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from './entities/message.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MessagesService {
  private messages: Message[] = [];

  create(createMessageDto: CreateMessageDto): Message {
    const message = new Message({
      id: uuidv4(),
      content: createMessageDto.content,
      userId: createMessageDto.userId,
      username: createMessageDto.username,
      roomId: createMessageDto.roomId,
    });

    this.messages.push(message);
    return message;
  }

  findAll(roomId?: string): Message[] {
    if (roomId) {
      return this.messages.filter((message) => message.roomId === roomId);
    }
    return this.messages;
  }

  findOne(id: string): Message {
    const message = this.messages.find((message) => message.id === id);
    if (!message) {
      throw new NotFoundException(`Message avec l'ID ${id} introuvable`);
    }
    return message;
  }

  findByUserId(userId: string): Message[] {
    return this.messages.filter((message) => message.userId === userId);
  }

  findByRoomId(roomId: string): Message[] {
    return this.messages.filter((message) => message.roomId === roomId);
  }

  update(id: string, updateMessageDto: UpdateMessageDto, userId: string): Message {
    const message = this.findOne(id);

    // Vérifier que l'utilisateur est le propriétaire du message
    if (message.userId !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier ce message');
    }

    if (updateMessageDto.content) {
      message.content = updateMessageDto.content;
      message.updatedAt = new Date();
    }

    return message;
  }

  remove(id: string, userId: string): void {
    const message = this.findOne(id);

    // Vérifier que l'utilisateur est le propriétaire du message
    if (message.userId !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à supprimer ce message');
    }

    const messageIndex = this.messages.findIndex((message) => message.id === id);
    this.messages.splice(messageIndex, 1);
  }

  removeAllByRoomId(roomId: string): void {
    this.messages = this.messages.filter((message) => message.roomId !== roomId);
  }
}

