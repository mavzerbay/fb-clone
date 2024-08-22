import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BaseAbstractRepository,
  FriendRequestEntity,
  FriendRequestsRepositoryInterface,
} from '@app/shared'

@Injectable()
export class FriendRequestsRepository
  extends BaseAbstractRepository<FriendRequestEntity>
  implements FriendRequestsRepositoryInterface
{
  constructor(
    @InjectRepository(FriendRequestEntity)
    private readonly friendRequestEntity: Repository<FriendRequestEntity>,
  ) {
    super(friendRequestEntity);
  }
}
