import { Controller, Get } from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { SharedService } from '@app/shared';

@Controller()
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly sharedService: SharedService,
  ) {}

  @MessagePattern({ cmd: 'messages' })
  getMessages(@Ctx() context: RmqContext, @Payload() payload: { id: number }) {
    this.sharedService.acknowledgeMessage(context);

    return this.chatService.getMessages(payload.id);
  }
}
