/* eslint-disable no-console */

/**
 * Human impact reference sectors (8 rows) + story/commission impact links.
 * Idempotent upserts. Requires migrations `AddHumanImpactLayer` and prior seeds:
 * commissions-master (Zondo, Marikana), mkhwanazi, cape-town-stories.
 *
 * Run (after `nest build`):
 *   npm run seed:impact-sectors
 *   or via `npm run seed:all`
 */

import 'reflect-metadata';

import type { EntityManager } from 'typeorm';

import { Commission } from '../../entities/commission.entity';
import { CommissionImpactSector } from '../../entities/commission-impact-sector.entity';
import { ImpactSector } from '../../entities/impact-sector.entity';
import { PublicExpenditureRecord } from '../../entities/public-expenditure-record.entity';
import { Story } from '../../entities/story.entity';
import { StoryImpactSector, ImpactSeverity } from '../../entities/story-impact-sector.entity';
import { AppDataSource } from '../data-source';

const ZONDO_SLUG = 'zondo-commission-state-capture';
const MARIKANA_SLUG = 'marikana-commission-farlam';

type SectorSeed = {
  slug: string;
  name: string;
  icon: string | null;
  constitutional_right: string | null;
  what_was_promised: string;
  ground_reality: string;
  plain_english_child: string;
  stat_headline: string | null;
  stat_value: string | null;
  stat_label: string | null;
  stat_source: string | null;
  stat_year: string | null;
};

