import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TransformationPolicy } from '../entities/transformation-policy.entity';
import { TransformationPolicyDto } from './dto/transformation-policy-response.dto';

@Injectable()
export class TransformationPoliciesService {
  constructor(
    @InjectRepository(TransformationPolicy)
    private readonly repo: Repository<TransformationPolicy>,
  ) {}

  async findBySlug(slug: string): Promise<TransformationPolicyDto> {
    const row = await this.repo.findOne({ where: { slug } });
    if (!row) {
      throw new NotFoundException(`Transformation policy with slug "${slug}" not found.`);
    }
    return this.toDto(row);
  }

  private toDto(p: TransformationPolicy): TransformationPolicyDto {
    return {
      id: p.id,
      name: p.name,
      abbreviation: p.abbreviation,
      slug: p.slug,
      enabling_act: p.enabling_act,
      status: p.status,
      purpose_summary: p.purpose_summary,
      plain_english_child: p.plain_english_child,
      plain_english_layperson: p.plain_english_layperson,
      plain_english_legal: p.plain_english_legal,
      historical_context: p.historical_context,
      arguments_for: p.arguments_for,
      arguments_against: p.arguments_against,
      current_legal_challenges: p.current_legal_challenges,
      impact_on_ordinary_people: p.impact_on_ordinary_people,
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
    };
  }
}
