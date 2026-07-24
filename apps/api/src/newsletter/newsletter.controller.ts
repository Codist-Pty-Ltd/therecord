import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { type Response } from 'express';
import { IngestionApiKeyGuard } from '../auth/ingestion-api-key.guard';
import { SendDigestDto } from './dto/send-digest.dto';
import { SubscribeDto } from './dto/subscribe.dto';
import { NewsletterService } from './newsletter.service';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe to the weekly digest (double opt-in)' })
  subscribe(@Body() body: SubscribeDto) {
    return this.newsletter.subscribe(body);
  }

  @Get('confirm/:token')
  @ApiOperation({ summary: 'Confirm subscription via email link' })
  async confirm(@Param('token') token: string, @Res() res: Response): Promise<void> {
    const result = await this.newsletter.confirmByToken(token);
    if (result === 'not_found') {
      throw new NotFoundException('Confirmation link not found or expired.');
    }
    if (result === 'already') {
      res.redirect(302, '/newsletter/confirmed?status=already');
      return;
    }
    res.redirect(302, '/newsletter/confirmed');
  }

  @Get('unsubscribe/:token')
  @ApiOperation({ summary: 'One-click unsubscribe via email link' })
  async unsubscribe(
    @Param('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    const ok = await this.newsletter.unsubscribeByToken(token);
    if (!ok) {
      throw new NotFoundException('Unsubscribe link not found.');
    }
    res.redirect(302, '/newsletter/unsubscribed');
  }

  @Get('stats')
  @UseGuards(IngestionApiKeyGuard)
  @ApiHeader({ name: 'x-ingestion-key', required: true })
  @ApiOperation({ summary: 'Operator: subscriber counts' })
  stats() {
    return this.newsletter.getStats();
  }

  @Post('send-digest')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IngestionApiKeyGuard)
  @ApiHeader({ name: 'x-ingestion-key', required: true })
  @ApiOperation({ summary: 'Operator: send or preview weekly digest' })
  sendDigest(@Body() body: SendDigestDto) {
    return this.newsletter.sendWeeklyDigest({ dryRun: body.dryRun ?? false });
  }
}
