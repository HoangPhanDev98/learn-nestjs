import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import ms from 'ms';
import { IUser } from 'src/users/users.interface';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  public async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userService.findByEmail(username);

    if (user) {
      const validPassword = await this.userService.isValidPassword(
        pass,
        user.password,
      );

      if (validPassword) {
        return user;
      }
    }

    return null;
  }

  public async login(user: IUser, response: Response) {
    const { _id, name, email, role } = user;

    const payload = {
      sub: 'login token',
      iss: 'api server',
      _id,
      name,
      email,
      role,
    };

    const refresh_token = this.createRefreshToken(payload);

    // Update refresh token in the database
    await this.userService.updateRefreshToken(_id, refresh_token);

    // Set refresh token in the cookie
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id,
        name,
        email,
        role,
      },
    };
  }

  public async register(registerUserDto: any) {
    const user = await this.userService.register(registerUserDto);

    return {
      _id: user?._id,
      createdAt: user?.createdAt,
    };
  }

  public createRefreshToken(payload) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn:
        ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')) / 1000,
    });
  }

  public async refreshToken(refreshToken: string, response: Response) {
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });

      const user = await this.userService.findByRefreshToken(refreshToken);

      if (!user) {
        throw new BadRequestException('Invalid refresh token');
      }

      const { _id, name, email, role } = user;

      const payload = {
        sub: 'login token',
        iss: 'api server',
        _id,
        name,
        email,
        role,
      };

      const refresh_token = this.createRefreshToken(payload);

      // Update refresh token in the database
      await this.userService.updateRefreshToken(_id.toString(), refresh_token);

      // Set refresh token in the cookie
      response.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
      });

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          _id,
          name,
          email,
          role,
        },
      };
    } catch {
      throw new BadRequestException('Invalid refresh token');
    }
  }

  public async logout(user: IUser, response: Response) {
    await this.userService.updateRefreshToken(user._id, null);

    response.clearCookie('refresh_token');

    return 'ok';
  }
}
