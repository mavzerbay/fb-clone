import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { NewUserDTO } from './dtos/new_user.dto';
import { ExistingUserDTO } from './dtos/existing_user.dto';
import {
  UserRepositoryInterface,
  UserEntity,
  UserJwt,
  FriendRequestsRepositoryInterface,
  FriendRequestEntity,
  FriendRequestsRepository,
} from '@app/shared';
import { AuthServiceInterface } from './interface/auth_service.interface';

@Injectable()
export class AuthService implements AuthServiceInterface {
  constructor(
    @Inject('UsersRepositoryInterface')
    private readonly usersRepository: UserRepositoryInterface,
    @Inject('FriendRequestsRepositoryInterface')
    private readonly friendRequestsRepository: FriendRequestsRepositoryInterface,
    private readonly jwtService: JwtService,
  ) {}

  async getUsers(): Promise<UserEntity[]> {
    return await this.usersRepository.findAll();
  }

  async getUserById(id: number): Promise<UserEntity> {
    return await this.usersRepository.findOneById(id);
  }

  async findByEmail(email: string): Promise<UserEntity> {
    return await this.usersRepository.findByCondition({
      where: { email },
      select: ['id', 'firstName', 'lastName', 'email', 'password'],
    });
  }

  async findById(id: number): Promise<UserEntity> {
    return await this.usersRepository.findOneById(id);
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  async register(newUser: Readonly<NewUserDTO>): Promise<UserEntity> {
    const { firstName, lastName, email, password } = newUser;

    const existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.hashPassword(password);

    const savedUser = await this.usersRepository.save({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    delete savedUser.password;

    return savedUser;
  }

  async doesPasswordMatch(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  async validateUser(email: string, password: string): Promise<UserEntity> {
    const user = await this.findByEmail(email);

    if (!user) return null;

    const isPasswordCorrect = this.doesPasswordMatch(password, user.password);

    if (!isPasswordCorrect) return null;

    return user;
  }

  async login(existingUser: Readonly<ExistingUserDTO>) {
    const { email, password } = existingUser;

    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    delete user.password;

    const jwt = await this.jwtService.signAsync({ user });

    return { token: jwt, user };
  }

  async verifyJwt(jwt: string): Promise<{ user: UserEntity; exp: number }> {
    if (!jwt) {
      throw new UnauthorizedException('Invalid token');
    }
    try {
      const { user, exp } = await this.jwtService.verifyAsync(jwt);
      return { user, exp };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getUserFromHeader(jwt: string): Promise<UserJwt> {
    if (!jwt) return;

    try {
      return this.jwtService.decode(jwt) as UserJwt;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async addFriend(
    userId: number,
    friendId: number,
  ): Promise<FriendRequestEntity> {
    const creator = await this.findById(userId);

    const receiver = await this.findById(friendId);

    return await this.friendRequestsRepository.save({
      creator,
      receiver,
    });
  }

  async getFriends(userId: number): Promise<FriendRequestEntity[]> {
    const creator = await this.findById(userId);

    return await this.friendRequestsRepository.findWithRelations({
      where: [{ creator }, { receiver: creator }],
      relations: ['creator', 'receiver'],
    });
  }

  async getFriendList(userId: number): Promise<UserEntity[]> {
    const friendRequests = await this.getFriends(userId);

    if (!friendRequests) return;

    const friends = friendRequests.map((fr) => {
      const isUserCreator = fr.creator.id === userId;
      const friendDetails = isUserCreator ? fr.receiver : fr.creator;
      const { id, firstName, lastName, email } = friendDetails;

      return { id, firstName, lastName, email } as UserEntity;
    });

    return friends;
  }
}
