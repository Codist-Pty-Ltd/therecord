import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { bigIntStringToNumber } from '../common/utils/money.util';
import { Municipality } from '../entities/municipality.entity';
import {
  ExpenditureSector,
  ExpenditureType,
  PublicExpenditureRecord,
} from '../entities/public-expenditure-record.entity';
import { Story } from '../entities/story.entity';
import { MunicipalityListQueryDto } from './dto/municipality-list-query.dto';
import { MunicipalityDetailDto, MunicipalityListItemDto } from './dto/municipality-response.dto';

@Injectable()
export class MunicipalitiesService {
  constructor(
    @InjectRepository(Municipality)
    private readonly munRepo: Repository<Municipality>,
    @InjectRepository(Story) private readonly storyRepo: Repository<Story>,
    @InjectRepository(PublicExpenditureRecord)
    private readonly expRepo: Repository<PublicExpenditureRecord>,
  ) {}

  async findAll(dto: MunicipalityListQueryDto): Promise<MunicipalityListItemDto[]> {
    const qb = this.munRepo
      .createQueryBuilder('m')
      .innerJoinAndSelect('m.province', 'p');

    if (dto.province_slug) {
      qb.andWhere('p.slug = :pslug', { pslug: dto.province_slug });
    }
    if (dto.municipality_type) {
      qb.andWhere('m.municipality_type = :mt', { mt: dto.municipality_type });
    }
    if (dto.ag_audit_outcome) {
      qb.andWhere('m.ag_audit_outcome = :ao', { ao: dto.ag_audit_outcome });
    }

    qb.orderBy('p.name', 'ASC').addOrderBy('m.name', 'ASC');

    const rows = await qb.getMany();
    if (rows.length === 0) {
      return [];
    }

    const ids = rows.map((r) => r.id);
    const countRows = await this.storyRepo
      .createQueryBuilder('s')
      .select('s.municipality_id', 'mid')
      .addSelect('COUNT(*)', 'c')
      .where('s.municipality_id IN (:...ids)', { ids })
      .groupBy('s.municipality_id')
      .getRawMany<{ mid: string; c: string }>();

    const countMap = new Map(countRows.map((r) => [r.mid, Number(r.c)]));

    return rows.map((m) => {
      const p = m.province;
      return {
        id: m.id,
        name: m.name,
        short_name: m.short_name,
        slug: m.slug,
        municipality_type: m.municipality_type,
        province_slug: p.slug,
        province_name: p.name,
        ag_audit_outcome: m.ag_audit_outcome,
        ag_audit_year: m.ag_audit_year,
        ag_irregular_expenditure_rands: m.ag_irregular_expenditure_rands,
        stories_count: countMap.get(m.id) ?? 0,
      };
    });
  }

  async findBySlug(slug: string): Promise<MunicipalityDetailDto> {
    const m = await this.munRepo.findOne({
      where: { slug },
      relations: ['province'],
    });
    if (!m || !m.province) {
      throw new NotFoundException(`Municipality "${slug}" not found.`);
    }

    const stories = await this.storyRepo.find({
      where: { municipality_id: m.id },
      order: { updated_at: 'DESC' },
    });

    const row = await this.expRepo.manager.query<{ s: string }[]>(
      `SELECT COALESCE(SUM(p.amount_rands::numeric), 0)::text AS s
         FROM public_expenditure_records p
         INNER JOIN stories s ON s.id = p.story_id
        WHERE COALESCE(p.municipality_id, s.municipality_id) = $1`,
      [m.id],
    );

    const total = bigIntStringToNumber(row[0]?.s);

    const typeRows = await this.expRepo.manager.query<{ expenditure_type: string; total: string }[]>(
      `SELECT p.expenditure_type::text AS expenditure_type,
              COALESCE(SUM(p.amount_rands::numeric), 0)::text AS total
         FROM public_expenditure_records p
         INNER JOIN stories s ON s.id = p.story_id
        WHERE COALESCE(p.municipality_id, s.municipality_id) = $1
        GROUP BY p.expenditure_type`,
      [m.id],
    );

    const sectorRows = await this.expRepo.manager.query<{ sector: string; total: string }[]>(
      `SELECT p.sector::text AS sector,
              COALESCE(SUM(p.amount_rands::numeric), 0)::text AS total
         FROM public_expenditure_records p
         INNER JOIN stories s ON s.id = p.story_id
        WHERE COALESCE(p.municipality_id, s.municipality_id) = $1
        GROUP BY p.sector
        ORDER BY SUM(p.amount_rands::numeric) DESC`,
      [m.id],
    );

    return {
      id: m.id,
      name: m.name,
      short_name: m.short_name,
      slug: m.slug,
      municipality_type: m.municipality_type,
      province_id: m.province_id,
      province_name: m.province.name,
      province_slug: m.province.slug,
      mayor_name: m.mayor_name,
      governing_party: m.governing_party,
      plain_english_audit_outcome: m.plain_english_audit_outcome,
      ag_audit_outcome: m.ag_audit_outcome,
      ag_audit_year: m.ag_audit_year,
      ag_irregular_expenditure_rands: m.ag_irregular_expenditure_rands,
      annual_budget_rands: m.annual_budget_rands,
      total_money_tracked_rands: total,
      ag_audit_history: [
        {
          ag_audit_year: m.ag_audit_year,
          ag_audit_outcome: m.ag_audit_outcome,
          ag_irregular_expenditure_rands: m.ag_irregular_expenditure_rands,
        },
      ],
      stories: stories.map((s) => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        domain: s.domain,
        status: s.status,
        story_category: s.story_category,
        total_amount_rands: s.total_amount_rands,
        updated_at: s.updated_at.toISOString(),
      })),
      expenditure_by_type: typeRows.map((r) => ({
        expenditure_type: r.expenditure_type as ExpenditureType,
        total_rands: bigIntStringToNumber(r.total),
      })),
      expenditure_by_sector: sectorRows.map((r) => ({
        sector: r.sector as ExpenditureSector,
        amount: bigIntStringToNumber(r.total),
      })),
    };
  }
}
