import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { bigIntStringToNumber } from '../common/utils/money.util';
import { ExpenditureService } from '../expenditure/expenditure.service';
import { Municipality } from '../entities/municipality.entity';
import { Province } from '../entities/province.entity';
import {
  ExpenditureType,
  PublicExpenditureRecord,
} from '../entities/public-expenditure-record.entity';
import {
  Story,
  StoryCategory,
  StoryStatus,
} from '../entities/story.entity';
import { ProvinceStoriesQueryDto, ProvinceStorySortField } from './dto/province-stories-query.dto';
import {
  ExpenditureSectorBreakdownDto,
  ExpenditureTypeBreakdownDto,
  MunicipalityBriefDto,
  ProvinceDetailDto,
  ProvinceListItemDto,
  ProvinceMoneySummaryDto,
  ProvinceStoriesPageDto,
  StoryCategoryCountDto,
  StoryListBriefForProvinceDto,
} from './dto/province-response.dto';

@Injectable()
export class ProvincesService {
  constructor(
    @InjectRepository(Province) private readonly provinceRepo: Repository<Province>,
    @InjectRepository(Story) private readonly storyRepo: Repository<Story>,
    @InjectRepository(Municipality)
    private readonly municipalityRepo: Repository<Municipality>,
    @InjectRepository(PublicExpenditureRecord)
    private readonly expRepo: Repository<PublicExpenditureRecord>,
    private readonly expenditureService: ExpenditureService,
  ) {}

  async findAll(): Promise<ProvinceListItemDto[]> {
    const provinces = await this.provinceRepo.find({ order: { name: 'ASC' } });
    const out: ProvinceListItemDto[] = [];

    for (const p of provinces) {
      const [stories_count, totalExp, categories] = await Promise.all([
        this.storyRepo.count({ where: { province_id: p.id } }),
        this.sumExpenditureForProvince(p.id),
        this.storyCategoriesBreakdown(p.id),
      ]);

      out.push({
        name: p.name,
        slug: p.slug,
        abbreviation: p.abbreviation,
        capital: p.capital,
        stories_count,
        total_expenditure_rands: totalExp,
        story_categories: categories,
        ag_irregular_expenditure_rands: p.auditor_general_irregular_expenditure_rands,
        ag_report_year: p.ag_report_year,
        corruption_watch_complaint_percentage: p.corruption_watch_complaint_percentage,
      });
    }

    return out;
  }

  private async sumExpenditureForProvince(provinceId: string): Promise<number> {
    const row = await this.expRepo.manager.query<{ s: string }[]>(
      `SELECT COALESCE(SUM(p.amount_rands::numeric), 0)::text AS s
         FROM public_expenditure_records p
         INNER JOIN stories s ON s.id = p.story_id
        WHERE COALESCE(p.province_id, s.province_id) = $1`,
      [provinceId],
    );
    return bigIntStringToNumber(row[0]?.s);
  }

  private async storyCategoriesBreakdown(provinceId: string): Promise<StoryCategoryCountDto[]> {
    const rows = await this.storyRepo.manager.query<{ cat: string | null; cnt: string }[]>(
      `SELECT story_category::text AS cat, COUNT(*)::text AS cnt
         FROM stories
        WHERE province_id = $1
        GROUP BY story_category`,
      [provinceId],
    );

    return rows.map((r) => ({
      story_category: (r.cat ?? StoryCategory.OTHER) as StoryCategory,
      count: Number(r.cnt),
    }));
  }

  async findBySlug(slug: string): Promise<ProvinceDetailDto> {
    const province = await this.provinceRepo.findOne({ where: { slug } });
    if (!province) {
      throw new NotFoundException(`Province "${slug}" not found.`);
    }

    const municipalities = await this.municipalityRepo.find({
      where: { province_id: province.id },
      order: { name: 'ASC' },
    });

    const stories = await this.storyRepo.find({
      where: { province_id: province.id },
      order: { updated_at: 'DESC' },
    });

    const typeRows = await this.expRepo.manager.query<{ expenditure_type: string; total: string }[]>(
      `SELECT p.expenditure_type::text AS expenditure_type,
              COALESCE(SUM(p.amount_rands::numeric), 0)::text AS total
         FROM public_expenditure_records p
         INNER JOIN stories s ON s.id = p.story_id
        WHERE COALESCE(p.province_id, s.province_id) = $1
        GROUP BY p.expenditure_type`,
      [province.id],
    );

    const sectorRows = await this.expRepo.manager.query<{ sector: string; total: string }[]>(
      `SELECT p.sector::text AS sector,
              COALESCE(SUM(p.amount_rands::numeric), 0)::text AS total
         FROM public_expenditure_records p
         INNER JOIN stories s ON s.id = p.story_id
        WHERE COALESCE(p.province_id, s.province_id) = $1
        GROUP BY p.sector`,
      [province.id],
    );

    const topRecords = await this.expRepo
      .createQueryBuilder('p')
      .innerJoin('p.story', 's')
      .where('COALESCE(p.province_id, s.province_id) = :pid', { pid: province.id })
      .orderBy('CAST(p.amount_rands AS BIGINT)', 'DESC')
      .take(5)
      .getMany();

    const [stories_count, totalExp, categories] = await Promise.all([
      this.storyRepo.count({ where: { province_id: province.id } }),
      this.sumExpenditureForProvince(province.id),
      this.storyCategoriesBreakdown(province.id),
    ]);

    const expenditure_by_type: ExpenditureTypeBreakdownDto[] = typeRows.map((r) => ({
      expenditure_type: r.expenditure_type as ExpenditureType,
      total_rands: bigIntStringToNumber(r.total),
    }));

    const expenditure_by_sector: ExpenditureSectorBreakdownDto[] = sectorRows.map((r) => ({
      sector: r.sector as ExpenditureSectorBreakdownDto['sector'],
      total_rands: bigIntStringToNumber(r.total),
    }));

    const munDtos: MunicipalityBriefDto[] = municipalities.map((m) => ({
      id: m.id,
      name: m.name,
      short_name: m.short_name,
      slug: m.slug,
      municipality_type: m.municipality_type,
      mayor_name: m.mayor_name,
      ag_audit_outcome: m.ag_audit_outcome,
      ag_audit_year: m.ag_audit_year,
      ag_irregular_expenditure_rands: m.ag_irregular_expenditure_rands,
    }));

    return {
      name: province.name,
      slug: province.slug,
      abbreviation: province.abbreviation,
      capital: province.capital,
      stories_count,
      total_expenditure_rands: totalExp,
      story_categories: categories,
      ag_irregular_expenditure_rands: province.auditor_general_irregular_expenditure_rands,
      ag_report_year: province.ag_report_year,
      corruption_watch_complaint_percentage: province.corruption_watch_complaint_percentage,
      municipalities: munDtos,
      stories: stories.map((s) => this.mapStoryBrief(s)),
      expenditure_by_type,
      expenditure_by_sector,
      top_expenditure_records: topRecords.map((e) => this.expenditureService.mapRecord(e)),
    };
  }

