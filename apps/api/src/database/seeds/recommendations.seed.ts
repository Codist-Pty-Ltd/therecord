/* eslint-disable no-console */

/**
 * Key commission recommendations with implementation tracking (lookup by slug).
 *
 * Run after `reports.seed.ts` (depends on commissions).
 */

import 'reflect-metadata';

import type { EntityManager } from 'typeorm';

import { Commission } from '../../entities/commission.entity';
import {
  Recommendation,
  RecommendationCategory,
  RecommendationImplementationStatus,
} from '../../entities/recommendation.entity';
import { AppDataSource } from '../data-source';

interface RecInput {
  reference_number?: string | null;
  title: string;
  full_text?: string | null;
  plain_english?: string | null;
  plain_english_child?: string | null;
  category: RecommendationCategory;
  directed_at?: string | null;
  persons_named?: string[] | null;
  implementation_status: RecommendationImplementationStatus;
  implementation_notes?: string | null;
  implementation_date?: string | null;
  implementation_source_url?: string | null;
  volume_reference?: string | null;
  is_verified?: boolean;
}

interface Block {
  slug: string;
  recommendations: RecInput[];
}

const SEED: Block[] = [
  {
    slug: 'zondo-commission-state-capture',
    recommendations: [
      {
        reference_number: 'Vol 1 - Rec 1',
        title: 'Prosecute Jacob Zuma for corruption',
        category: RecommendationCategory.PROSECUTION,
        directed_at: 'NPA',
        persons_named: ['Jacob Zuma'],
        implementation_status: RecommendationImplementationStatus.IN_PROGRESS,
        implementation_notes:
          'NPA corruption trial ongoing. Case postponed multiple times. ' +
          'As of 2025 the matter remains before court with no conviction.',
        plain_english:
          'The commission recommended that Jacob Zuma be charged and ' +
          'prosecuted for his role in state capture.',
        plain_english_child:
          'The judges said: Jacob Zuma helped bad people steal ' +
          'from our country. He should go to court for this. The NPA is still trying ' +
          'to make this happen.',
      },
      {
        title: 'Establish a dedicated anti-corruption court',
        category: RecommendationCategory.INSTITUTIONAL,
        directed_at: 'Parliament',
        implementation_status: RecommendationImplementationStatus.NOT_IMPLEMENTED,
        implementation_notes:
          'No dedicated anti-corruption court established as of 2025. ' +
          'Government indicated preference for using existing courts with specialised judges.',
        plain_english:
          'A special court that only handles corruption cases — ' +
          'faster and more specialised than the ordinary High Courts.',
      },
      {
        title: 'Reform state-owned enterprise boards',
        category: RecommendationCategory.INSTITUTIONAL,
        directed_at: 'President',
        implementation_status:
          RecommendationImplementationStatus.PARTIALLY_IMPLEMENTED,
        implementation_notes:
          'New boards appointed at Eskom, Transnet, PRASA, SABC. ' +
          'Governance frameworks updated. But structural reforms to prevent future ' +
          'capture remain incomplete.',
      },
      {
        title: 'Prosecute Gupta associates including Salim Essa',
        category: RecommendationCategory.PROSECUTION,
        directed_at: 'NPA',
        persons_named: ['Salim Essa', 'Rajesh Gupta', 'Atul Gupta', 'Ajay Gupta'],
        implementation_status: RecommendationImplementationStatus.NOT_IMPLEMENTED,
        implementation_notes:
          'Gupta brothers fled to UAE in 2018. ' +
          'SA extradition request submitted. UAE has not extradited as of 2025. ' +
          'Salim Essa remains at large.',
      },
      {
        title: 'Establish Investigating Directorate Against Corruption (IDAC)',
        category: RecommendationCategory.INSTITUTIONAL,
        directed_at: 'President',
        implementation_status: RecommendationImplementationStatus.IMPLEMENTED,
        implementation_date: '2022-04-22',
        implementation_notes:
          'Investigating Directorate (ID) was established in 2019 ' +
          'under NPA. Upgraded to permanent IDAC under the NPA Amendment Act in 2024.',
        implementation_source_url:
          'https://www.gov.za/speeches/president-ramaphosa-signs-npa-amendment-act-22-apr-2022',
      },
    ],
  },
  {
    slug: 'marikana-commission-farlam',
    recommendations: [
      {
        title: 'Prosecute police officers responsible for killing miners',
        category: RecommendationCategory.PROSECUTION,
        directed_at: 'NPA',
        implementation_status: RecommendationImplementationStatus.NOT_IMPLEMENTED,
        implementation_notes:
          'NPA declined to prosecute police officers. ' +
          'The inquest into the deaths was recommenced in 2018. ' +
          'As of 2025, no police officer has been convicted for the Marikana killings.',
        plain_english_child:
          'The commission said the police who shot the miners ' +
          'should go to court. This has not happened.',
      },
      {
        title: 'Compensate families of victims',
        category: RecommendationCategory.COMPENSATION,
        directed_at: 'Government / Lonmin',
        implementation_status:
          RecommendationImplementationStatus.PARTIALLY_IMPLEMENTED,
        implementation_notes:
          'Settlement reached between Lonmin (now Sibanye-Stillwater) ' +
          "and victims' families in 2015. Government has not paid additional compensation.",
      },
    ],
  },
  {
    slug: 'truth-reconciliation-commission-trc',
    recommendations: [
      {
        title: 'Prosecute those denied amnesty who committed gross violations',
        category: RecommendationCategory.PROSECUTION,
        directed_at: 'NPA',
        implementation_status: RecommendationImplementationStatus.NOT_IMPLEMENTED,
        implementation_notes:
          'This is the reason the TRC Prosecutions Inquiry (2025) ' +
          'was established — to investigate why these prosecutions were never pursued ' +
          'in 30 years. The TRC Prosecutions Inquiry is actively investigating this.',
        plain_english_child:
          'People who did terrible things during apartheid ' +
          'and were not forgiven were supposed to be prosecuted. ' +
          '30 years later, almost none of them have been. ' +
          'A new investigation is now asking why.',
      },
      {
        title: 'Pay reparations to apartheid victims',
        category: RecommendationCategory.COMPENSATION,
        directed_at: 'Government',
        implementation_status:
          RecommendationImplementationStatus.PARTIALLY_IMPLEMENTED,
        implementation_notes:
          'A once-off R30,000 payment was made to some victims ' +
          '— far less than the R23,023 per year for 6 years that the TRC recommended. ' +
          'Full reparations were never implemented.',
      },
    ],
  },
  {
    slug: 'nugent-commission-sars',
    recommendations: [
      {
        title: 'Remove SARS Commissioner Tom Moyane',
        category: RecommendationCategory.APPOINTMENT,
        directed_at: 'President',
        persons_named: ['Tom Moyane'],
        implementation_status: RecommendationImplementationStatus.IMPLEMENTED,
        implementation_date: '2018-11-01',
        implementation_notes:
          'Ramaphosa dismissed Moyane on 1 November 2018, ' +
          'the same day he received the interim report.',
      },
      {
        title: 'Re-establish the High Risk Investigations Unit at SARS',
        category: RecommendationCategory.INSTITUTIONAL,
        directed_at: 'SARS',
        implementation_status: RecommendationImplementationStatus.IMPLEMENTED,
        implementation_notes:
          'SARS established a new Illicit Economy Unit and ' +
          'Large Business Centre under Commissioner Kieswetter.',
      },
    ],
  },
];

