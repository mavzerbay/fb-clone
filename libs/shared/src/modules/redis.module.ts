import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { redisStore } from 'cache-manager-redis-yet';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisCacheService } from '../services/redis.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          url: configService.get('REDIS_URI'),
          ttl: 5000,
        }),
      }),
      isGlobal: true,
      inject: [ConfigService],
    }),
  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class RedisModule {}
