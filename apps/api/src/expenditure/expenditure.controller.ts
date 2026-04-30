import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ExpenditureListQueryDto } from './dto/expenditure-list-query.dto';
import {
  ExpenditureByStoryResponseDto,
  ExpenditureCounterResponseDto,
  ExpenditureListResponseDto,
} from './dto/expenditure-response.dto';
import { ExpenditureService } from './expenditure.service';

@ApiTags('Expenditure')
@Controller('expenditure')
export class ExpenditureController {
  constructor(private readonly expenditure: ExpenditureService) {}

  @Get('counter')
  @ApiOperation({ summary: 'National money counter (homepage)' })
  @ApiOkResponse({ type: ExpenditureCounterResponseDto })
  getCounter(): Promise<ExpenditureCounterResponseDto> {
    return this.expenditure.getCounter();
  }

  @Get('story/:storyId')
  @ApiOperation({ summary: 'All public expenditure rows for a story' })
  @ApiOkResponse({ type: ExpenditureByStoryResponseDto })
  findByStory(
    @Param('storyId', new ParseUUIDPipe({ version: '4' })) storyId: string,
  ): Promise<ExpenditureByStoryResponseDto> {
    return this.expenditure.findByStoryId(storyId);
  }

  @Get()
  @ApiOperation({ summary: 'Paginated browse of all expenditure records' })
  @ApiOkResponse({ type: ExpenditureListResponseDto })
  findAll(@Query() query: ExpenditureListQueryDto): Promise<ExpenditureListResponseDto> {
    return this.expenditure.findAll(query);
  }
}