const SECTOR_SEEDS: SectorSeed[] = [
  {
    slug: 'housing',
    name: 'Housing',
    icon: '🏠',
    constitutional_right:
      'Section 26 — Everyone has the right to have access to adequate housing',
    what_was_promised:
      'The Constitution and the RDP programme promised every South African a decent home. Government set targets of 200,000 housing units per year. Since 1994, over 3.3 million housing units have been built. The promise was explicit: end the housing backlog by 2030.',
    ground_reality:
      'The national RDP housing backlog stands at 2.4 million units as of 2025. Delivery collapsed from 75,000 units per year in 2019 to just 25,000 in 2023 — a 67% drop in delivery speed. 3.3 million households are on the national waiting list. In Gauteng alone, the backlog exceeds 400,000 units. One domestic worker applied in June 1993 and was still waiting in 2024 — 31 years later. A title deed backlog of over 1 million houses means people who received RDP houses cannot legally sell or borrow against them.',
    plain_english_child:
      'The government promised everyone a safe home to live in. They built lots of houses — but not enough. Millions of families are still waiting for their house. Some people have been waiting for 30 years. Meanwhile, some of the money meant for building houses was stolen.',
    stat_headline: '2.4 million families still waiting for government housing as of 2025',
    stat_value: '2.4M',
    stat_label: 'Units in backlog',
    stat_source: 'Status Check / Department of Human Settlements 2025',
    stat_year: '2025',
  },
  {
    slug: 'water',
    name: 'Water & Sanitation',
    icon: '💧',
    constitutional_right: 'Section 27 — Everyone has the right to have access to sufficient water',
    what_was_promised:
      'Government committed to providing all households with clean, reliable piped water and proper sanitation. The Reconstruction and Development Programme set specific targets for water delivery to all communities by 2000.',
    ground_reality:
      'R18.9 billion in water was lost in 2023/24 — not from drought, but from corruption, broken infrastructure left unfixed, non-revenue water, and officials paying for tankers that never arrived. Only 36.7% of rural South Africans have access to safely managed water versus 71.8% of urban residents. Nearly 160,000 households still use bucket toilets. Water access actually DECLINED in six provinces between 2002 and 2022. 8.5 million people have no access to basic water services at all. More than half of all municipalities fail the basic 30% water loss threshold.',
    plain_english_child:
      'Clean water from a tap is something the government promised everyone. But 8.5 million South Africans still have to walk to get water — and that water is often not clean. Almost R19 billion worth of water was wasted or stolen in one year.',
    stat_headline:
      'R18.9 billion in water lost in 2023/24 — 8.5 million without basic water access',
    stat_value: 'R19bn',
    stat_label: 'Lost annually',
    stat_source: 'Auditor-General / Corruption Watch 2025',
    stat_year: '2023/24',
  },
  {
    slug: 'health',
    name: 'Healthcare',
    icon: '🏥',
    constitutional_right:
      'Section 27 — Everyone has the right to have access to healthcare services',
    what_was_promised:
      'A universal public health system serving all South Africans equally, funded by the state. The NHI was promised as the long-term solution to healthcare inequality.',
    ground_reality:
      'Approximately 84% of South Africans depend on the public health system — they cannot afford private care. The system is chronically underfunded, understaffed, and has been targeted by corruption. The PPE scandal (R14.2bn under investigation) saw COVID protective equipment stolen during a pandemic. The Digital Vibes scandal diverted R150 million from health communications. Eskom corruption-caused load-shedding regularly cuts power to hospitals and clinics. The health workforce shortage means patients wait 8+ hours at public clinics.',
    plain_english_child:
      'Most South Africans cannot afford to pay a private doctor. They go to government clinics. But the clinics run out of medicine, have broken equipment, and sometimes no electricity. During COVID, the masks and gloves meant for nurses were stolen by people who wanted to make money.',
    stat_headline: '84% of South Africans depend on the public health system',
    stat_value: '84%',
    stat_label: 'Use public health',
    stat_source: 'Stats SA GHS 2024',
    stat_year: '2024',
  },
  {
    slug: 'education',
    name: 'Education',
    icon: '📚',
    constitutional_right: 'Section 29 — Everyone has the right to a basic education',
    what_was_promised:
      'Quality education for every child regardless of where they live or how much their parents earn. Safe, equipped schools. Qualified teachers. Textbooks delivered on time.',
    ground_reality:
      'Of students in Grade 10 in 2023, only 49% made it to matric in 2025. R114 million in school maintenance money in Mpumalanga was allegedly stolen, leaving 21 rural schools with broken toilets, leaking roofs and no electricity. PRASA corruption broke the rail system — children who depend on trains cannot reach school. Schools in areas with load-shedding cannot use computers. Teachers are demoralised in decaying buildings. Learners from poor families cannot study at night without electricity.',
    plain_english_child:
      'The government says every child has the right to go to school. But schools in poor areas are falling apart. Some have no toilets that work, no lights, and leaking roofs. Money that was meant to fix these schools was stolen. If you cannot study at home because there is no electricity, and the trains are broken so you cannot get to school, and the school is falling apart — how do you build a future?',
    stat_headline: 'Only 49% of Grade 10 students in 2023 made it to matric in 2025',
    stat_value: '49%',
    stat_label: 'Reach matric',
    stat_source: 'Africa Check / Stats SA 2026',
    stat_year: '2025',
  },
  {
    slug: 'jobs',
    name: 'Employment & Economy',
    icon: '💼',
    constitutional_right:
      'Section 22 — Every citizen has the right to choose their trade, occupation or profession freely',
    what_was_promised:
      'A growing economy, infrastructure investment, and a functioning state that enables job creation. GEAR, the NDP, and successive budgets promised employment growth and poverty reduction.',
    ground_reality:
      'The expanded unemployment rate is 42.4% as of Q3 2025. Black South Africans face 35.8% unemployment versus 8.1% for white South Africans. GDP grew only 0.6% in 2024. 23.2 million people live below the lower-bound poverty line of R1,300 per person per month. Nearly 11 million survive on less than R777 per month. Eskom state capture caused load-shedding estimated to have cost the economy over R600 billion in lost output. PRASA corruption broke the rail network that working-class commuters depended on. The construction mafia in Cape Town intimidates legitimate contractors into leaving projects.',
    plain_english_child:
      'A job is how a family earns money to buy food, pay rent, and send children to school. When the electricity goes out because it was stolen from Eskom, businesses close and people lose jobs. When the trains break because PRASA money was stolen, workers cannot afford taxis to get to work. The stolen money does not just disappear — it takes jobs with it.',
    stat_headline: '42.4% expanded unemployment — 11 million on less than R777/month',
    stat_value: '42.4%',
    stat_label: 'Expanded unemployment',
    stat_source: 'Stats SA Q3 2025',
    stat_year: '2025',
  },
  {
    slug: 'safety',
    name: 'Safety & Justice',
    icon: '⚖️',
    constitutional_right:
      'Section 12 — Everyone has the right to freedom and security of the person',
    what_was_promised:
      'A professional, independent police service (Section 205 of the Constitution) and a National Prosecuting Authority that acts without fear or favour (Section 179). The Scorpions demonstrated that a 93% conviction rate was achievable.',
    ground_reality:
      'South Africa has one of the highest murder rates in the world. The Scorpions were disbanded at the moment they were closing in on powerful politicians — and the conviction rate collapsed from 93% to approximately 50%. The Madlanga Commission exposed alleged cartel infiltration of police and Crime Intelligence. In Cape Town, a city official was murdered for refusing to yield to gang demands on housing contracts. Communities in townships — already the most vulnerable — receive the worst policing and the least justice system protection.',
    plain_english_child:
      'The police are supposed to protect everyone equally. The courts are supposed to punish people who do wrong. But when the best crime-catching unit (the Scorpions) was shut down by the people they were catching, and when police bosses are accused of helping criminal gangs, ordinary people in dangerous neighbourhoods are left without protection.',
    stat_headline: "South Africa has one of the world's highest murder rates",
    stat_value: '72/100k',
    stat_label: 'Murder rate',
    stat_source: 'SAPS Crime Statistics 2023/24',
    stat_year: '2023/24',
  },
  {
    slug: 'food',
    name: 'Food Security',
    icon: '🍽️',
    constitutional_right: 'Section 27 — Everyone has the right to have access to sufficient food',
    what_was_promised:
      'Social grants were designed to ensure no South African goes hungry. The Child Support Grant, Old Age Grant, and Disability Grant form the basic social safety net that prevents starvation.',
    ground_reality:
      'SASSA fraud (R260 million stolen in Gauteng alone in 2025) means money meant for hungry families was diverted. The CPS/Net1 irregular contract (investigated by SIU) endangered grant payment infrastructure for 18 million grant recipients. Load-shedding destroys food in refrigerators for poor households. The water crisis means communities cannot maintain food gardens. Stats SA found that food insecurity disproportionately affects children and women in rural provinces.',
    plain_english_child:
      'Millions of South African families depend on government grants to buy food. When officials steal from the grants system — like the SASSA fraud in Gauteng — families go hungry. When load-shedding caused by Eskom corruption means the food in the fridge goes bad, a poor family cannot afford to replace it.',
    stat_headline:
      '18 million South Africans receive social grants — the system was targeted by fraud',
    stat_value: '18M',
    stat_label: 'Grant recipients',
    stat_source: 'SASSA 2024',
    stat_year: '2024',
  },
  {
    slug: 'transport',
    name: 'Transport & Infrastructure',
    icon: '🚆',
    constitutional_right:
      'Implied in Section 9 (equal dignity) — mobility enables access to all other rights: work, health, education',
    what_was_promised:
      'PRASA was funded to run a passenger rail network serving millions of commuters, particularly working-class South Africans who cannot afford cars or expensive taxis. Metrorail was the backbone of working-class mobility.',
    ground_reality:
      "PRASA corruption under CEO Lucky Montana saw billions stolen on broken procurement — including locomotives too tall for South African rail lines. By 2022, over 80% of PRASA's rolling stock was out of service. Metrorail trains stopped running in many cities. Working-class commuters were forced onto minibus taxis costing 3-4x more than train fare. PRASA's R4.3bn in losses (SIU Proclamation R25/2015) represents the destruction of the train system. The OECD noted that the rail and port bottlenecks have \"weighed on activity, investment, exports and living standards.\"",
    plain_english_child:
      'Trains were the cheapest way for working people to get to work. Corruption in PRASA — the company that runs trains — meant the money was stolen instead of maintaining the trains. By 2022, most trains had stopped working. Workers who used to pay R20 for a train now pay R60-100 for a taxi — money they do not have.',
    stat_headline: 'Over 80% of PRASA rolling stock was out of service by 2022',
    stat_value: '80%+',
    stat_label: 'PRASA trains broken',
    stat_source: 'PRASA Annual Report / SIU findings 2022',
    stat_year: '2022',
  },
];

