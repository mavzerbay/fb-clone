import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Milliseconds } from 'cache-manager';

@Injectable()
export class RedisCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string): Promise<any> {
    console.debug(`GET ${key} from REDIS`);
    return await this.cache.get<T>(key);
  }

  async set(key: string, value: any, ttl?: Milliseconds): Promise<void> {
    console.debug(`SET ${key} in REDIS`);
    await this.cache.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    console.debug(`DEL ${key} from REDIS`);
    await this.cache.del(key);
  }

  async reset(): Promise<void> {
    console.debug(`RESET REDIS`);
    await this.cache.reset();
  }
}
