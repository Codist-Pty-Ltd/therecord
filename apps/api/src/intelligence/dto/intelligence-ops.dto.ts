import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class ExtractEntitiesDto {
  @IsString()
  @MinLength(1)
  text!: string;
}

export class LegalMapDto {
  @IsArray()
  @IsString({ each: true })
  crimes_alleged!: string[];

  @IsOptional()
  @IsString()
  context?: string;
}

export class SimplifyDto {
  @IsString()
  @MinLength(1)
  text!: string;

  @IsIn(['child', 'layperson', 'legal'])
  level!: 'child' | 'layperson' | 'legal';
}
