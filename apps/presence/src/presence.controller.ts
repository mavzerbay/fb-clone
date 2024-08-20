import { Controller, Get } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { Ctx, MessagePattern, RmqContext } from '@nestjs/microservices';
import { SharedService } from '@app/shared';
import { AuthGuard } from '@app/shared/auth.guard';

@Controller()
export class PresenceController {
  constructor(
    private readonly presenceService: PresenceService,
    private readonly sharedService: SharedService,
    private readonly authGuard: AuthGuard,
  ) {}

  @MessagePattern({ cmd: 'get-presence' })
  async getUsers(@Ctx() context: RmqContext) {
    this.sharedService.acknowledgeMessage(context);

    // TEMP
    console.log(this.authGuard.hasJwt());

    return this.presenceService.getHello();
  }
}
