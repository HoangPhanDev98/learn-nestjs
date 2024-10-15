import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ResponseMessage, User } from 'src/decorator/customize';
import { CreateJobDto } from './dto/create-job.dto';
import { IUser } from '../users/users.interface';
import { UpdateJobDto } from './dto/update-job.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ResponseMessage('Fetch all jobs')
  findAll(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() query: string,
  ) {
    return this.jobsService.findAll(+currentPage, +limit, query);
  }

  @Get(':id')
  @ResponseMessage('Fetch a job by id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Post()
  @ResponseMessage('Create a new job')
  async createJob(@Body() createJobDto: CreateJobDto, @User() user) {
    return await this.jobsService.create(createJobDto, user);
  }

  @Patch(':id')
  @ResponseMessage('Update a job')
  async updateJob(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @User() user: IUser,
  ) {
    return await this.jobsService.update(id, updateJobDto, user);
  }

  @Delete(':id')
  @ResponseMessage('Delete a job')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.jobsService.remove(id, user);
  }
}
