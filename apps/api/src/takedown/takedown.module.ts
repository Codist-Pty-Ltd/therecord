import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TakedownRequest } from '../entities/takedown-request.entity';
import { IngestionApiKeyGuard } from '../auth/ingestion-api-key.guard';
import { TakedownController } from './takedown.controller';
import { TakedownService } from './takedown.service';

@Module({
  imports: [TypeOrmModule.forFeature([TakedownRequest])],
  controllers: [TakedownController],
  providers: [TakedownService, IngestionApiKeyGuard],
})
export class TakedownModule {}
