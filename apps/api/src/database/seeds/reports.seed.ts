/* eslint-disable no-console */

/**
 * Seeds official report / PDF metadata for commissions where public URLs exist.
 * Looks up {@link Commission} by `slug` — never hard-codes commission UUIDs.
 *
 * Run after `commissions-master.seed.ts` (dependency: commissions rows).
 *
 *   npm run seed:reports
 */

import 'reflect-metadata';

import type { EntityManager } from 'typeorm';

import { Commission } from '../../entities/commission.entity';
import {
  CommissionReport,
  CommissionReportType,
} from '../../entities/commission-report.entity';
import { AppDataSource } from '../data-source';

interface ReportUpsertInput {
  volume_number?: number | null;
  volume_title?: string | null;
  report_type: CommissionReportType;
  title: string;
  published_date?: string | null;
  page_count?: number | null;
  file_size_mb?: string | null;
  source_url: string;
  mirror_url?: string | null;
  is_verified?: boolean;
  language?: string;
  summary?: string | null;
  key_findings?: string[] | null;
}

interface CommissionReportsSeed {
  slug: string;
  reports: ReportUpsertInput[];
}

const REPORTS_SEED: CommissionReportsSeed[] = [
  {
    slug: 'truth-reconciliation-commission-trc',
    reports: [1, 2, 3, 4, 5].map((n) => ({
      report_type: CommissionReportType.FINAL_REPORT,
      volume_number: n,
      title: `Truth and Reconciliation Commission Final Report — Volume ${n}`,
      source_url: `https://www.justice.gov.za/trc/report/finalreport/Volume${n}.pdf`,
      language: 'en',
    })),
  },
  {
    slug: 'marikana-commission-farlam',
    reports: [
      {
        report_type: CommissionReportType.FINAL_REPORT,
        title: 'Marikana Commission of Inquiry Report',
        published_date: '2015-06-25',
        source_url:
          'https://www.justice.gov.za/commissions/Marikana/Marikana.htm',
        language: 'en',
      },
    ],
  },
  {
    slug: 'zondo-commission-state-capture',
    reports: [
      {
        report_type: CommissionReportType.FINAL_REPORT,
        volume_number: 1,
        title: 'State Capture Report Volume 1',
        published_date: '2022-01-04',
        source_url:
          'https://www.statecapture.org.za/site/files/notice/515/state_capture_report_vol1.pdf',
        language: 'en',
      },
      ...(
        [
          [2, '2022-02-01'] as const,
          [3, '2022-04-29'] as const,
          [4, '2022-05-19'] as const,
          [5, '2022-06-10'] as const,
        ] as const
      ).map(([n, published_date]) => ({
        report_type: CommissionReportType.FINAL_REPORT,
        volume_number: n,
        title: `State Capture Report Volume ${n}`,
        published_date,
        source_url: `https://www.statecapture.org.za/site/files/notice/515/state_capture_report_vol${n}.pdf`,
        language: 'en',
      })),
      {
        report_type: CommissionReportType.FINAL_REPORT,
        volume_number: 6,
        title: 'State Capture Report Volume 6 (Final)',
        published_date: '2022-06-22',
        source_url:
          'https://www.statecapture.org.za/site/files/notice/515/state_capture_report_vol6.pdf',
        language: 'en',
      },
    ],
  },
  {
    slug: 'nugent-commission-sars',
    reports: [
      {
        report_type: CommissionReportType.FINAL_REPORT,
        title: 'Nugent Commission of Inquiry into SARS — Final Report',
        published_date: '2018-12-14',
        source_url:
          'https://www.gov.za/sites/default/files/gcis_document/201902/nugent-commission-report.pdf',
        language: 'en',
      },
    ],
  },
  {
    slug: 'khayelitsha-commission',
    reports: [
      {
        report_type: CommissionReportType.FINAL_REPORT,
        title: 'Khayelitsha Commission of Inquiry — Final Report',
        published_date: '2014-08-25',
        source_url:
          'https://www.westerncape.gov.za/assets/departments/community-safety/finalreport.pdf',
        language: 'en',
      },
    ],
  },
  {
    slug: 'fees-commission-heher',
    reports: [
      {
        report_type: CommissionReportType.FINAL_REPORT,
        title: 'Heher Commission — Report of the Commission of Inquiry into Higher Education',
        published_date: '2017-08-31',
        source_url:
          'https://www.gov.za/sites/default/files/gcis_document/201710/hehercommissionreport.pdf',
        language: 'en',
      },
    ],
  },
  {
    slug: 'pic-commission-mpati',
    reports: [
      {
        report_type: CommissionReportType.FINAL_REPORT,
        title: 'Mpati Commission — Final Report into the Public Investment Corporation',
        published_date: '2019-11-28',
        source_url:
          'https://www.gov.za/sites/default/files/gcis_document/201911/pic-report.pdf',
        language: 'en',
      },
    ],
  },
];

async function upsertReportsForCommission(
  m: EntityManager,
  commission: Commission,
  reports: ReportUpsertInput[],
): Promise<number> {
  const repo = m.getRepository(CommissionReport);
  let count = 0;

  for (const r of reports) {
    const existing = await repo.findOne({
      where: {
        commission_id: commission.id,
        source_url: r.source_url,
      },
    });

    const payload: Partial<CommissionReport> = {
      commission_id: commission.id,
      adhoc_committee_id: null,
      siu_proclamation_id: null,
      volume_number: r.volume_number ?? null,
      volume_title: r.volume_title ?? null,
      report_type: r.report_type,
      title: r.title,
      published_date: r.published_date ?? null,
      page_count: r.page_count ?? null,
      file_size_mb: r.file_size_mb ?? null,
      source_url: r.source_url,
      mirror_url: r.mirror_url ?? null,
      is_verified: r.is_verified ?? false,
      language: r.language ?? 'en',
      summary: r.summary ?? null,
      key_findings: r.key_findings ?? null,
    };

    if (!existing) {
      await repo.save(repo.create(payload));
    } else {
      Object.assign(existing, payload);
      await repo.save(existing);
    }
    count++;
  }

  return count;
}

export async function run(): Promise<void> {
  const dataSource = AppDataSource.isInitialized
    ? AppDataSource
    : await AppDataSource.initialize();

  console.log('\n── Seeding: commission reports ──');

  try {
    await dataSource.transaction(async (m) => {
      const commissionRepo = m.getRepository(Commission);
      let total = 0;

      for (const block of REPORTS_SEED) {
        const commission = await commissionRepo.findOne({
          where: { slug: block.slug },
        });
        if (!commission) {
          console.warn(
            `  ⚠ Skipping reports for unknown commission slug: "${block.slug}"`,
          );
          continue;
        }
        const n = await upsertReportsForCommission(
          m,
          commission,
          block.reports,
        );
        console.log(`  · ${block.slug}: ${n} report(s)`);
        total += n;
      }

      console.log(`  · Total report rows touched: ${total}`);
    });

    console.log('─────────────────────────────────');
    console.log('✓ Commission reports seed complete.\n');
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  run().catch((err: unknown) => {
    console.error('\n✗ Commission reports seed failed:', err);
    process.exit(1);
  });
}
