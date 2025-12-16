import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createRoomDto: CreateRoomDto, @Request() req) {
    return this.roomsService.create({
      ...createRoomDto,
      createdBy: req.user.userId || createRoomDto.createdBy,
    });
  }

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string, @Request() req) {
    const requestedUserId = userId;
    const authenticatedUserId = req.user.userId;
    
    if (requestedUserId !== authenticatedUserId) {
      return this.roomsService.findByUserId(authenticatedUserId);
    }
    
    return this.roomsService.findByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @Request() req,
  ) {
    return this.roomsService.update(id, updateRoomDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req) {
    return this.roomsService.remove(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  joinRoom(@Param('id') id: string, @Request() req) {
    return this.roomsService.joinRoom(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  leaveRoom(@Param('id') id: string, @Request() req) {
    return this.roomsService.leaveRoom(id, req.user.userId);
  }

  @Get(':id/members')
  getRoomMembers(@Param('id') id: string) {
    return this.roomsService.getRoomMembers(id);
  }
}

