import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { StoryDomain } from '../../entities/story.entity';

/**
 * Payload for POST /api/ingestion/article.
 *
 * The caller supplies the raw article as it came in from a publisher; the
 * ingestion service takes it from there — NER, clustering, story creation,
 * person linking, optional plain-English summary, persistence.
 *
 * Field notes:
 *   - `full_text` is the NLP corpus and is NEVER persisted. Only
 *     `content_snippet` (fair-use excerpt, ≤500 chars) lands in `articles`.
 *   - `story_id_hint` short-circuits clustering when a human already knows
 *     which thread the article belongs to.
 *   - `default_domain` is only applied when clustering fails to match an
 *     existing story and a new story must be created from the headline.
 */
export class IngestArticleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  headline!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  source_name!: string;

  @IsUrl({ require_protocol: true })
  @MaxLength(2000)
  source_url!: string;

  @IsISO8601()
  published_at!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content_snippet!: string;

  @IsString()
  @MinLength(1)
  full_text!: string;

  @IsOptional()
  @IsUUID('4')
  story_id_hint?: string;

  @IsOptional()
  @IsBoolean()
  simplify_summary?: boolean;

  @IsOptional()
  @IsEnum(StoryDomain, {
    message:
      'default_domain must be one of: criminal_justice, politics, organised_crime, business, labour.',
  })
  default_domain?: StoryDomain;
}
