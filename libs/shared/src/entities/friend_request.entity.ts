import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '..';

@Entity('friend-request')
export class FriendRequestEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => UserEntity, (user) => user.friendRequestCreator)
    creator: UserEntity; 

    @ManyToOne(() => UserEntity, (user) => user.friendRequestReceiver)
    receiver: UserEntity; 
}
