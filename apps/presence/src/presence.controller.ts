import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { PresenceService } from './presence.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { SharedService, RedisCacheService } from '@app/shared';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller()
export class PresenceController {
  constructor(
    private readonly redisService: RedisCacheService,
    private readonly presenceService: PresenceService,
    private readonly sharedService: SharedService,
  ) {}

  @MessagePattern({ cmd: 'get-presence' })
  @UseInterceptors(CacheInterceptor)
  async getFoo(@Ctx() context: RmqContext) {
    this.sharedService.acknowledgeMessage(context);

    const foo = await this.redisService.get('foo');

    if (foo) {
      console.debug('CACHED');
      return foo;
    }

    const f = await this.presenceService.getFoo();

    await this.redisService.set('foo', f);

    return f;
  }

  @MessagePattern({ cmd: 'get-active-user' })
  async getActiveUser(
    @Ctx() context: RmqContext,
    @Payload() payload: { id: number },
  ) {
    this.sharedService.acknowledgeMessage(context);

    return this.presenceService.getActiveUser(payload.id);
  }
}
