import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, switchMap } from 'rxjs';

@Injectable()
export class UserInterceptor implements NestInterceptor {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
  ) {}

  async intercept(ctx: ExecutionContext, next: CallHandler) {
    if (ctx.getType() !== 'http') return next.handle();

    const request = ctx.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'] as string;

    if (!authHeader) return next.handle();

    const [bearer, jwt] = authHeader.split(' ');

    return this.authService
      .send(
        {
          cmd: 'decode-jwt',
        },
        {
          jwt,
        },
      )
      .pipe(
        switchMap(({ user }) => {
          request.user = user;
          return next.handle();
        }),
        catchError(() => next.handle()),
      );
  }
}
