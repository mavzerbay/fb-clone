import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceService {
  getFoo() {
    console.debug('NOT CACHED');
    return { foo: 'bar' };
  }
}
