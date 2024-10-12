import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/users/users.interface';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company, CompanyDocument } from './schemas/company.schema';
import aqp from 'api-query-params';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private companiesModel: SoftDeleteModel<CompanyDocument>,
  ) {}
  public async findAll(currentPage: number, limit: number, query: string) {
    const { filter, population, sort } = aqp(query);

    delete filter.page;
    delete filter.limit;

    const offset = (currentPage - 1) * limit;
    const defaultLimit = limit ?? 10;

    const totalItems = (await this.companiesModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.companiesModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
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

  public async create(createCompanyDto: CreateCompanyDto, userInfo: IUser) {
    const company = await this.companiesModel.create({
      ...createCompanyDto,
      createdBy: {
        _id: userInfo._id,
        email: userInfo.email,
      },
    });

    return company;
  }

  public async update(
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

  public async delete(_id: string, userInfo: IUser) {
    await this.companiesModel.updateOne(
      {
        _id,
      },
      {
        deletedBy: {
          _id: userInfo._id,
          email: userInfo.email,
        },
      },
    );

    const company = await this.companiesModel.softDelete({
      _id,
    });

    return company;
  }
}
