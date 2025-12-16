import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    // Utiliser l'ID de l'utilisateur authentifié
    return this.messagesService.create({
      ...createMessageDto,
      userId: req.user.userId || createMessageDto.userId,
    });
  }

  @Get()
  findAll(@Query('roomId') roomId?: string) {
    return this.messagesService.findAll(roomId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Request() req,
  ) {
    return this.messagesService.update(id, updateMessageDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req) {
    return this.messagesService.remove(id, req.user.userId);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.messagesService.findByUserId(userId);
  }

  @Get('room/:roomId')
  findByRoomId(@Param('roomId') roomId: string) {
    return this.messagesService.findByRoomId(roomId);
  }
}

