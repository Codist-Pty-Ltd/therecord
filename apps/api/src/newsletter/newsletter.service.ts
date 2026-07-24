import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Resend } from 'resend';
import { Story, StoryStatus } from '../entities/story.entity';
import { Subscriber, SubscriberStatus } from '../entities/subscriber.entity';
import { SubscribeDto } from './dto/subscribe.dto';

const DIGEST_STORY_LIMIT = 6;

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly webBaseUrl: string;
  private lastDigestSentAt: Date | null = null;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(Story)
    private readonly storyRepo: Repository<Story>,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.fromEmail =
      this.config.get<string>('NEWSLETTER_FROM_EMAIL') ??
      'newsletter@therecord.co.za';
    this.fromName =
      this.config.get<string>('NEWSLETTER_FROM_NAME') ?? 'The Record';
    this.webBaseUrl = (
      this.config.get<string>('NEWSLETTER_WEB_URL') ??
      'https://therecord.co.za'
    ).replace(/\/+$/, '');
  }

  async subscribe(dto: SubscribeDto): Promise<{ message: string }> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.subscriberRepo.findOne({ where: { email } });

    if (existing?.status === SubscriberStatus.ACTIVE) {
      return { message: 'Already subscribed' };
    }

    const confirmToken = randomUUID();
    const unsubscribeToken = randomUUID();

    if (existing) {
      existing.name = dto.name?.trim() || existing.name;
      existing.status = SubscriberStatus.PENDING;
      existing.confirm_token = confirmToken;
      existing.unsubscribe_token = unsubscribeToken;
      existing.source = dto.source ?? existing.source;
      existing.unsubscribed_at = null;
      await this.subscriberRepo.save(existing);
    } else {
      await this.subscriberRepo.save(
        this.subscriberRepo.create({
          email,
          name: dto.name?.trim() || null,
          status: SubscriberStatus.PENDING,
          confirm_token: confirmToken,
          unsubscribe_token: unsubscribeToken,
          source: dto.source ?? null,
        }),
      );
    }

    await this.sendConfirmationEmail(email, dto.name, confirmToken);
    return { message: 'Check your email to confirm' };
  }

  async confirmByToken(
    token: string,
  ): Promise<'confirmed' | 'already' | 'not_found'> {
    const subscriber = await this.subscriberRepo.findOne({
      where: { confirm_token: token },
    });
    if (!subscriber) {
      return 'not_found';
    }
    if (subscriber.status === SubscriberStatus.ACTIVE) {
      return 'already';
    }

    subscriber.status = SubscriberStatus.ACTIVE;
    subscriber.confirmed_at = new Date();
    subscriber.confirm_token = null;
    await this.subscriberRepo.save(subscriber);

    await this.sendWelcomeEmail(subscriber);
    return 'confirmed';
  }

  async unsubscribeByToken(token: string): Promise<boolean> {
    const subscriber = await this.subscriberRepo.findOne({
      where: { unsubscribe_token: token },
    });
    if (!subscriber) {
      return false;
    }

    subscriber.status = SubscriberStatus.UNSUBSCRIBED;
    subscriber.unsubscribed_at = new Date();
    await this.subscriberRepo.save(subscriber);
    return true;
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    unsubscribed: number;
    lastDigestSentAt: Date | null;
  }> {
    const [total, active, pending, unsubscribed] = await Promise.all([
      this.subscriberRepo.count(),
      this.subscriberRepo.count({ where: { status: SubscriberStatus.ACTIVE } }),
      this.subscriberRepo.count({ where: { status: SubscriberStatus.PENDING } }),
      this.subscriberRepo.count({
        where: { status: SubscriberStatus.UNSUBSCRIBED },
      }),
    ]);

    return {
      total,
      active,
      pending,
      unsubscribed,
      lastDigestSentAt: this.lastDigestSentAt,
    };
  }

  async sendWeeklyDigest(options?: { dryRun?: boolean }): Promise<{
    sent: number;
    skipped: number;
    storiesCount: number;
    subscriberCount: number;
    subject?: string;
    previewHtml?: string;
  }> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const stories = await this.storyRepo.find({
      where: {
        status: StoryStatus.ACTIVE,
        updated_at: MoreThanOrEqual(since),
      },
      order: { updated_at: 'DESC' },
      take: DIGEST_STORY_LIMIT,
    });

    if (stories.length === 0) {
      this.logger.log('Weekly digest skipped — no stories updated in the last 7 days.');
      return {
        sent: 0,
        skipped: 0,
        storiesCount: 0,
        subscriberCount: 0,
      };
    }

    const subscribers = await this.subscriberRepo.find({
      where: { status: SubscriberStatus.ACTIVE },
    });

    const featured = stories[0];
    const others = stories.slice(1, 6);
    const weekLabel = this.formatWeekRange(since, new Date());
    const subject =
      featured != null
        ? `The Record — ${featured.title}`
        : `The Record — Week of ${weekLabel}`;

    const previewHtml = this.renderDigestHtml({
      featured,
      others,
      weekLabel,
      unsubscribeToken: 'preview-token',
    });

    if (options?.dryRun) {
      return {
        sent: 0,
        skipped: subscribers.length,
        storiesCount: stories.length,
        subscriberCount: subscribers.length,
        subject,
        previewHtml,
      };
    }

    if (!this.resend) {
      throw new ServiceUnavailableException(
        'RESEND_API_KEY is not configured — cannot send digest.',
      );
    }

    let sent = 0;
    for (const subscriber of subscribers) {
      const html = this.renderDigestHtml({
        featured,
        others,
        weekLabel,
        unsubscribeToken: subscriber.unsubscribe_token,
        name: subscriber.name,
      });

      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: subscriber.email,
        subject,
        html,
      });

      if (result.error) {
        this.logger.warn(
          `Digest send failed for ${subscriber.email}: ${result.error.message}`,
        );
        continue;
      }

      subscriber.last_email_sent_at = new Date();
      await this.subscriberRepo.save(subscriber);
      sent += 1;
    }

    this.lastDigestSentAt = new Date();
    this.logger.log(`Weekly digest sent to ${sent}/${subscribers.length} subscribers.`);

    return {
      sent,
      skipped: subscribers.length - sent,
      storiesCount: stories.length,
      subscriberCount: subscribers.length,
      subject,
    };
  }

  private async sendConfirmationEmail(
    email: string,
    name: string | undefined,
    confirmToken: string,
  ): Promise<void> {
    const confirmUrl = `${this.webBaseUrl}/api/newsletter/confirm/${confirmToken}`;
    const greeting = name?.trim() ? `Hi ${name.trim()}` : 'Hi there';
    const html = `
      <p>${greeting},</p>
      <p>Thanks for subscribing to <strong>The Record</strong> — South Africa's accountability journalism platform.</p>
      <p><a href="${confirmUrl}">Confirm your subscription</a></p>
      <p>If you did not sign up, you can ignore this email.</p>
      <p><a href="${this.webBaseUrl}">therecord.co.za</a></p>
    `;

    await this.sendEmail(
      email,
      'Confirm your subscription to The Record',
      html,
    );
  }

  private async sendWelcomeEmail(subscriber: Subscriber): Promise<void> {
    const manageUrl = `${this.webBaseUrl}/api/newsletter/unsubscribe/${subscriber.unsubscribe_token}`;
    const html = `
      <p>You're confirmed!</p>
      <p>You'll receive our weekly digest every Monday with the latest accountability journalism from South Africa.</p>
      <p><a href="${this.webBaseUrl}">Browse The Record</a></p>
      <p style="font-size:12px;color:#666;">Manage your subscription: <a href="${manageUrl}">unsubscribe</a></p>
    `;

    await this.sendEmail(subscriber.email, 'Welcome to The Record', html);
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    if (!this.resend) {
      this.logger.warn(
        `RESEND_API_KEY not set — would send "${subject}" to ${to}`,
      );
      return;
    }

    const result = await this.resend.emails.send({
      from: `${this.fromName} <${this.fromEmail}>`,
      to,
      subject,
      html,
    });

    if (result.error) {
      this.logger.error(`Resend error for ${to}: ${result.error.message}`);
    }
  }

  private renderDigestHtml(input: {
    featured: Story;
    others: Story[];
    weekLabel: string;
    unsubscribeToken: string;
    name?: string | null;
  }): string {
    const { featured, others, weekLabel, unsubscribeToken, name } = input;
    const featuredUrl = `${this.webBaseUrl}/story/${featured.slug}`;
    const featuredSummary =
      featured.plain_english_summary?.trim() ||
      featured.summary?.trim() ||
      featured.title;

    const otherBlocks = others
      .map((story) => {
        const url = `${this.webBaseUrl}/story/${story.slug}`;
        const summary =
          story.plain_english_summary?.trim() ||
          story.summary?.trim() ||
          story.title;
        const date = story.updated_at.toISOString().slice(0, 10);
        return `
          <div style="margin:16px 0;padding:12px 0;border-top:1px solid #e5e5e5;">
            <p style="margin:0 0 4px;font-size:11px;color:#666;">${story.story_category ?? story.domain} · ${date}</p>
            <p style="margin:0 0 6px;font-size:16px;"><a href="${url}">${this.escapeHtml(story.title)}</a></p>
            <p style="margin:0;font-size:14px;color:#333;">${this.escapeHtml(summary.slice(0, 180))}${summary.length > 180 ? '…' : ''}</p>
          </div>`;
      })
      .join('');

    const greeting = name?.trim() ? `Hi ${name.trim()},` : '';

    return `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <p style="font-family:monospace;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#666;">The Record · Weekly digest</p>
        <p style="font-size:13px;color:#666;">${weekLabel}</p>
        ${greeting ? `<p>${this.escapeHtml(greeting)}</p>` : ''}
        <div style="margin:24px 0;padding:20px;background:#faf7f2;border-radius:4px;">
          <p style="margin:0 0 8px;font-size:11px;color:#666;">Featured</p>
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;"><a href="${featuredUrl}">${this.escapeHtml(featured.title)}</a></h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">${this.escapeHtml(featuredSummary.slice(0, 320))}${featuredSummary.length > 320 ? '…' : ''}</p>
          <a href="${featuredUrl}" style="display:inline-block;padding:10px 16px;background:#1a1a1a;color:#faf7f2;text-decoration:none;font-family:monospace;font-size:12px;">Read more →</a>
        </div>
        ${otherBlocks}
        <p style="margin:24px 0 8px;font-size:13px;">
          <a href="${this.webBaseUrl}/commissions">Commissions</a> ·
          <a href="${this.webBaseUrl}/people">People</a> ·
          <a href="${this.webBaseUrl}/search">Search</a> ·
          <a href="${this.webBaseUrl}/api/feed.xml">RSS</a>
        </p>
        <p style="font-size:11px;color:#888;margin-top:24px;">
          You're receiving this because you subscribed at therecord.co.za.
          <a href="${this.webBaseUrl}/api/newsletter/unsubscribe/${unsubscribeToken}">Unsubscribe</a><br/>
          The Record is published by Codist (Pty) Ltd · Johannesburg
        </p>
      </div>`;
  }

  private formatWeekRange(from: Date, to: Date): string {
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    return `${fmt(from)} – ${fmt(to)}`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
