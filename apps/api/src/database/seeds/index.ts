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
 * Run with (inside apps/api):
 *   npm run seed:all
 *
 * `npm run seed` still points at mkhwanazi.seed.ts for backwards
 * compatibility with existing dev-workflow scripts.
 */

import 'reflect-metadata';

import { run as runAdhocCommittees } from './adhoc-committees.seed';
import { run as runCommissionsMaster } from './commissions-master.seed';
import { run as runMkhwanazi } from './mkhwanazi.seed';
import { run as runSiu } from './siu.seed';

async function main(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════');
  console.log('   The Record — full seed run');
  console.log('═══════════════════════════════════════════════');

  await runCommissionsMaster();
  await runAdhocCommittees();
  await runSiu();
  await runMkhwanazi();

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