async function upsertSectors(m: EntityManager): Promise<Map<string, ImpactSector>> {
  const repo = m.getRepository(ImpactSector);
  const bySlug = new Map<string, ImpactSector>();

  for (const seed of SECTOR_SEEDS) {
    let row = await repo.findOne({ where: { slug: seed.slug } });
    const payload = {
      slug: seed.slug,
      name: seed.name,
      icon: seed.icon,
      constitutional_right: seed.constitutional_right,
      what_was_promised: seed.what_was_promised,
      ground_reality: seed.ground_reality,
      plain_english_child: seed.plain_english_child,
      stat_headline: seed.stat_headline,
      stat_value: seed.stat_value,
      stat_label: seed.stat_label,
      stat_source: seed.stat_source,
      stat_year: seed.stat_year,
    };
    if (!row) {
      row = repo.create(payload);
    } else {
      Object.assign(row, payload);
    }
    row = await repo.save(row);
    bySlug.set(seed.slug, row);
    console.log(`  · Upserted impact sector: ${row.name} (${row.slug})`);
  }

  return bySlug;
}

async function upsertStoryImpact(
  m: EntityManager,
  storyId: string,
  sectorId: string,
  spec: {
    impact_chain: string[];
    impact_severity: ImpactSeverity;
    amount_diverted_rands?: string | null;
    people_affected_estimate?: string | null;
    plain_english_impact?: string | null;
  },
): Promise<void> {
  const repo = m.getRepository(StoryImpactSector);
  let row = await repo.findOne({ where: { story_id: storyId, sector_id: sectorId } });
  const payload = {
    story_id: storyId,
    sector_id: sectorId,
    impact_chain: spec.impact_chain,
    impact_severity: spec.impact_severity,
    amount_diverted_rands: spec.amount_diverted_rands ?? null,
    people_affected_estimate: spec.people_affected_estimate ?? null,
    plain_english_impact: spec.plain_english_impact ?? null,
  };
  if (!row) {
    row = repo.create(payload);
  } else {
    Object.assign(row, payload);
  }
  await repo.save(row);
}

