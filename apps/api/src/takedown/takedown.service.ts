import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TakedownRequest,
  TakedownRequestStatus,
} from '../entities/takedown-request.entity';
import { CreateTakedownRequestDto } from './dto/create-takedown-request.dto';

export interface CreateTakedownResponseDto {
  id: string;
  message: string;
}

@Injectable()
export class TakedownService {
  constructor(
    @InjectRepository(TakedownRequest)
    private readonly repo: Repository<TakedownRequest>,
  ) {}

  async create(dto: CreateTakedownRequestDto): Promise<CreateTakedownResponseDto> {
    const row = this.repo.create({
      request_type: dto.request_type,
      requestor_name: dto.requestor_name.trim(),
      requestor_email: dto.requestor_email.trim(),
      content_url: dto.content_url.trim(),
      description: dto.description.trim(),
      status: TakedownRequestStatus.RECEIVED,
      resolution_notes: null,
      resolved_at: null,
    });
    const saved = await this.repo.save(row);
    return {
      id: saved.id,
      message: `Your request has been received. Reference: ${saved.id}. We will respond within 5 business days.`,
    };
  }

  async findAllForAdmin(): Promise<TakedownRequest[]> {
    return this.repo.find({
      order: { received_at: 'DESC' },
    });
  }
}