async function upsertBlock(m: EntityManager, commission: Commission, block: Block): Promise<number> {
  const repo = m.getRepository(Recommendation);
  let n = 0;
  for (const r of block.recommendations) {
    const where = r.reference_number
      ? { commission_id: commission.id, reference_number: r.reference_number }
      : { commission_id: commission.id, title: r.title };
    let existing = await repo.findOne({ where });
    const payload: Partial<Recommendation> = {
      commission_id: commission.id,
      adhoc_committee_id: null,
      reference_number: r.reference_number ?? null,
      title: r.title,
      full_text: r.full_text ?? null,
      plain_english: r.plain_english ?? null,
      plain_english_child: r.plain_english_child ?? null,
      category: r.category,
      directed_at: r.directed_at ?? null,
      persons_named: r.persons_named ?? null,
      implementation_status: r.implementation_status,
      implementation_notes: r.implementation_notes ?? null,
      implementation_date: r.implementation_date ?? null,
      implementation_source_url: r.implementation_source_url ?? null,
      volume_reference: r.volume_reference ?? null,
      is_verified: r.is_verified ?? false,
    };
    if (!existing) {
      await repo.save(repo.create(payload));
    } else {
      Object.assign(existing, payload);
      await repo.save(existing);
    }
    n++;
  }
  return n;
}

export async function run(): Promise<void> {
  const dataSource = AppDataSource.isInitialized
    ? AppDataSource
    : await AppDataSource.initialize();

  console.log('\n── Seeding: recommendations ──');

  try {
    await dataSource.transaction(async (m) => {
      const commissionRepo = m.getRepository(Commission);
      let total = 0;
      for (const block of SEED) {
        const commission = await commissionRepo.findOne({ where: { slug: block.slug } });
        if (!commission) {
          console.warn(`  ⚠ Unknown commission slug: "${block.slug}"`);
          continue;
        }
        const n = await upsertBlock(m, commission, block);
        console.log(`  · ${block.slug}: ${n} recommendation(s)`);
        total += n;
      }
      console.log(`  · Total rows touched: ${total}`);
    });
    console.log('─────────────────────────────────');
    console.log('✓ Recommendations seed complete.\n');
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

if (require.main === module) {
  run().catch((err: unknown) => {
    console.error('\n✗ Recommendations seed failed:', err);
    process.exit(1);
  });
}
