import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@app/shared';
import { UserRequest } from '@app/shared/interfaces/user_request.interface';
import { UserInterceptor } from '@app/shared/interceptors/user.interceptor';

@Controller()
export class AppController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
    @Inject('PRESENCE_SERVICE') private readonly presenceService: ClientProxy,
    @Inject('CHAT_SERVICE') private readonly chatService: ClientProxy,
  ) {}

  @Get()
  async foo() {
    return { foo: 'bar!' };
  }

  @Get('users')
  async getUsers() {
    return this.authService.send(
      {
        cmd: 'get-users',
      },
      {},
    );
  }

  @Get('presence')
  @UseGuards(AuthGuard)
  async getPresence() {
    return this.presenceService.send(
      {
        cmd: 'get-presence',
      },
      {},
    );
  }

  @Post('auth/register')
  async register(
    @Body('firstName') firstName: string,
    @Body('lastName') lastName: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.send(
      {
        cmd: 'register',
      },
      {
        firstName,
        lastName,
        email,
        password,
      },
    );
  }

  @Post('auth/login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.send(
      {
        cmd: 'login',
      },
      {
        email,
        password,
      },
    );
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(UserInterceptor)
  @Get('current-user')
  async getCurrentUser(@Req() req: UserRequest) {
    if (!req?.user) {
      throw new BadRequestException();
    }

    return this.authService.send(
      {
        cmd: 'get-user',
      },
      {
        id: req.user.id,
      },
    );
  }

  @Post('add-friend/:friendId')
  @UseInterceptors(UserInterceptor)
  @UseGuards(AuthGuard)
  async addFriend(
    @Req() req: UserRequest,
    @Param('friendId') friendId: number,
  ) {
    if (!req?.user) {
      throw new BadRequestException();
    }

    return this.authService.send(
      {
        cmd: 'add-friend',
      },
      {
        userId: req.user.id,
        friendId,
      },
    );
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(UserInterceptor)
  @Get('friends')
  async getFriends(@Req() req: UserRequest) {
    if (!req?.user) {
      throw new BadRequestException();
    }

    return this.authService.send(
      {
        cmd: 'get-friends',
      },
      {
        userId: req.user.id,
      },
    );
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(UserInterceptor)
  @Get('friend-list')
  async getFriendList(@Req() req: UserRequest) {
    if (!req?.user) {
      throw new BadRequestException();
    }

    return this.authService.send(
      {
        cmd: 'get-friend-list',
      },
      {
        userId: req.user.id,
      },
    );
  }

  @Get('messages/:conversationId')
  @UseInterceptors(UserInterceptor)
  @UseGuards(AuthGuard)
  async getMessages(
    @Req() req: UserRequest,
    @Param('conversationId') conversationId: number,
  ) {
    if (!req?.user) {
      throw new BadRequestException();
    }

    return this.chatService.send(
      {
        cmd: 'messages',
      },
      {
        id: conversationId,
      },
    );
  }
}
