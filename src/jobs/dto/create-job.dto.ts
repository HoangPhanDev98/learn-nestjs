import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';

class Company {
  @IsNotEmpty({ message: 'Company ID is required' })
  _id: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty({ message: 'Company name is required' })
  name: string;
}

export class CreateJobDto {
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsNotEmpty({ message: 'Skills are required' })
  @IsArray({ message: 'Skills must be an array' })
  @IsString({ each: true, message: 'Each skill must be a string' })
  skills: Array<string>;

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => Company)
  company: Company;

  @IsNotEmpty({ message: 'Location is required' })
  location: string;

  @IsNotEmpty({ message: 'Salary is required' })
  salary: number;

  @IsNotEmpty({ message: 'Quantity is required' })
  quantity: number;

  @IsNotEmpty({ message: 'Level is required' })
  level: string;

  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @IsNotEmpty({ message: 'Start date is required' })
  @IsDateString()
  startDate: Date;

  @IsNotEmpty({ message: 'End date is required' })
  @IsDateString()
  endDate: Date;

  @IsNotEmpty({ message: 'isActive is required' })
  isActive: boolean;
}
