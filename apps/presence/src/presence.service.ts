import { RedisCacheService } from '@app/shared';
import { Injectable } from '@nestjs/common';
import { ActiveUser } from './interfaces/active_user.interface';

@Injectable()
export class PresenceService {
  constructor(private readonly redisService: RedisCacheService) {}
  getFoo() {
    console.debug('NOT CACHED');
    return { foo: 'bar' };
  }

  async getActiveUser(id: number) {
    const user = await this.redisService.get(`user ${id}`);

    return user as ActiveUser | undefined;
  }
}
