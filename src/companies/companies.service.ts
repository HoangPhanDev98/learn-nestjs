import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/users/users.interface';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company, CompanyDocument } from './schemas/company.schema';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private companiesModel: SoftDeleteModel<CompanyDocument>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, userInfo: IUser) {
    const company = await this.companiesModel.create({
      ...createCompanyDto,
      createdBy: {
        _id: userInfo._id,
        email: userInfo.email,
      },
    });

    return company;
  }

  async update(
    _id: string,
    updateCompanyDto: UpdateCompanyDto,
    userInfo: IUser,
  ) {
    const company = await this.companiesModel.updateOne(
      {
        _id,
      },
      {
        ...updateCompanyDto,
        updatedBy: {
          _id: userInfo._id,
          email: userInfo.email,
        },
      },
    );

    return company;
  }
}
