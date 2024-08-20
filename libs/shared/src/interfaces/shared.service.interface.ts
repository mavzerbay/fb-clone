import { RmqOptions } from '@nestjs/microservices';

export interface SharedServiceInterface {
  getRmqOptions(queue: string): RmqOptions;
  acknowledgeMessage(context: any): void;
}
