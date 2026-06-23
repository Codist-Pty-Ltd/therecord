import { Injectable } from '@nestjs/common';

import type { LegalReferenceResult } from './dto/intelligence.dto';

interface LawEntry {
  act: string;
  short: string;
  act_number: string;
  section: string;
  relevance: string;
  is_constitutional?: boolean;
}

/** Canonical crime → statute mappings (mirrors apps/intelligence/services/legal_mapper.py). */
const CRIME_TO_LAW: Record<string, LawEntry[]> = {
  corruption: [
    {
      act: 'Prevention and Combating of Corrupt Activities Act',
      short: 'PRECCA',
      act_number: '12 of 2004',
      section: '3',
      relevance:
        'General corruption offence — giving or receiving gratification.',
    },
    {
      act: 'Constitution of the Republic of South Africa, 1996',
      short: 'Constitution',
      act_number: '108 of 1996',
      section: '195',
      relevance:
        'Public servants must be accountable and serve the public interest.',
      is_constitutional: true,
    },
  ],
  'tender fraud': [
    {
      act: 'Prevention and Combating of Corrupt Activities Act',
      short: 'PRECCA',
      act_number: '12 of 2004',
      section: '13',
      relevance:
        'Offences in respect of corrupt activities relating to the procuring of tenders.',
    },
    {
      act: 'Public Finance Management Act',
      short: 'PFMA',
      act_number: '1 of 1999',
      section: '86',
      relevance:
        'Financial misconduct and criminal liability of accounting officers over public funds.',
    },
  ],
  murder: [
    {
      act: 'Common Law',
      short: 'Common Law',
      act_number: '',
      section: 'Murder',
      relevance: 'Unlawful and intentional killing of another human being.',
    },
    {
      act: 'Constitution of the Republic of South Africa, 1996',
      short: 'Constitution',
      act_number: '108 of 1996',
      section: '11',
      relevance: 'Everyone has the right to life.',
      is_constitutional: true,
    },
  ],
  'defeating justice': [
    {
      act: 'Common Law',
      short: 'Common Law',
      act_number: '',
      section: 'Defeating or obstructing the course of justice',
      relevance:
        'Unlawful and intentional conduct aimed at defeating or obstructing the administration of justice.',
    },
  ],
};

const ALIASES: Record<string, string> = {
  'obstruction of justice': 'defeating justice',
  'procurement fraud': 'tender fraud',
  bribery: 'corruption',
};

@Injectable()
export class LegalMapperService {
  /** Map alleged crimes to deduplicated SA statute references. */
  mapCrimes(crimes: string[] | null | undefined): LegalReferenceResult[] {
    const references: LegalReferenceResult[] = [];
    const seen = new Set<string>();

    for (const raw of crimes ?? []) {
      const normalised = raw?.trim().toLowerCase() ?? '';
      if (!normalised) continue;

      const canonical = ALIASES[normalised] ?? normalised;
      const matchedKeys: string[] = [];

      if (CRIME_TO_LAW[canonical]) {
        matchedKeys.push(canonical);
      } else {
        for (const key of Object.keys(CRIME_TO_LAW)) {
          if (key.includes(canonical) || canonical.includes(key)) {
            matchedKeys.push(key);
          }
        }
      }

      for (const key of matchedKeys) {
        for (const entry of CRIME_TO_LAW[key] ?? []) {
          const dedupKey = `${entry.short}:${entry.section}`;
          if (seen.has(dedupKey)) continue;
          seen.add(dedupKey);
          references.push({
            act_name: entry.act,
            short_name: entry.short,
            section: entry.section,
            relevance: entry.relevance,
            is_constitutional: entry.is_constitutional ?? false,
            act_number: entry.act_number || null,
          });
        }
      }
    }

    return references;
  }
}
