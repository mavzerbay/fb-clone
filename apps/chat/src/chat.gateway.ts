import { RedisCacheService, UserJwt } from '@app/shared';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket, Server } from 'socket.io';
import { firstValueFrom } from 'rxjs';
import { NewMessageDto } from './dtos/new_messages.dto';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
    @Inject('PRESENCE_SERVICE') private readonly presenceService: ClientProxy,
    private readonly cache: RedisCacheService,
    private readonly chatService: ChatService,
  ) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(socket: Socket) {}

  async handleDisconnect(socket: Socket) {
    console.debug('Client connected');

    const jwt = socket.handshake.headers.authorization ?? null;

    if (!jwt) {
      this.handleDisconnect(socket);
      return;
    }

    const ob$ = this.authService.send<UserJwt>({ cmd: 'decode-jwt' }, { jwt });

    const res = await firstValueFrom(ob$).catch((err) => console.error(err));

    if (!res || !res?.user) {
      this.handleDisconnect(socket);
      return;
    }

    console.debug(
      `User ${res.user.firstName} ${res.user.lastName} authenticated`,
    );

    const { user } = res;

    socket.data.user = user;

    await this.setConversationUser(socket);

    await this.createConversation(socket, user.id);

    await this.getConversations(socket);

    await this.getMessages(socket, user.id);
  }

  private async createConversation(socket: Socket, userId: number) {
    const ob$ = this.authService.send({ cmd: 'get-friend-list' }, { userId });

    const friends = await firstValueFrom(ob$).catch((err) =>
      console.error(err),
    );

    friends.forEach(async (friend) => {
      await this.chatService.createConversation(userId, friend.id);
    });
  }

  private async setConversationUser(socket: Socket) {
    const user = socket.data.user;

    if (!user || !user.id) return;

    const conversationUser = { id: user.id, socketId: socket.id };

    await this.cache.set(`conversationUser ${user.id}`, conversationUser);
  }

  private async getMessages(socket: Socket, userId: number) {
    const messages = await this.chatService.getMessages(userId);

    console.debug('Messages:', messages);
    this.server.to(socket.id).emit('getAllMessages', messages);
  }

  @SubscribeMessage('get-conversations')
  async getConversations(socket: Socket) {
    const { user } = socket.data;

    if (!user || !user.id) return;

    const conversations = await this.chatService.getConversations(user.id);

    this.server.to(socket.id).emit('getAllConversations', conversations);
  }

  @SubscribeMessage('send-message')
  async handleMessage(socket: Socket, newMessage: NewMessageDto) {
    if (!newMessage) return;

    const { user } = socket.data;

    if (!user || !user.id) return;

    const createdMessage = await this.chatService.createMessage(
      user.id,
      newMessage,
    );

    const ob$ = this.presenceService.send(
      {
        cmd: 'get-active-user',
      },
      { id: newMessage.friendId },
    );

    const activeFriend = await firstValueFrom(ob$).catch((err) =>
      console.error(err),
    );

    if (!activeFriend || !activeFriend.isActive) return;

    const friendsDetails = (await this.cache.get(
      `conversationUser ${newMessage.friendId}`,
    )) as { id: number; socketId: string } | undefined;

    if (!friendsDetails) return;

    const { id, content, user: creator, conversation } = createdMessage;

    this.server.to(friendsDetails.socketId).emit('newMessage', {
      id,
      content,
      creatorId: creator.id,
      conversationId: conversation.id,
    });
  }
}
