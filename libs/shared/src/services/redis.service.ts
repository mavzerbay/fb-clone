import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RedisCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get(key: string): Promise<any> {
    console.debug(`GET ${key} from REDIS`);
    return await this.cache.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    console.debug(`SET ${key} in REDIS`);
    await this.cache.set(key, value);
  }

  async del(key: string): Promise<void> {
    console.debug(`DEL ${key} from REDIS`);
    await this.cache.del(key);
  }
}
