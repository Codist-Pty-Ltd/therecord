import { AdhocCommittee } from '../entities/adhoc_committee.entity';
import { Article } from '../entities/article.entity';
import { Commission } from '../entities/commission.entity';
import { EventLegalReference } from '../entities/event_legal_reference.entity';
import { SiuProclamation } from '../entities/siu_proclamation.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import { AdhocCommitteeType } from './types/adhoc-committee.type';
import { ArticleType } from './types/article.type';
import { CommissionType } from './types/commission.type';
import { EventType } from './types/event.type';
import { LegalReferenceType } from './types/legal-reference.type';
import { PersonType } from './types/person.type';
import { SiuProclamationType } from './types/siu-proclamation.type';

export function mapCommission(c: Commission): CommissionType {
  return {
    id: c.id,
    name: c.popular_name,
    chairName: c.chair_name ?? null,
    establishedYear: c.announced_date?.slice(0, 4) ?? null,
    status: c.status ?? null,
    slug: c.slug ?? null,
  };
}

export function mapPersonRow(row: {
  commissionId: string;
  id: string;
  name: string;
  role: string | null;
}): PersonType {
  return {
    commissionId: row.commissionId,
    id: row.id,
    name: row.name,
    role: row.role,
  };
}

export function mapTimelineEvent(
  e: TimelineEvent,
  commissionId: string,
): EventType {
  return {
    commissionId,
    id: e.id,
    description: e.description,
    dateMentioned: e.event_date ?? null,
    title: e.title ?? null,
    eventType: e.event_type ?? null,
  };
}

export function mapLegalReference(
  ref: EventLegalReference,
  eventId: string,
): LegalReferenceType {
  const lawSection = ref.law_section;
  const law = lawSection?.law;
  const lawSectionLabel =
    lawSection != null
      ? `${law?.short_name ?? law?.name ?? 'Law'} s${lawSection.section_number}`
      : null;

  return {
    eventId,
    id: ref.id,
    relevance: ref.relevance,
    allegedViolation: ref.alleged_violation,
    lawSectionLabel,
    constitutionSectionNumber:
      ref.constitution_section != null
        ? String(ref.constitution_section.section_number)
        : null,
  };
}

export function mapArticle(a: Article, commissionId: string): ArticleType {
  return {
    commissionId,
    id: a.id,
    headline: a.headline,
    sourceName: a.source_name,
    sourceUrl: a.source_url,
    publishedAt: a.published_at.toISOString(),
  };
}

export function mapSiuProclamation(p: SiuProclamation): SiuProclamationType {
  return {
    id: p.id,
    name: p.title,
    proclamationNumber: p.proclamation_number,
    status: p.status ?? null,
    signedDate: p.signed_date ?? null,
    slug: p.slug ?? null,
  };
}

export function mapAdhocCommittee(c: AdhocCommittee): AdhocCommitteeType {
  return {
    id: c.id,
    name: c.popular_name,
    status: c.status ?? null,
    parliamentTerm: c.parliament_term ?? null,
    slug: c.slug ?? null,
  };
}
