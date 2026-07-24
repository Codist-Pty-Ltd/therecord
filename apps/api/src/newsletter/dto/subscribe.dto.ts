import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({ example: 'reader@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiPropertyOptional({ example: 'Thabo' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'footer', description: 'Signup location' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;
}