async function upsertCommissionImpact(
  m: EntityManager,
  commissionId: string,
  sectorId: string,
  impact_summary: string,
): Promise<void> {
  const repo = m.getRepository(CommissionImpactSector);
  let row = await repo.findOne({ where: { commission_id: commissionId, sector_id: sectorId } });
  const payload = { commission_id: commissionId, sector_id: sectorId, impact_summary };
  if (!row) {
    row = repo.create(payload);
  } else {
    Object.assign(row, payload);
  }
  await repo.save(row);
}

async function setStoryPrimarySector(m: EntityManager, storyId: string, sectorId: string | null) {
  await m.getRepository(Story).update({ id: storyId }, { primary_impact_sector_id: sectorId });
}

/** Match expenditure row by story slug + exact amount (string bigint). */
async function patchExpenditureWhatFunded(
  m: EntityManager,
  storySlug: string,
  amountRands: string,
  text: string,
): Promise<void> {
  const story = await m.getRepository(Story).findOne({ where: { slug: storySlug } });
  if (!story) {
    console.warn(`  ⚠ Story not found for expenditure patch: ${storySlug}`);
    return;
  }
  const expRepo = m.getRepository(PublicExpenditureRecord);
  const row = await expRepo.findOne({
    where: { story_id: story.id, amount_rands: amountRands },
  });
  if (!row) {
    console.warn(
      `  ⚠ Expenditure row not found: story ${storySlug} amount_rands=${amountRands}`,
    );
    return;
  }
  row.what_it_should_have_funded = text;
  await expRepo.save(row);
  console.log(`  · Patched what_it_should_have_funded on expenditure ${row.id}`);
}

