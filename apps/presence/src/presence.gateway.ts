import { FriendRequestEntity, RedisCacheService, UserJwt } from '@app/shared';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { firstValueFrom } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { ActiveUser } from './interfaces/active_user.interface';

@WebSocketGateway({ cors: true })
export class PresenceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
    @Inject(CACHE_MANAGER) private cache: RedisCacheService,
  ) {}

  @WebSocketServer()
  server: Server;

  // Reset the cache when the server starts
  async onModuleInit() {
    await this.cache.reset();
  }

  private async getFriends(userId: number) {
    const ob$ = this.authService.send<FriendRequestEntity[]>(
      { cmd: 'get-friends' },
      { userId },
    );

    const friendRequests = await firstValueFrom(ob$).catch((err) =>
      console.error(err),
    );

    if (!friendRequests) return;

    const friends = friendRequests.map((fr) => {
      const isUserCreator = fr.creator.id === userId;
      const friendDetails = isUserCreator ? fr.receiver : fr.creator;
      const { id, firstName, lastName, email } = friendDetails;

      return { id, firstName, lastName, email };
    });

    return friends;
  }

  private async emitStatusToFriends(activeUser: ActiveUser) {
    const friends = await this.getFriends(activeUser.id);

    if (!friends) return;

    for (const f of friends) {
      const friend = await this.cache.get<ActiveUser>(`user ${f.id}`);

      if (!friend) continue;

      this.server.to(friend.socketId).emit('friend-status', {
        id: activeUser.id,
        isActive: activeUser.isActive,
      });

      if (activeUser.isActive) {
        this.server.to(activeUser.socketId).emit('friend-status', {
          id: f.id,
          isActive: friend.isActive,
        });
      }
    }
  }

  private async setActiveStatus(socket: Socket, isActive: boolean) {
    const user = socket.data.user;

    if (!user) return;

    const activeUser: ActiveUser = {
      id: user.id,
      socketId: socket.id,
      isActive,
    };

    await this.cache.set(`user ${user.id}`, activeUser, 0);
    await this.emitStatusToFriends(activeUser);
  }

  async handleConnection(socket: Socket) {
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

    await this.setActiveStatus(socket, true);
  }

  async handleDisconnect(socket: Socket) {
    console.debug('Client disconnected');

    await this.setActiveStatus(socket, false);
  }

  @SubscribeMessage('update-active-status')
  async updateActiveStatus(socket: Socket, isActive: boolean) {
    console.debug(
      `Update active status ${isActive} for user ${socket.data?.user?.firstName}`,
    );
    if (!socket.data?.user) return;

    await this.setActiveStatus(socket, isActive);
  }
}
