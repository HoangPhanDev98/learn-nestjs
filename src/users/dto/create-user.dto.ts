import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';

export class RegisterUserDto {
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsNotEmpty({ message: 'Age is required' })
  age: number;

  @IsNotEmpty({ message: 'Gender is required' })
  gender: string;

  @IsNotEmpty({ message: 'Address is required' })
  address: string;
}

class Company {
  @IsNotEmpty({ message: 'Company ID is required' })
  _id: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty({ message: 'Company name is required' })
  name: string;
}

export class CreateUserDto extends RegisterUserDto {
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => Company)
  company: Company;

  @IsNotEmpty({ message: 'Role is required' })
  role: string;
}
