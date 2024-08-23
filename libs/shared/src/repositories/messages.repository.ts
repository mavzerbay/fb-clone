import { Injectable } from '@nestjs/common';
import { BaseAbstractRepository } from './base/base.abstract.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessagesRepositoryInterface } from '../interfaces/messages.repository.interface';
import { MessageEntity } from '../entities/message.entity';

@Injectable()
export class MessagesRepository
  extends BaseAbstractRepository<MessageEntity>
  implements MessagesRepositoryInterface
{
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messagesRepository: Repository<MessageEntity>,
  ) {
    super(messagesRepository);
  }
}
