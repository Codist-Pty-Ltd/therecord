import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdhocCommitteeCategory } from '../../entities/adhoc_committee.entity';
import { AdhocCommitteeLawSectionUsage } from '../../entities/adhoc_committee_law_section.entity';
import { AdhocCommitteeStatus } from '../../entities/adhoc_committee.entity';
import { CommissionDomain } from '../../entities/commission.entity';
import { CommissionLawSectionUsage } from '../../entities/commission_law_section.entity';
import { CommissionStatus } from '../../entities/commission.entity';
import { LawCategory } from '../../entities/law.entity';
import { ProclamationStatus } from '../../entities/siu_proclamation.entity';
import { SiuLawSectionUsage } from '../../entities/siu_proclamation_law_section.entity';
import { StoryDomain } from '../../entities/story.entity';
import { StoryStatus } from '../../entities/story.entity';

export class LawResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() short_name!: string;
  @ApiProperty() act_number!: string;
  @ApiProperty({ enum: LawCategory }) category!: LawCategory;
  @ApiProperty() plain_english!: string;
  @ApiPropertyOptional({ nullable: true }) full_text_url!: string | null;
}

export class LawSectionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) law_id!: string;
  @ApiProperty() section_number!: string;
  @ApiProperty() section_title!: string;
  @ApiProperty() plain_english!: string;
  @ApiPropertyOptional({ nullable: true }) full_text!: string | null;
}

/** Law section with parent statute inlined — used in SIU proclamation detail. */
export class LawSectionWithLawResponseDto extends LawSectionResponseDto {
  @ApiProperty({ type: () => LawResponseDto })
  law!: LawResponseDto;
}

export class LawWithSectionsResponseDto extends LawResponseDto {
  @ApiProperty({ type: [LawSectionResponseDto] })
  sections!: LawSectionResponseDto[];
}

/* ----------------------------------------------------------------------------
 * Section detail — `GET /api/legal/laws/:lawId/sections/:sectionId`
 *
 * Bundles the section + parent law + every commission, ad hoc committee, and
 * story that references it. Three reverse-cross-link arrays keep the section
 * page rendering in a single round-trip.
 *
 * SIU rows come from `siu_proclamation_law_sections` (proclamation + usage +
 * relevance). Constitution section detail reuses the same "applied in" DTOs.
 * -------------------------------------------------------------------------- */

/** Slim proclamation card for the law/constitution "Applied in" strip. */
export class SiuProclamationBriefForLawDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() proclamation_number!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: CommissionDomain }) domain!: CommissionDomain;
  @ApiProperty({ enum: ProclamationStatus }) status!: ProclamationStatus;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  signed_date!: string | null;
}

export class SiuProclamationUsingLawSectionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: SiuLawSectionUsage })
  usage_type!: SiuLawSectionUsage;

  @ApiPropertyOptional({ nullable: true })
  relevance!: string | null;

  @ApiProperty({ type: () => SiuProclamationBriefForLawDto })
  proclamation!: SiuProclamationBriefForLawDto;
}

export class CommissionUsingLawSectionDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() popular_name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: CommissionDomain }) domain!: CommissionDomain;
  @ApiProperty({ enum: CommissionStatus }) status!: CommissionStatus;
  @ApiPropertyOptional({ nullable: true }) chair_name!: string | null;
  @ApiPropertyOptional({ nullable: true }) announced_date!: string | null;
  @ApiPropertyOptional({ nullable: true }) concluded_date!: string | null;
  /** Most representative year for the row (announced → hearings → concluded). */
  @ApiPropertyOptional({ nullable: true }) era_year!: string | null;
  @ApiProperty({ enum: CommissionLawSectionUsage })
  usage_type!: CommissionLawSectionUsage;
}

export class AdhocCommitteeUsingLawSectionDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() popular_name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: AdhocCommitteeCategory })
  category!: AdhocCommitteeCategory;
  @ApiProperty({ enum: AdhocCommitteeStatus })
  status!: AdhocCommitteeStatus;
  @ApiPropertyOptional({ nullable: true }) parliament_term!: string | null;
  @ApiPropertyOptional({ nullable: true }) parliament_years!: string | null;
  @ApiPropertyOptional({ nullable: true }) announced_date!: string | null;
  @ApiPropertyOptional({ nullable: true }) concluded_date!: string | null;
  @ApiPropertyOptional({ nullable: true }) era_year!: string | null;
  @ApiProperty({ enum: AdhocCommitteeLawSectionUsage })
  usage_type!: AdhocCommitteeLawSectionUsage;
}

export class StoryReferencingLawSectionDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: StoryDomain }) domain!: StoryDomain;
  @ApiProperty({ enum: StoryStatus }) status!: StoryStatus;
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
  /** Most recent event on the story that cites this section. ISO `YYYY-MM-DD`. */
  @ApiPropertyOptional({ nullable: true }) latest_event_date!: string | null;
  /** Number of distinct events on the story that reference this section. */
  @ApiProperty() event_count!: number;
  /** True if at least one event flagged this as an `alleged_violation`. */
  @ApiProperty() alleged_violation!: boolean;
}

export class LawSectionDetailResponseDto extends LawSectionResponseDto {
  @ApiProperty({ type: () => LawResponseDto })
  law!: LawResponseDto;

  @ApiProperty({ type: [CommissionUsingLawSectionDto] })
  commissions!: CommissionUsingLawSectionDto[];

  @ApiProperty({ type: [AdhocCommitteeUsingLawSectionDto] })
  adhoc_committees!: AdhocCommitteeUsingLawSectionDto[];

  @ApiProperty({ type: [StoryReferencingLawSectionDto] })
  stories!: StoryReferencingLawSectionDto[];

  @ApiProperty({ type: [SiuProclamationUsingLawSectionDto] })
  siu_proclamations!: SiuProclamationUsingLawSectionDto[];
}

export class ConstitutionSectionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() chapter_number!: number;
  @ApiProperty() section_number!: number;
  @ApiProperty() section_title!: string;
  @ApiProperty() plain_english!: string;
  @ApiPropertyOptional({ nullable: true }) full_text!: string | null;
}

/** `GET /legal/constitution/:section/detail` — same cross-links as a law section. */
export class ConstitutionSectionDetailResponseDto extends ConstitutionSectionResponseDto {
  @ApiProperty({ type: [CommissionUsingLawSectionDto] })
  commissions!: CommissionUsingLawSectionDto[];

  @ApiProperty({ type: [AdhocCommitteeUsingLawSectionDto] })
  adhoc_committees!: AdhocCommitteeUsingLawSectionDto[];

  @ApiProperty({ type: [StoryReferencingLawSectionDto] })
  stories!: StoryReferencingLawSectionDto[];

  @ApiProperty({ type: [SiuProclamationUsingLawSectionDto] })
  siu_proclamations!: SiuProclamationUsingLawSectionDto[];
}