export async function run(): Promise<void> {
  const dataSource = AppDataSource.isInitialized
    ? AppDataSource
    : await AppDataSource.initialize();

  console.log('\n── Seeding: Impact sectors + human-impact story/commission links ──');

  try {
    await dataSource.transaction(async (m) => {
      const sectors = await upsertSectors(m);
      const sid = (slug: string): string => {
        const s = sectors.get(slug);
        if (!s) throw new Error(`Missing sector slug: ${slug}`);
        return s.id;
      };

      const storyRepo = m.getRepository(Story);

      /* ─── Story: Mkhwanazi ─── */
      let st = await storyRepo.findOne({ where: { slug: 'mkhwanazi-madlanga-commission' } });
      if (st) {
        await setStoryPrimarySector(m, st.id, sid('safety'));
        await upsertStoryImpact(m, st.id, sid('safety'), {
          impact_severity: ImpactSeverity.CRITICAL,
          impact_chain: [
            'Police allegedly compromised by cartel networks',
            'Crime Intelligence boss testifies about "Big Five" gang',
            'Police Minister accused of interfering in investigations',
            'Communities in crime hotspots left without accountable policing',
            'The corruption the Scorpions might have caught was never prosecuted',
          ],
        });
        await upsertStoryImpact(m, st.id, sid('jobs'), {
          impact_severity: ImpactSeverity.MEDIUM,
          impact_chain: [
            'Construction cartel allegedly embedded in Cape Town tenders',
            'Legitimate contractors intimidated off projects',
            'Projects stall → jobs lost → tax base shrinks',
          ],
        });
        console.log('  · Linked mkhwanazi-madlanga-commission → safety (primary), jobs');
      } else {
        console.warn('  ⚠ Story missing: mkhwanazi-madlanga-commission — run mkhwanazi seed first');
      }

      /* ─── Story: Malusi Booi ─── */
      st = await storyRepo.findOne({ where: { slug: 'malusi-booi-housing-tender-fraud-2023' } });
      if (st) {
        await setStoryPrimarySector(m, st.id, sid('housing'));
        await upsertStoryImpact(m, st.id, sid('housing'), {
          impact_severity: ImpactSeverity.CRITICAL,
          impact_chain: [
            'R1bn in housing tenders allegedly diverted from real purpose',
            'Houses not built for families who needed them',
            'Families remain in informal settlements without services',
            'At R250,000 per RDP unit — 4,000 families could have been housed',
            'A city official who refused to yield to gang demands was murdered',
          ],
        });
        await upsertStoryImpact(m, st.id, sid('safety'), {
          impact_severity: ImpactSeverity.HIGH,
          impact_chain: [
            'Gang networks used housing contracts as criminal enterprise',
            'Murder of Wendy Kloppers demonstrated lethal enforcement of corruption',
            'Gang infiltration of government procurement normalised',
          ],
        });
        await patchExpenditureWhatFunded(
          m,
          'malusi-booi-housing-tender-fraud-2023',
          '1024000000',
          "At the government's average cost of R250,000 per RDP unit, R1 billion could have housed approximately 4,000 families — roughly the population of a small town.",
        );
        console.log('  · Linked malusi-booi-housing-tender-fraud-2023');
      } else {
        console.warn('  ⚠ Story missing: malusi-booi-housing-tender-fraud-2023');
      }

      /* ─── Story: Cape Town R1.6bn ─── */
      st = await storyRepo.findOne({ where: { slug: 'cape-town-r1-6bn-tender-fraud-2025' } });
      if (st) {
        await setStoryPrimarySector(m, st.id, sid('transport'));
        await upsertStoryImpact(m, st.id, sid('transport'), {
          impact_severity: ImpactSeverity.HIGH,
          impact_chain: [
            'Road construction tenders allegedly inflated or fraudulently awarded',
            'Roads not built or built to poor standard',
            'Transport infrastructure deteriorates',
            'Working-class commuters bear the cost of worse roads',
          ],
        });
        await upsertStoryImpact(m, st.id, sid('housing'), {
          impact_severity: ImpactSeverity.MEDIUM,
          impact_chain: [
            'Urban mobility directorate contracts corrupt → broader city delivery affected',
          ],
        });
        await patchExpenditureWhatFunded(
          m,
          'cape-town-r1-6bn-tender-fraud-2025',
          '1600000000',
          'R1.6 billion in road and urban mobility contracts — at typical cost of R2-5 million per km of urban road, this represents 320-800km of city roads that may have been fraudulently contracted.',
        );
        console.log('  · Linked cape-town-r1-6bn-tender-fraud-2025');
      } else {
        console.warn('  ⚠ Story missing: cape-town-r1-6bn-tender-fraud-2025');
      }

      /* ─── Story: Mpumalanga schools ─── */
      st = await storyRepo.findOne({ where: { slug: 'mpumalanga-school-tender-fraud-2026' } });
      if (st) {
        await setStoryPrimarySector(m, st.id, sid('education'));
        await upsertStoryImpact(m, st.id, sid('education'), {
          impact_severity: ImpactSeverity.CRITICAL,
          impact_chain: [
            'R114m in school maintenance money allegedly stolen',
            '21 rural schools left with broken infrastructure',
            'Leaking roofs, broken toilets, no electricity in classrooms',
            'Children cannot study in unsafe, uncomfortable environments',
            'Teacher retention in poor rural schools drops further',
            'Grade 10 → Matric completion rate already only 49% nationally',
          ],
        });
        await patchExpenditureWhatFunded(
          m,
          'mpumalanga-school-tender-fraud-2026',
          '114000000',
          "R114 million in school maintenance could have properly repaired and maintained all 21 schools for multiple years — new roofs, working toilets, solar panels, and safe classrooms for thousands of children in Mpumalanga's rural communities.",
        );
        console.log('  · Linked mpumalanga-school-tender-fraud-2026');
      } else {
        console.warn('  ⚠ Story missing: mpumalanga-school-tender-fraud-2026');
      }

      /* ─── Story: Water R19bn ─── */
      st = await storyRepo.findOne({ where: { slug: 'water-sector-r19bn-losses-2023-24' } });
      if (st) {
        await setStoryPrimarySector(m, st.id, sid('water'));
        await upsertStoryImpact(m, st.id, sid('water'), {
          impact_severity: ImpactSeverity.CRITICAL,
          impact_chain: [
            'Municipal irregularities, fraud and weak controls divert water revenue and capex',
            'Pipes and treatment works are not maintained → surging non-revenue water and outages',
            'Rural and township households lose reliable piped supply or receive unsafe water',
            'Emergency tanker and project spend balloons while root causes stay unfixed',
            'Schools and clinics cannot maintain hygiene — preventable disease pressure rises',
            'Household food gardens and small livelihoods fail when taps run dry',
            'Water insecurity deters investment and shifts cost onto the poorest commuters and employers',
          ],
        });
        await upsertStoryImpact(m, st.id, sid('health'), {
          impact_severity: ImpactSeverity.HIGH,
          impact_chain: [
            'Contaminated water from broken infrastructure causes disease',
            'Clinic water supply unreliable → hygiene impossible',
            'Waterborne disease outbreaks in municipalities (cholera, typhoid)',
            'Healthcare system bears cost of preventable illness',
          ],
        });
        await upsertStoryImpact(m, st.id, sid('food'), {
          impact_severity: ImpactSeverity.HIGH,
          impact_chain: [
            'No water → cannot maintain food gardens',
            'Contaminated water destroys subsistence crops',
            'Women and girls who collect water cannot work or study',
          ],
        });
        await upsertStoryImpact(m, st.id, sid('jobs'), {
          impact_severity: ImpactSeverity.MEDIUM,
          impact_chain: [
            'Industries that need water (agriculture, manufacturing) suffer',
            'Business investment deterred by unreliable water supply',
          ],
        });
        await patchExpenditureWhatFunded(
          m,
          'water-sector-r19bn-losses-2023-24',
          '18900000000',
          'R19 billion is roughly the entire annual water and sanitation budget of 9 provinces combined. At R50,000 per household water connection, it could have connected 380,000 rural households to clean piped water — serving approximately 1.9 million people.',
        );
        console.log('  · Linked water-sector-r19bn-losses-2023-24');
      } else {
        console.warn('  ⚠ Story missing: water-sector-r19bn-losses-2023-24');
      }

      /* ─── Story: SASSA Gauteng ─── */
      st = await storyRepo.findOne({ where: { slug: 'gauteng-sassa-r260m-fraud-2025' } });
      if (st) {
        await setStoryPrimarySector(m, st.id, sid('food'));
        await upsertStoryImpact(m, st.id, sid('food'), {
          impact_severity: ImpactSeverity.CRITICAL,
          impact_chain: [
            'R260m diverted from social grants system',
            'Fake beneficiaries registered, real recipients funds at risk',
            'SASSA system integrity compromised',
            'Families dependent on Child Support Grant face disruption',
            'Children go hungry when grants are delayed or stolen',
          ],
        });
        await upsertStoryImpact(m, st.id, sid('health'), {
          impact_severity: ImpactSeverity.MEDIUM,
          impact_chain: [
            'Disability grant recipients — already the most vulnerable — targeted',
            'Financial stress from grant insecurity worsens mental health',
          ],
        });
        await patchExpenditureWhatFunded(
          m,
          'gauteng-sassa-r260m-fraud-2025',
          '260000000',
          'R260 million would fund the Child Support Grant (currently R530/month) for approximately 40,900 children for a full year — or the Old Age Grant (R2,200/month) for almost 10,000 pensioners for 12 months.',
        );
        console.log('  · Linked gauteng-sassa-r260m-fraud-2025');
      } else {
        console.warn('  ⚠ Story missing: gauteng-sassa-r260m-fraud-2025');
      }

      /* ─── Commissions: Zondo ─── */
      const zondo = await m.getRepository(Commission).findOne({ where: { slug: ZONDO_SLUG } });
      if (zondo) {
        const zondoLinks: Array<[string, string]> = [
          ['housing', 'State capture diverted billions from PRASA, Eskom, and housing SOEs'],
          ['water', 'Municipal capture led to billions in water infrastructure losses'],
          ['health', 'PPE scandal grew from state capture networks'],
          ['education', 'Education procurement corrupted at national and provincial level'],
          ['jobs', 'Eskom state capture caused load-shedding costing R600bn in economic output'],
          ['safety', 'Crime Intelligence and NPA allegedly compromised by state capture networks'],
          ['food', 'SASSA grant system targeted within broader state capture ecosystem'],
          ['transport', 'PRASA and Transnet both subject to state capture — train system destroyed'],
        ];
        for (const [slug, summary] of zondoLinks) {
          await upsertCommissionImpact(m, zondo.id, sid(slug), summary);
        }
        console.log('  · Linked Zondo Commission → 8 impact sectors');
      } else {
        console.warn(`  ⚠ Commission missing: ${ZONDO_SLUG}`);
      }

      /* ─── Commissions: Marikana ─── */
      const marikana = await m
        .getRepository(Commission)
        .findOne({ where: { slug: MARIKANA_SLUG } });
      if (marikana) {
        await upsertCommissionImpact(
          m,
          marikana.id,
          sid('safety'),
          'Police killed 34 miners — no senior officers prosecuted',
        );
        await upsertCommissionImpact(
          m,
          marikana.id,
          sid('jobs'),
          'Mining sector workers bear risk of life when protesting for living wage',
        );
        console.log('  · Linked Marikana Commission → safety, jobs');
      } else {
        console.warn(`  ⚠ Commission missing: ${MARIKANA_SLUG}`);
      }
    });

    console.log('✓ Impact sectors seed complete.\n');
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  run().catch((err: unknown) => {
    console.error('\n✗ Impact sectors seed failed:', err);
    process.exit(1);
  });
}
