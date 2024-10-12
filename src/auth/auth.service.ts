import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/users/users.interface';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
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

  public async login(user: IUser) {
    const { _id, name, email, role } = user;

    const payload = {
      sub: 'login token',
      iss: 'api server',
      _id,
      name,
      email,
      role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      _id,
      name,
      email,
      role,
    };
  }

  public async register(registerUserDto: any) {
    const user = await this.userService.register(registerUserDto);

    return {
      _id: user?._id,
      createdAt: user?.createdAt,
    };
  }
}
