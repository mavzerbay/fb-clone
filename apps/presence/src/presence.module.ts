import { Module } from '@nestjs/common';

import { SharedModule, RedisModule } from '@app/shared';

import { PresenceController } from './presence.controller';
import { PresenceService } from './presence.service';

@Module({
  imports: [
    RedisModule,
    SharedModule.registerRmq('AUTH_SERVICE', process.env.RABBITMQ_AUTH_QUEUE),
  ],
  controllers: [PresenceController],
  providers: [PresenceService],
})
export class PresenceModule {}
