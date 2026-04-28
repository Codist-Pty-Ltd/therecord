import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 124 })
  total!: number;

  @ApiProperty({ example: 7 })
  total_pages!: number;
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMetaDto {
  return {
    page,
    limit,
    total,
    total_pages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}
