import { BadRequestException, Injectable } from '@nestjs/common';
import { Job, JobDocument } from './schemas/job.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateJobDto } from './dto/create-job.dto';
import { IUser } from 'src/users/users.interface';
import dayjs from 'dayjs';
import { UpdateJobDto } from './dto/update-job.dto';
import aqp from 'api-query-params';
import mongoose from 'mongoose';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name)
    private jobModel: SoftDeleteModel<JobDocument>,
  ) {}

  public async findAll(currentPage: number, limit: number, query: string) {
    const { filter, population, sort } = aqp(query);

    delete filter.current;
    delete filter.pageSize;

    const offset = (currentPage - 1) * limit;
    const defaultLimit = limit ?? 10;

    const totalItems = (await this.jobModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.jobModel
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

  public async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'Not found job!';
    }

    return this.jobModel.findOne({ _id: id }).select('-password');
  }

  public async create(data: CreateJobDto, userInfo: IUser) {
    const { startDate, endDate } = data;

    await this.handleCompareDate(startDate, endDate);

    const job = await this.jobModel.create({
      ...data,
      createdBy: {
        _id: userInfo._id,
        email: userInfo.email,
      },
    });

    return {
      _id: job._id,
      createdAt: job.createdAt,
    };
  }

  public async update(_id: string, data: UpdateJobDto, userInfo: IUser) {
    const { startDate, endDate } = data;

    await this.handleCompareDate(startDate, endDate);

    return this.jobModel.updateOne(
      { _id },
      {
        ...data,
        updatedBy: {
          _id: userInfo._id,
          email: userInfo.email,
        },
      },
    );
  }

  public async remove(id: string, userInfo: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'Not found job!';
    }

    await this.jobModel.updateOne(
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

    return this.jobModel.softDelete({ _id: id });
  }

  private async handleCompareDate(startDate: Date, endDate: Date) {
    if (dayjs(endDate).isBefore(dayjs(startDate))) {
      throw new BadRequestException("End date can't before start date");
    }
  }
}
