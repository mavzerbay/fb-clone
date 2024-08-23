import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ConversationEntity } from './conversation.entity';

@Entity('message')
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @ManyToOne(() => UserEntity, (user) => user.messages)
  user: UserEntity;

  @ManyToOne(() => ConversationEntity, (conversation) => conversation.messages)
  conversation: ConversationEntity;

  @CreateDateColumn()
  createdAt: Date;
}
