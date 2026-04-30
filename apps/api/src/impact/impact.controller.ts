import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ImpactSectorDetailDto,
  ImpactSectorListItemDto,
  ImpactStorySummaryResponseDto,
  ImpactWebResponseDto,
  MoneyToRealityResponseDto,
} from './dto/impact-response.dto';
import { ImpactService } from './impact.service';

@ApiTags('Human impact')
@Controller('impact')
export class ImpactController {
  constructor(private readonly impact: ImpactService) {}

  @Get('sectors')
  @ApiOperation({ summary: 'List all impact sectors with story and money aggregates' })
  @ApiOkResponse({ type: [ImpactSectorListItemDto] })
  listSectors(): Promise<ImpactSectorListItemDto[]> {
    return this.impact.listSectors();
  }

  @Get('web')
  @ApiOperation({ summary: 'Spider-web payload for homepage / impact visualisation' })
  @ApiOkResponse({ type: ImpactWebResponseDto })
  getWeb(): Promise<ImpactWebResponseDto> {
    return this.impact.getWeb();
  }

  @Get('money-to-reality')
  @ApiOperation({
    summary: 'Convert an amount in rands into illustrative public-goods equivalents',
  })
  @ApiOkResponse({ type: MoneyToRealityResponseDto })
  moneyToReality(@Query('rands') rands: string): MoneyToRealityResponseDto {
    return this.impact.moneyToReality(rands ?? '');
  }

  @Get('story/:storyId')
  @ApiOperation({ summary: 'Impact sectors and expenditure narratives for one story' })
  @ApiOkResponse({ type: ImpactStorySummaryResponseDto })
  getStoryImpacts(
    @Param('storyId', ParseUUIDPipe) storyId: string,
  ): Promise<ImpactStorySummaryResponseDto> {
    return this.impact.getStoryImpacts(storyId);
  }

  @Get('sectors/:slug')
  @ApiOperation({ summary: 'Full sector detail with linked stories and commissions' })
  @ApiOkResponse({ type: ImpactSectorDetailDto })
  getSectorDetail(@Param('slug') slug: string): Promise<ImpactSectorDetailDto> {
    return this.impact.getSectorBySlug(slug);
  }
}
