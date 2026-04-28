import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  InvestigationQueryDto,
  InvestigationResponseDto,
} from './dto/investigation-response.dto';
import { InvestigationsService } from './investigations.service';

@ApiTags('Investigations')
@Controller('investigations')
export class InvestigationsController {
  constructor(private readonly investigations: InvestigationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List investigations',
    description:
      'All investigations. Optionally filter by status and/or investigation_type.',
  })
  @ApiOkResponse({ type: [InvestigationResponseDto] })
  async findAll(
    @Query() query: InvestigationQueryDto,
  ): Promise<InvestigationResponseDto[]> {
    return this.investigations.findAll(query);
  }

  @Get('story/:storyId')
  @ApiOperation({
    summary: 'Investigations for a story',
    description: 'All investigations tied to the given story, ordered by start date.',
  })
  @ApiParam({ name: 'storyId', format: 'uuid' })
  @ApiOkResponse({ type: [InvestigationResponseDto] })
  async findByStory(
    @Param('storyId', new ParseUUIDPipe({ version: '4' })) storyId: string,
  ): Promise<InvestigationResponseDto[]> {
    return this.investigations.findByStory(storyId);
  }
}
