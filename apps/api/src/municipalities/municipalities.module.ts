import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Municipality } from '../entities/municipality.entity';
import { Province } from '../entities/province.entity';
import { PublicExpenditureRecord } from '../entities/public-expenditure-record.entity';
import { Story } from '../entities/story.entity';
import { MunicipalitiesController } from './municipalities.controller';
import { MunicipalitiesService } from './municipalities.service';

@Module({
  imports: [TypeOrmModule.forFeature([Municipality, Province, Story, PublicExpenditureRecord])],
  controllers: [MunicipalitiesController],
  providers: [MunicipalitiesService],
  exports: [MunicipalitiesService],
})
export class MunicipalitiesModule {}
