import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { bigIntStringToNumber } from '../common/utils/money.util';
import {
  ExpenditureType,
  PublicExpenditureRecord,
} from '../entities/public-expenditure-record.entity';
import { Story } from '../entities/story.entity';
import { ExpenditureListQueryDto } from './dto/expenditure-list-query.dto';
import {
  ExpenditureByStoryResponseDto,
  ExpenditureCounterResponseDto,
  ExpenditureCounterProvinceRowDto,
  ExpenditureCounterSectorRowDto,
  ExpenditureListResponseDto,
  PublicExpenditureRecordResponseDto,
} from './dto/expenditure-response.dto';

/**
 * Predicate for rows that feed the national homepage counter. Qualifier does not
 * affect inclusion — every primary row with a positive amount counts toward the
 * total and toward its expenditure_type bucket.
 */
const COUNTER_ROW_SQL = `is_primary_record = true AND amount_rands IS NOT NULL AND amount_rands > 0`;

const COUNTER_ROW_SQL_P = `p.is_primary_record = true AND p.amount_rands IS NOT NULL AND p.amount_rands > 0`;

export const EXPENDITURE_COUNTER_DISCLAIMER =
  'Figures reflect alleged or estimated amounts under investigation. The Record does not confirm these as proven losses or thefts. See each story for source attribution and qualifiers.';

export const EXPENDITURE_COUNTER_METHODOLOGY_URL = '/about#money-tracking';

@Injectable()
export class ExpenditureService {
  constructor(
    @InjectRepository(PublicExpenditureRecord)
    private readonly expRepo: Repository<PublicExpenditureRecord>,
    @InjectRepository(Story)
    private readonly storyRepo: Repository<Story>,
  ) {}

  mapRecord(e: PublicExpenditureRecord): PublicExpenditureRecordResponseDto {
    return {
      id: e.id,
      story_id: e.story_id,
      province_id: e.province_id,
      municipality_id: e.municipality_id,
      amount_rands: e.amount_rands,
      amount_qualifier: e.amount_qualifier,
      expenditure_type: e.expenditure_type,
      sector: e.sector,
      description: e.description,
      plain_english: e.plain_english,
      what_it_should_have_funded: e.what_it_should_have_funded,
      source_document: e.source_document,
      source_url: e.source_url,
      reference_date: e.reference_date,
      is_verified: e.is_verified,
      is_primary_record: e.is_primary_record,
      created_at: e.created_at.toISOString(),
      updated_at: e.updated_at.toISOString(),
    };
  }

