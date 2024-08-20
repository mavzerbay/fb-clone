import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { UserEntity } from './user.entity';
import { NewUserDTO } from './dtos/new_user.dto';
import { ExistingUserDTO } from './dtos/existing_user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async getUsers(): Promise<UserEntity[]> {
    return await this.usersRepository.find();
  }

  async findByEmail(email: string): Promise<UserEntity> {
    return await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'firstName', 'lastName', 'email', 'password'],
    });
  }

  private async hashPassword(password: string): Promise<string> {
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

  private doesPasswordMatch(password: string, hashedPassword: string): boolean {
    return bcrypt.compareSync(password, hashedPassword);
  }

  private async validateUser(
    email: string,
    password: string,
  ): Promise<UserEntity> {
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

    const jwt = await this.jwtService.signAsync(
      { user },
      { secret: this.configService.get('JWT_SECRET') },
    );

    return { token: jwt };
  }

  async verifyJwt(jwt: string) {
    if (!jwt) {
      throw new UnauthorizedException('Invalid token');
    }
    try {
      const { exp } = await this.jwtService.verifyAsync(jwt);

      return { exp };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
