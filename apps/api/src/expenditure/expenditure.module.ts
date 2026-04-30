import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PublicExpenditureRecord } from '../entities/public-expenditure-record.entity';
import { Story } from '../entities/story.entity';
import { ExpenditureController } from './expenditure.controller';
import { ExpenditureService } from './expenditure.service';

@Module({
  imports: [TypeOrmModule.forFeature([PublicExpenditureRecord, Story])],
  controllers: [ExpenditureController],
  providers: [ExpenditureService],
  exports: [ExpenditureService],
})
export class ExpenditureModule {}
