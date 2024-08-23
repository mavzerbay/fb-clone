import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FriendRequestEntity } from './friend_request.entity';
import { ConversationEntity } from './conversation.entity';
import { MessageEntity } from './message.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @OneToMany(
    () => FriendRequestEntity,
    (friendRequest) => friendRequest.creator,
  )
  friendRequestCreator: FriendRequestEntity[];

  @OneToMany(
    () => FriendRequestEntity,
    (friendRequest) => friendRequest.receiver,
  )
  friendRequestReceiver: FriendRequestEntity[];

  @ManyToMany(() => ConversationEntity, (conversation) => conversation.users)
  conversations: ConversationEntity[];

  @OneToMany(() => MessageEntity, (message) => message.user)
  messages: MessageEntity[];
}
