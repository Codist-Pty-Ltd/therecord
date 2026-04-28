import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PersonQueryDto } from './dto/person-query.dto';
import {
  PersonDetailResponseDto,
  PersonListResponseDto,
} from './dto/person-response.dto';
import { PeopleService } from './people.service';

@ApiTags('People')
@Controller('people')
export class PeopleController {
  constructor(private readonly people: PeopleService) {}

  @Get()
  @ApiOperation({
    summary: 'List people',
    description:
      'Paginated list of people. Filter by status and/or search full_name and aliases (case-insensitive).',
  })
  @ApiOkResponse({ type: PersonListResponseDto })
  async findAll(@Query() query: PersonQueryDto): Promise<PersonListResponseDto> {
    return this.people.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get person profile',
    description:
      'Full person profile plus every story they appear in and every timeline event from those stories.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PersonDetailResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PersonDetailResponseDto> {
    return this.people.findOne(id);
  }
}