  private mapStoryBrief(s: Story): StoryListBriefForProvinceDto {
    return {
      id: s.id,
      title: s.title,
      slug: s.slug,
      domain: s.domain,
      status: s.status,
      story_category: s.story_category,
      total_amount_rands: s.total_amount_rands,
      updated_at: s.updated_at.toISOString(),
    };
  }

  async findStoriesForProvince(
    slug: string,
    dto: ProvinceStoriesQueryDto,
  ): Promise<ProvinceStoriesPageDto> {
    const province = await this.provinceRepo.findOne({ where: { slug } });
    if (!province) {
      throw new NotFoundException(`Province "${slug}" not found.`);
    }

    const page = dto.page;
    const limit = dto.limit;
    const offset = (page - 1) * limit;

    const qb = this.storyRepo
      .createQueryBuilder('story')
      .where('story.province_id = :pid', { pid: province.id });

    if (dto.story_category != null) {
      qb.andWhere('story.story_category = :sc', { sc: dto.story_category });
    }
    if (dto.status != null) {
      qb.andWhere('story.status = :st', { st: dto.status });
    }
    if (dto.sector != null) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM public_expenditure_records per
                 WHERE per.story_id = story.id AND per.sector = :sector)`,
        { sector: dto.sector },
      );
    }

    const total = await qb.clone().getCount();

    const sort: ProvinceStorySortField = dto.sort === 'total_amount_rands' ? 'total_amount_rands' : 'updated_at';
    const dir = dto.dir === 'ASC' ? 'ASC' : 'DESC';

    if (sort === 'total_amount_rands') {
      qb.orderBy('CAST(story.total_amount_rands AS BIGINT)', dir, 'NULLS LAST');
    } else {
      qb.orderBy('story.updated_at', dir);
    }

    const rows = await qb.offset(offset).limit(limit).getMany();

    return {
      data: rows.map((s) => this.mapStoryBrief(s)),
      page,
      limit,
      total,
    };
  }

  async getMoneySummary(slug: string): Promise<ProvinceMoneySummaryDto> {
    const province = await this.provinceRepo.findOne({ where: { slug } });
    if (!province) {
      throw new NotFoundException(`Province "${slug}" not found.`);
    }

    const typeSums = await this.expRepo.manager.query<{ expenditure_type: string; sum: string }[]>(
      `SELECT p.expenditure_type::text AS expenditure_type,
              COALESCE(SUM(p.amount_rands::numeric), 0)::text AS sum
         FROM public_expenditure_records p
         INNER JOIN stories s ON s.id = p.story_id
        WHERE COALESCE(p.province_id, s.province_id) = $1
        GROUP BY p.expenditure_type`,
      [province.id],
    );

    const byType = (t: ExpenditureType): number =>
      bigIntStringToNumber(typeSums.find((r) => r.expenditure_type === t)?.sum);

    const sectorRows = await this.expRepo.manager.query<{ sector: string; sum: string }[]>(
      `SELECT p.sector::text AS sector,
              COALESCE(SUM(p.amount_rands::numeric), 0)::text AS sum
         FROM public_expenditure_records p
         INNER JOIN stories s ON s.id = p.story_id
        WHERE COALESCE(p.province_id, s.province_id) = $1
        GROUP BY p.sector
        ORDER BY SUM(p.amount_rands::numeric) DESC`,
      [province.id],
    );

    const largest = await this.expRepo
      .createQueryBuilder('p')
      .innerJoin('p.story', 's')
      .where('COALESCE(p.province_id, s.province_id) = :pid', { pid: province.id })
      .orderBy('CAST(p.amount_rands AS BIGINT)', 'DESC')
      .take(1)
      .getOne();

    const story_count = await this.storyRepo.count({ where: { province_id: province.id } });

    return {
      province: province.name,
      total_under_investigation: byType(ExpenditureType.UNDER_INVESTIGATION),
      total_allegedly_stolen: byType(ExpenditureType.ALLEGEDLY_STOLEN),
      total_confirmed_stolen: byType(ExpenditureType.STOLEN),
      total_recovered: byType(ExpenditureType.RECOVERED),
      total_fruitless_wasteful: byType(ExpenditureType.FRUITLESS_WASTEFUL),
      by_sector: sectorRows.map((r) => ({
        sector: r.sector,
        amount: bigIntStringToNumber(r.sum),
      })),
      largest_single_record: largest ? this.expenditureService.mapRecord(largest) : null,
      story_count,
    };
  }
}
