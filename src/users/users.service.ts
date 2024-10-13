import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { CreateUserDto, RegisterUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { IUser } from './users.interface';
import aqp from 'api-query-params';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: SoftDeleteModel<UserDocument>,
  ) {}

  private hashPassword = (password: string) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    return hash;
  };

  public async create(createdUserDto: CreateUserDto, userInfo: IUser) {
    const isExist = await this.findByEmail(createdUserDto.email);

    if (isExist) {
      throw new BadRequestException('Email already exists!');
    }

    const hashPassword = this.hashPassword(createdUserDto.password);

    const user = await this.userModel.create({
      ...createdUserDto,
      password: hashPassword,
      createdBy: {
        _id: userInfo._id,
        email: userInfo.email,
      },
    });

    return {
      _id: user._id,
      createdAt: user.createdAt,
    };
  }

  public async register(registerUserDto: RegisterUserDto) {
    const isExist = await this.findByEmail(registerUserDto.email);

    if (isExist) {
      throw new BadRequestException('Email already exists!');
    }

    const hashPassword = this.hashPassword(registerUserDto.password);

    const user = await this.userModel.create({
      ...registerUserDto,
      role: 'user',
      password: hashPassword,
    });

    return {
      _id: user._id,
      createdAt: user.createdAt,
    };
  }

  public async findAll(currentPage: number, limit: number, query: string) {
    const { filter, population, sort } = aqp(query);

    delete filter.page;
    delete filter.limit;

    const offset = (currentPage - 1) * limit;
    const defaultLimit = limit ?? 10;

    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.userModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
      .select('-password')
      .exec();

    return {
      meta: {
        current: currentPage,
        pageSize: defaultLimit,
        total: totalItems,
        pages: totalPages,
      },
      result,
    };
  }

  public async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'Not found user!';
    }

    return this.userModel.findOne({ _id: id }).select('-password');
  }

  public findByEmail(email: string) {
    return this.userModel.findOne({
      email,
    });
  }

  public async update(
    id: string,
    updateUserDto: UpdateUserDto,
    userInfo: IUser,
  ) {
    const isExist = await this.findByEmail(updateUserDto.email);

    if (isExist) {
      throw new BadRequestException('Email already exists!');
    }

    return this.userModel.updateOne(
      { _id: id },
      {
        ...updateUserDto,
        updatedBy: {
          _id: userInfo._id,
          email: userInfo.email,
        },
      },
    );
  }

  public async remove(id: string, userInfo: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'Not found user!';
    }

    await this.userModel.updateOne(
      {
        _id: id,
      },
      {
        deletedBy: {
          _id: userInfo._id,
          email: userInfo.email,
        },
      },
    );

    return this.userModel.softDelete({ _id: id });
  }

  public isValidPassword(password: string, hashPassword: string) {
    return bcrypt.compareSync(password, hashPassword);
  }

  public async updateRefreshToken(userId: string, refreshToken: string) {
    return this.userModel.updateOne(
      { _id: userId },
      {
        refreshToken,
      },
    );
  }

  public async findByRefreshToken(refreshToken: string) {
    return this.userModel.findOne({
      refreshToken,
    });
  }
}
