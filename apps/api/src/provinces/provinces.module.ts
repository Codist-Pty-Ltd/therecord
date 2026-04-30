import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Municipality } from '../entities/municipality.entity';
import { Province } from '../entities/province.entity';
import { PublicExpenditureRecord } from '../entities/public-expenditure-record.entity';
import { Story } from '../entities/story.entity';
import { ExpenditureModule } from '../expenditure/expenditure.module';
import { ProvincesController } from './provinces.controller';
import { ProvincesService } from './provinces.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Province, Story, Municipality, PublicExpenditureRecord]),
    ExpenditureModule,
  ],
  controllers: [ProvincesController],
  providers: [ProvincesService],
  exports: [ProvincesService],
})
export class ProvincesModule {}
