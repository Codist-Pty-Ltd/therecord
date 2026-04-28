import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  ConstitutionSectionDetailResponseDto,
  ConstitutionSectionResponseDto,
  LawResponseDto,
  LawSectionDetailResponseDto,
  LawWithSectionsResponseDto,
} from './dto/legal-response.dto';
import { LegalService } from './legal.service';

@ApiTags('Legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legal: LegalService) {}

  /* ----------------------------------------------------------- /laws */

  @Get('laws')
  @ApiOperation({
    summary: 'List all laws',
    description: 'Returns every tracked statute (PRECCA, SAPS Act, POCA, etc.).',
  })
  @ApiOkResponse({ type: [LawResponseDto] })
  async findAllLaws(): Promise<LawResponseDto[]> {
    return this.legal.findAllLaws();
  }

  /*
   * NOTE — route order matters. The more specific
   * `laws/:lawId/sections/:sectionId` is declared *before* the bare
   * `laws/:id` so NestJS's path matcher always reaches it first. Today
   * `:id` is a single segment so they wouldn't collide, but listing the
   * specific one first is the convention we use across the codebase.
   */
  @Get('laws/:lawId/sections/:sectionId')
  @ApiOperation({
    summary: 'Get a law section by ID with reverse cross-links',
    description:
      'Returns the section, its parent law, and every commission, ad hoc ' +
      'committee, story, and SIU proclamation that references it.',
  })
  @ApiParam({ name: 'lawId', format: 'uuid' })
  @ApiParam({ name: 'sectionId', format: 'uuid' })
  @ApiOkResponse({ type: LawSectionDetailResponseDto })
  async findLawSectionById(
    @Param('lawId', new ParseUUIDPipe({ version: '4' })) lawId: string,
    @Param('sectionId', new ParseUUIDPipe({ version: '4' })) sectionId: string,
  ): Promise<LawSectionDetailResponseDto> {
    return this.legal.findLawSectionById(lawId, sectionId);
  }

  @Get('laws/:id')
  @ApiOperation({
    summary: 'Get law by ID with all sections',
    description: 'Returns the law plus every law_section belonging to it, ordered by section_number.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: LawWithSectionsResponseDto })
  async findLawById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<LawWithSectionsResponseDto> {
    return this.legal.findLawById(id);
  }

  /* --------------------------------------------------- /constitution */

  @Get('constitution')
  @ApiOperation({
    summary: 'List all constitutional sections',
    description: 'Returns every constitution_section ordered by section_number ASC.',
  })
  @ApiOkResponse({ type: [ConstitutionSectionResponseDto] })
  async findAllConstitutionSections(): Promise<ConstitutionSectionResponseDto[]> {
    return this.legal.findAllConstitutionSections();
  }

  @Get('constitution/:section/detail')
  @ApiOperation({
    summary: 'Get a constitutional section by number with full cross-links',
    description:
      'Same integer `:section` as the bare read, plus commissions (empty), ' +
      'ad hoc committees (empty), stories from event legal refs, and SIU proclamations.',
  })
  @ApiParam({ name: 'section', type: 'integer', example: 84 })
  @ApiOkResponse({ type: ConstitutionSectionDetailResponseDto })
  async findConstitutionSectionDetail(
    @Param('section', ParseIntPipe) sectionNumber: number,
  ): Promise<ConstitutionSectionDetailResponseDto> {
    return this.legal.findConstitutionSectionDetailByNumber(sectionNumber);
  }

  @Get('constitution/:section')
  @ApiOperation({
    summary: 'Get a constitutional section by number',
    description: 'The `:section` path parameter is the integer section_number (not the UUID id).',
  })
  @ApiParam({ name: 'section', type: 'integer', example: 9 })
  @ApiOkResponse({ type: ConstitutionSectionResponseDto })
  async findConstitutionSection(
    @Param('section', ParseIntPipe) sectionNumber: number,
  ): Promise<ConstitutionSectionResponseDto> {
    return this.legal.findConstitutionSectionByNumber(sectionNumber);
  }
}
