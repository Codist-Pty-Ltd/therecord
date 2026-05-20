/* eslint-disable no-console */

/**
 * Main seed runner.
 *
 * Runs every seed in the correct dependency order inside a single process
 * so that every DataSource lifecycle (init → use → destroy) is explicit.
 *
 * Order (see also .cursorrules → State-Owned Entities / Provincial seed order):
 *   1. commissions-master.seed.ts
 *      Seeds historical commissions + enabling laws + cross-commission people.
 *
 *   2. reports.seed.ts — commission reports (slug lookup).
 *   3. recommendations.seed.ts — after reports.
 *
 *   4. adhoc-committees.seed.ts
 *      Ad Hoc Committees + people + law links. Before mkhwanazi in isolation;
 *      full run finishes mkhwanazi last so Madlanga + committee back-links converge.
 *
 *   5. siu.seed.ts — SIU corpus + proclamation back-links to commissions/ad hoc.
 *
 *   6. impact-sectors.seed.ts
 *      Human-impact sectors + joins. MUST run before state-entities
 *      (primary_impact_sector_slug FK to sector slugs).
 *
 *   6b. sa-history.seed.ts
 *      Historical eras/events/laws/statistics (requires migrations + TRC commission seed).
 *
 *   7. state-entities.seed.ts — SOEs + timeline + commission/SIU/ad hoc links.
 *
 *   8. accountability-bodies.seed.ts — Scorpions / Hawks / IDAC (uses commissions + migrations).
 *
 *   9. cape-town-stories.seed.ts
 *      Provincial stories, expenditure, similar_stories (needs state-entities patches
 *      for water-sector / gauteng-sassa stories). Pairs that reference
 *      mkhwanazi-madlanga-commission are finalized when mkhwanazi runs last.
 *
 *   10. mkhwanazi.seed.ts
 *       Madlanga Commission + Mkhwanazi story + timeline; patches ad hoc ↔ commission;
 *       backfills similar_story row(s) that reference this slug after cape-town ran.
 *
 *   11. new-stories-2026.seed.ts
 *       Tembisa Hospital, Medicare24, Carrim, SIU R136/2023 (after mkhwanazi).
 *
 *   12. bbee-transformation.seed.ts — B-BBEE policy explainer + story (after Tembisa / Malusi stories exist).
 *
 * Run with (inside apps/api):
 *   npm run seed:all
 *
 * `npm run seed` still points at mkhwanazi.seed.ts for backwards compatibility.
 */

import 'reflect-metadata';

import { run as runAccountabilityBodies } from './accountability-bodies.seed';
import { run as runAdhocCommittees } from './adhoc-committees.seed';
import { run as runBbeeTransformation } from './bbee-transformation.seed';
import { run as runCapeTownStories } from './cape-town-stories.seed';
import { run as runCommissionsMaster } from './commissions-master.seed';
import { run as runImpactSectors } from './impact-sectors.seed';
import { run as runSaHistory } from './sa-history.seed';
import { run as runMkhwanazi } from './mkhwanazi.seed';
import { run as runNewStories2026 } from './new-stories-2026.seed';
import { run as runRecommendations } from './recommendations.seed';
import { run as runReports } from './reports.seed';
import { run as runSiu } from './siu.seed';
import { run as runStateEntities } from './state-entities.seed';

async function main(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════');
  console.log('   The Record — full seed run');
  console.log('═══════════════════════════════════════════════');

  await runCommissionsMaster();
  await runReports();
  await runRecommendations();
  await runAdhocCommittees();
  await runSiu();
  await runImpactSectors();
  await runSaHistory();
  await runStateEntities();
  await runAccountabilityBodies();
  await runCapeTownStories();
  await runMkhwanazi();
  await runNewStories2026();
  await runBbeeTransformation();

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
