import { UserRequest } from './user_request.interface';

export interface UserJwt extends UserRequest {
  iat: number;
  exp: number;
}