  async getCounter(): Promise<ExpenditureCounterResponseDto> {
    const totalRow = await this.expRepo.manager.query<{ sum: string }[]>(
      `SELECT COALESCE(SUM(amount_rands::numeric), 0)::text AS sum
         FROM public_expenditure_records
        WHERE ${COUNTER_ROW_SQL}`,
    );

    const typeSums = await this.expRepo.manager.query<{ expenditure_type: string; sum: string }[]>(
      `SELECT expenditure_type::text AS expenditure_type,
              COALESCE(SUM(amount_rands::numeric), 0)::text AS sum
         FROM public_expenditure_records
        WHERE ${COUNTER_ROW_SQL}
        GROUP BY expenditure_type`,
    );

    const sumByType = (t: ExpenditureType): number => {
      const row = typeSums.find((r) => r.expenditure_type === t);
      return bigIntStringToNumber(row?.sum);
    };

    const storyCountRow = await this.expRepo.manager.query<{ c: string }[]>(
      `SELECT COUNT(DISTINCT story_id)::text AS c
         FROM public_expenditure_records
        WHERE ${COUNTER_ROW_SQL}`,
    );

    const provinceRows = await this.expRepo.manager.query<
      { province_name: string; slug: string; total_rands: string; story_count: string }[]
    >(
      `SELECT pr.name AS province_name,
              pr.slug AS slug,
              COALESCE(SUM(p.amount_rands::numeric), 0)::text AS total_rands,
              COUNT(DISTINCT p.story_id)::text AS story_count
         FROM public_expenditure_records p
         INNER JOIN stories s ON s.id = p.story_id
         INNER JOIN provinces pr ON pr.id = COALESCE(p.province_id, s.province_id)
        WHERE ${COUNTER_ROW_SQL_P}
        GROUP BY pr.id, pr.name, pr.slug
        ORDER BY SUM(p.amount_rands::numeric) DESC`,
    );

    const sectorRows = await this.expRepo.manager.query<
      { sector: string; total_rands: string; story_count: string }[]
    >(
      `SELECT sector::text AS sector,
              COALESCE(SUM(amount_rands::numeric), 0)::text AS total_rands,
              COUNT(DISTINCT story_id)::text AS story_count
         FROM public_expenditure_records
        WHERE ${COUNTER_ROW_SQL}
        GROUP BY sector
        ORDER BY SUM(amount_rands::numeric) DESC`,
    );

    const provinceCountRow = await this.expRepo.manager.query<{ c: string }[]>(
      `SELECT COUNT(DISTINCT pr.id)::text AS c
         FROM public_expenditure_records p
         INNER JOIN stories s ON s.id = p.story_id
         INNER JOIN provinces pr ON pr.id = COALESCE(p.province_id, s.province_id)
        WHERE ${COUNTER_ROW_SQL_P}`,
    );

    const updatedRow = await this.expRepo.manager.query<{ mx: Date | null }[]>(
      `SELECT MAX(updated_at) AS mx
         FROM public_expenditure_records
        WHERE ${COUNTER_ROW_SQL}`,
    );

    const byProvince: ExpenditureCounterProvinceRowDto[] = provinceRows.map((r) => ({
      province_name: r.province_name,
      slug: r.slug,
      total_rands: bigIntStringToNumber(r.total_rands),
      story_count: Number(r.story_count),
    }));

    const bySector: ExpenditureCounterSectorRowDto[] = sectorRows.map((r) => ({
      sector: r.sector as ExpenditureCounterSectorRowDto['sector'],
      total_rands: bigIntStringToNumber(r.total_rands),
      story_count: Number(r.story_count),
    }));

    return {
      total_tracked_rands: bigIntStringToNumber(totalRow[0]?.sum),
      total_under_investigation_rands: sumByType(ExpenditureType.UNDER_INVESTIGATION),
      total_allegedly_stolen_rands: sumByType(ExpenditureType.ALLEGEDLY_STOLEN),
      total_confirmed_stolen_rands: sumByType(ExpenditureType.STOLEN),
      total_recovered_rands: sumByType(ExpenditureType.RECOVERED),
      total_prevented_rands: sumByType(ExpenditureType.PREVENTED),
      total_fruitless_wasteful_rands: sumByType(ExpenditureType.FRUITLESS_WASTEFUL),
      story_count: Number(storyCountRow[0]?.c ?? 0),
      province_count: Number(provinceCountRow[0]?.c ?? 0),
      by_province: byProvince,
      by_sector: bySector,
      updated_at: (updatedRow[0]?.mx ?? new Date()).toISOString(),
      disclaimer: EXPENDITURE_COUNTER_DISCLAIMER,
      methodology_url: EXPENDITURE_COUNTER_METHODOLOGY_URL,
    };
  }

  async findByStoryId(storyId: string): Promise<ExpenditureByStoryResponseDto> {
    const story = await this.storyRepo.findOne({ where: { id: storyId } });
    if (!story) {
      throw new NotFoundException(`Story ${storyId} not found.`);
    }

    const records = await this.expRepo.find({
      where: { story_id: storyId },
      order: { amount_rands: 'DESC', created_at: 'DESC' },
    });

    const totalNum = records.reduce(
      (acc, r) => acc + bigIntStringToNumber(r.amount_rands),
      0,
    );

    return {
      story_id: storyId,
      total_rands: totalNum,
      records: records.map((e) => this.mapRecord(e)),
    };
  }

  async findAll(dto: ExpenditureListQueryDto): Promise<ExpenditureListResponseDto> {
    const page = dto.page;
    const limit = dto.limit;
    const offset = (page - 1) * limit;

    const qb = this.expRepo.createQueryBuilder('per');

    if (dto.province_id) {
      qb.andWhere('per.province_id = :pid', { pid: dto.province_id });
    }
    if (dto.municipality_id) {
      qb.andWhere('per.municipality_id = :mid', { mid: dto.municipality_id });
    }
    if (dto.sector) {
      qb.andWhere('per.sector = :sector', { sector: dto.sector });
    }
    if (dto.expenditure_type) {
      qb.andWhere('per.expenditure_type = :et', { et: dto.expenditure_type });
    }

    const total = await qb.clone().getCount();

    const rows = await qb
      .orderBy('CAST(per.amount_rands AS BIGINT)', 'DESC')
      .offset(offset)
      .limit(limit)
      .getMany();

    return {
      data: rows.map((e) => this.mapRecord(e)),
      page,
      limit,
      total,
    };
  }
}
