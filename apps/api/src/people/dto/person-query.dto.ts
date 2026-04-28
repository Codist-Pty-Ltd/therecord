import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PersonStatus } from '../../entities/person.entity';

export class PersonQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Substring match against full_name or any alias (case-insensitive).',
    example: 'Mkhwanazi',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ enum: PersonStatus })
  @IsOptional()
  @IsEnum(PersonStatus)
  status?: PersonStatus;
}
