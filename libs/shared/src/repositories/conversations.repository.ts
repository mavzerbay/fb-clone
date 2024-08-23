import { InjectRepository } from '@nestjs/typeorm';
import { ConversationEntity } from '../entities/conversation.entity';
import { ConversationsRepositoryInterface } from '../interfaces/conversations.repository.interface';
import { BaseAbstractRepository } from './base/base.abstract.repository';
import { Repository } from 'typeorm';

export class ConversationsRepository
  extends BaseAbstractRepository<ConversationEntity>
  implements ConversationsRepositoryInterface
{
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
  ) {
    super(conversationRepository);
  }

  public async findConversation(
    userId: number,
    friendId: number,
  ): Promise<ConversationEntity | undefined> {
    return await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoin('conversation.users', 'users')
      .where('users.id = :userId', { userId })
      .orWhere('users.id = :friendId', { friendId })
      .groupBy('conversation.id')
      .having('COUNT(*) > 1')
      .getOne();
  }
}
