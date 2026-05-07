import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransformationPolicy } from '../entities/transformation-policy.entity';
import { TransformationPoliciesController } from './transformation-policies.controller';
import { TransformationPoliciesService } from './transformation-policies.service';

@Module({
  imports: [TypeOrmModule.forFeature([TransformationPolicy])],
  controllers: [TransformationPoliciesController],
  providers: [TransformationPoliciesService],
})
export class TransformationPoliciesModule {}
