import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IngestionApiKeyGuard } from '../auth/ingestion-api-key.guard';
import { TakedownRequest } from '../entities/takedown-request.entity';
import { CreateTakedownRequestDto } from './dto/create-takedown-request.dto';
import {
  CreateTakedownResponseDto,
  TakedownService,
} from './takedown.service';

@ApiTags('takedown')
@Controller('takedown')
export class TakedownController {
  constructor(private readonly takedown: TakedownService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a public takedown, correction, or POPIA-related request.',
  })
  async create(
    @Body() dto: CreateTakedownRequestDto,
  ): Promise<CreateTakedownResponseDto> {
    return this.takedown.create(dto);
  }

  @Get()
  @UseGuards(IngestionApiKeyGuard)
  @ApiHeader({
    name: 'x-ingestion-key',
    required: true,
    description: 'Must match the API `INGESTION_API_KEY` environment variable.',
  })
  @ApiOperation({
    summary: 'List all takedown requests (operator — requires ingestion API key).',
  })
  async listAll(): Promise<TakedownRequest[]> {
    return this.takedown.findAllForAdmin();
  }
}
