import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [MessagesModule, RoomsModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
