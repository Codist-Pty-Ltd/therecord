/* eslint-disable no-console */

/**
 * Main seed runner.
 *
 * Runs every seed in the correct dependency order inside a single process
 * so that every DataSource lifecycle (init → use → destroy) is explicit.
 *
 * Order matters:
 *   1. commissions-master.seed.ts
 *      Seeds all historical commissions + their enabling laws + the cross-
 *      commission people (presidents, repeat chairs, repeat subjects).
 *
 *   1b. reports.seed.ts
 *      Official report / PDF metadata for commissions with known public URLs.
 *      Depends on commissions-master (lookup by slug).
 *
 *   1c. recommendations.seed.ts
 *      Key recommendations + implementation status (commission slug lookup).
 *      Runs after reports.seed.ts.
 *
 *   2. adhoc-committees.seed.ts
 *      Seeds all National Assembly Ad Hoc Committees + their people and
 *      enabling / investigated / being-processed / amended law sections.
 *      Runs BEFORE mkhwanazi so the Mkhwanazi story can link to its
 *      committee at creation time. The Madlanga ↔ Mkhwanazi-committee
 *      back-link is left null here and patched by mkhwanazi.seed.ts
 *      below (Madlanga is owned there), so the chain converges regardless
 *      of which seed runs first on subsequent runs.
 *
 *   3. siu.seed.ts
 *      Seeds the Special Investigating Unit corpus: the SIU body and
 *      Special Tribunal singletons, nine major Presidential Proclamations
 *      (PPE, VBS, Transnet, SASSA, Eskom, PRASA, Gauteng schools, ACSA,
 *      SABC), their financial outcomes, headline Special Tribunal cases,
 *      and links to SIU-implicated individuals. Runs AFTER both the
 *      commissions-master and adhoc-committees seeds because the
 *      Transnet / Eskom / ACSA proclamations back-link to the Zondo
 *      Commission and the SABC proclamation back-links to the SABC Board
 *      Inquiry committee. Missing back-links are left null and a deferred
 *      warning is logged.
 *
 *   4. mkhwanazi.seed.ts
 *      Seeds the Mkhwanazi story AND the Madlanga Commission it belongs
 *      to. Also patches the Mkhwanazi ad hoc committee's
 *      related_commission_id back at Madlanga and sets
 *      story.adhoc_committee_id. Madlanga is deliberately owned by this
 *      file (not by the master seed) because the story and the commission
 *      are a tightly coupled unit.
 *
 *   5. cape-town-stories.seed.ts
 *      Cape Town / provincial accountability stories (metros, schools,
 *      water sector, SASSA). Runs after mkhwanazi so similar_stories can
 *      link to slug mkhwanazi-madlanga-commission.
 *
 *   6. impact-sectors.seed.ts
 *      Human-impact reference sectors + StoryImpactSector / CommissionImpactSector
 *      links + expenditure what_it_should_have_funded patches.
 *
 *   7. accountability-bodies.seed.ts
 *      Scorpions (DSO), Hawks (DPCI), IDAC; Scorpions cases; Khampepe
 *      commission subject_body link; Scorpions timeline story. Runs after
 *      impact-sectors (depends on commissions-master + migrations for
 *      accountability_bodies tables).
 *
 * Run with (inside apps/api):
 *   npm run seed:all
 *
 * `npm run seed` still points at mkhwanazi.seed.ts for backwards
 * compatibility with existing dev-workflow scripts.
 */

import 'reflect-metadata';

import { run as runAccountabilityBodies } from './accountability-bodies.seed';
import { run as runAdhocCommittees } from './adhoc-committees.seed';
import { run as runCapeTownStories } from './cape-town-stories.seed';
import { run as runCommissionsMaster } from './commissions-master.seed';
import { run as runImpactSectors } from './impact-sectors.seed';
import { run as runMkhwanazi } from './mkhwanazi.seed';
import { run as runRecommendations } from './recommendations.seed';
import { run as runReports } from './reports.seed';
import { run as runSiu } from './siu.seed';

async function main(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════');
  console.log('   The Record — full seed run');
  console.log('═══════════════════════════════════════════════');

  await runCommissionsMaster();
  await runReports();
  await runRecommendations();
  await runAdhocCommittees();
  await runSiu();
  await runMkhwanazi();
  await runCapeTownStories();
  await runImpactSectors();
  await runAccountabilityBodies();

  console.log('\n═══════════════════════════════════════════════');
  console.log('   ✓ All seeds complete.');
  console.log('═══════════════════════════════════════════════\n');
}

if (require.main === module) {
  main().catch((err: unknown) => {
    console.error('\n✗ Seed run failed:', err);
    process.exit(1);
  });
}
