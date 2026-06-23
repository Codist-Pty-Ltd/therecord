import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { buildPaginationMeta } from '../common/dto/pagination-meta.dto';
import { CommissionPerson } from '../entities/commission_person.entity';
import { Person } from '../entities/person.entity';
import { StoryPerson } from '../entities/story_person.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import { PersonQueryDto } from './dto/person-query.dto';
import {
  PersonCommissionAppearanceDto,
  PersonDetailResponseDto,
  PersonEventAppearanceDto,
  PersonListItemDto,
  PersonListResponseDto,
  PersonStoryAppearanceDto,
} from './dto/person-response.dto';

@Injectable()
export class PeopleService {
  constructor(
    @InjectRepository(Person) private readonly personRepo: Repository<Person>,
    @InjectRepository(StoryPerson)
    private readonly storyPersonRepo: Repository<StoryPerson>,
    @InjectRepository(CommissionPerson)
    private readonly commissionPersonRepo: Repository<CommissionPerson>,
    @InjectRepository(TimelineEvent)
    private readonly eventRepo: Repository<TimelineEvent>,
  ) {}

  async findAll(query: PersonQueryDto): Promise<PersonListResponseDto> {
    const page = query.page;
    const limit = query.limit;
    const offset = (page - 1) * limit;

    const qb = this.personRepo.createQueryBuilder('p');

    if (query.search) {
      qb.andWhere(
        "(p.full_name ILIKE :search OR array_to_string(p.aliases, ' ') ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    if (query.status) {
      qb.andWhere('p.status = :status', { status: query.status });
    }

    qb.orderBy('p.full_name', 'ASC').skip(offset).take(limit);

    const [rows, total] = await qb.getManyAndCount();

    const data = await this.mapListItemsWithCommissionCounts(rows);

    return {
      data,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: string): Promise<PersonDetailResponseDto> {
    const person = await this.personRepo.findOne({ where: { id } });
    if (!person) {
      throw new NotFoundException(`Person ${id} not found.`);
    }

    const storyAppearances = await this.storyPersonRepo.find({
      where: { person_id: id },
      relations: ['story'],
    });

    const storyIds = storyAppearances.map((sp) => sp.story_id);

    const events =
      storyIds.length === 0
        ? []
        : await this.eventRepo.find({
            where: { story_id: In(storyIds) },
            order: { event_date: 'ASC', created_at: 'ASC' },
          });

    /**
     * Load every commission this person is tied to, with full commission
     * context so the page can render "Implicated at Zondo Commission
     * (chaired by Raymond Zondo, 2018)". The commission itself already
     * carries `chair_name`, so no extra query is needed.
     */
    const commissionAppearances = await this.commissionPersonRepo.find({
      where: { person_id: id },
      relations: ['commission'],
    });

    const distinctCommissionCount = new Set(
      commissionAppearances.map((cp) => cp.commission_id),
    ).size;

    return {
      ...this.mapToListItem(person),
      commission_count: distinctCommissionCount,
      stories: storyAppearances.map((sp) => this.mapStoryAppearance(sp)),
      commissions: commissionAppearances
        .map((cp) => this.mapCommissionAppearance(cp))
        .sort((a, b) =>
          (a.announced_date ?? '9999-12-31').localeCompare(
            b.announced_date ?? '9999-12-31',
          ),
        ),
      events: events.map((e) => this.mapEvent(e)),
    };
  }

  /**
   * Batch load people linked to commissions — used by GraphQL DataLoader
   * to avoid N+1 queries when resolving `Commission.people`.
   */
  async findByCommissionIds(commissionIds: string[]): Promise<
    Array<{
      commissionId: string;
      id: string;
      name: string;
      role: string | null;
    }>
  > {
    if (commissionIds.length === 0) return [];

    const rows = await this.commissionPersonRepo.find({
      where: { commission_id: In(commissionIds) },
      relations: ['person'],
      order: { role: 'ASC' },
    });

    return rows.map((cp) => ({
      commissionId: cp.commission_id,
      id: cp.person_id,
      name: cp.person.full_name,
      role: cp.role,
    }));
  }

  /* ------------------------------------------------------------ mappers */

  /**
   * Batch-loads distinct commission counts for a page of people (one round-trip).
   */
  private async mapListItemsWithCommissionCounts(
    people: Person[],
  ): Promise<PersonListItemDto[]> {
    if (people.length === 0) {
      return [];
    }
    const ids = people.map((p) => p.id);
    const raw = await this.commissionPersonRepo
      .createQueryBuilder('cp')
      .select('cp.person_id', 'personId')
      .addSelect('COUNT(DISTINCT cp.commission_id)', 'cnt')
      .where('cp.person_id IN (:...ids)', { ids })
      .groupBy('cp.person_id')
      .getRawMany<{ personId: string; cnt: string }>();
    const byId = new Map(
      raw.map((r) => [r.personId, Number.parseInt(r.cnt, 10)] as const),
    );
    return people.map((p) => {
      const base = this.mapToListItem(p);
      return {
        ...base,
        commission_count: byId.get(p.id) ?? 0,
      };
    });
  }

  private mapToListItem(p: Person): PersonListItemDto {
    return {
      id: p.id,
      full_name: p.full_name,
      aliases: p.aliases,
      current_role: p.current_role,
      organisation: p.organisation,
      status: p.status,
      profile_summary: p.profile_summary,
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
      commission_count: 0,
    };
  }

  private mapStoryAppearance(sp: StoryPerson): PersonStoryAppearanceDto {
    return {
      id: sp.story.id,
      title: sp.story.title,
      slug: sp.story.slug,
      domain: sp.story.domain,
      status: sp.story.status,
      role_in_story: sp.role_in_story,
      is_key_figure: sp.is_key_figure,
    };
  }

  private mapCommissionAppearance(
    cp: CommissionPerson,
  ): PersonCommissionAppearanceDto {
    return {
      id: cp.id,
      commission_id: cp.commission_id,
      popular_name: cp.commission.popular_name,
      full_name: cp.commission.full_name,
      slug: cp.commission.slug,
      domain: cp.commission.domain,
      status: cp.commission.status,
      role: cp.role,
      summary: cp.summary,
      chair_name: cp.commission.chair_name,
      announced_date: cp.commission.announced_date,
      concluded_date: cp.commission.concluded_date,
      report_released_date: cp.commission.report_released_date,
      produced_prosecutions: cp.commission.produced_prosecutions,
    };
  }

  private mapEvent(e: TimelineEvent): PersonEventAppearanceDto {
    return {
      id: e.id,
      story_id: e.story_id,
      event_date: e.event_date,
      event_type: e.event_type,
      title: e.title,
      significance: e.significance,
    };
  }
}
