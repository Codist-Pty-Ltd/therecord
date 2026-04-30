import {
  IsEmail,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { TakedownRequestType } from '../../entities/takedown-request.entity';

const REQUEST_TYPES = Object.values(TakedownRequestType) as string[];

export class CreateTakedownRequestDto {
  @IsIn(REQUEST_TYPES)
  request_type!: TakedownRequestType;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  requestor_name!: string;

  @IsEmail()
  @MaxLength(300)
  requestor_email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content_url!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  description!: string;
}
