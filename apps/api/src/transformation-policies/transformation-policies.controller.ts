import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { TransformationPolicyDto } from './dto/transformation-policy-response.dto';
import { TransformationPoliciesService } from './transformation-policies.service';

@ApiTags('Transformation policies')
@Controller('transformation-policies')
export class TransformationPoliciesController {
  constructor(private readonly service: TransformationPoliciesService) {}

  @Get(':slug')
  @ApiOperation({
    summary: 'Get transformation policy explainer by slug',
    description:
      'Returns editorial explainer fields (history, three reading levels, debate columns) for major policy threads such as B-BBEE.',
  })
  @ApiOkResponse({ type: TransformationPolicyDto })
  @ApiNotFoundResponse({ description: 'Unknown slug' })
  async findBySlug(@Param('slug') slug: string): Promise<TransformationPolicyDto> {
    return this.service.findBySlug(slug);
  }
}
