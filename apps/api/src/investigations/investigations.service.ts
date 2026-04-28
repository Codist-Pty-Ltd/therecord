import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Investigation } from '../entities/investigation.entity';
import { Story } from '../entities/story.entity';
import {
  InvestigationQueryDto,
  InvestigationResponseDto,
} from './dto/investigation-response.dto';

@Injectable()
export class InvestigationsService {
  constructor(
    @InjectRepository(Investigation)
    private readonly investigationRepo: Repository<Investigation>,
    @InjectRepository(Story) private readonly storyRepo: Repository<Story>,
  ) {}

  async findAll(query: InvestigationQueryDto): Promise<InvestigationResponseDto[]> {
    const qb = this.investigationRepo.createQueryBuilder('i');

    if (query.status) {
      qb.andWhere('i.status = :status', { status: query.status });
    }
    if (query.investigation_type) {
      qb.andWhere('i.investigation_type = :type', { type: query.investigation_type });
    }

    qb.orderBy('i.started_at', 'DESC', 'NULLS LAST').addOrderBy('i.name', 'ASC');

    const investigations = await qb.getMany();
    return investigations.map((i) => this.map(i));
  }

  async findByStory(storyId: string): Promise<InvestigationResponseDto[]> {
    const story = await this.storyRepo.findOne({ where: { id: storyId } });
    if (!story) {
      throw new NotFoundException(`Story ${storyId} not found.`);
    }

    const investigations = await this.investigationRepo.find({
      where: { story_id: storyId },
      order: { started_at: 'ASC', name: 'ASC' },
    });

    return investigations.map((i) => this.map(i));
  }

  private map(i: Investigation): InvestigationResponseDto {
    return {
      id: i.id,
      story_id: i.story_id,
      name: i.name,
      investigation_type: i.investigation_type,
      established_by: i.established_by,
      legal_basis: i.legal_basis,
      chair_name: i.chair_name,
      status: i.status,
      official_url: i.official_url,
      started_at: i.started_at,
      concluded_at: i.concluded_at,
    };
  }
}
