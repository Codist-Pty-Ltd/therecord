import type { MoneyToReality } from "@the-record/shared-types";

const floorDiv = (amount: number, unit: number): number =>
  unit <= 0 ? 0 : Math.floor(amount / unit);

/** Mirrors `ImpactService.moneyToReality` — client + server safe. */
export function computeMoneyToReality(amountRands: number): MoneyToReality {
  const n = amountRands;
  if (!Number.isFinite(n) || n <= 0) {
    return {
      rdp_houses: 0,
      school_repairs: 0,
      water_connections: 0,
      child_support_grants: 0,
      old_age_grants: 0,
      hospital_beds: 0,
      teachers_per_year: 0,
    };
  }
  return {
    rdp_houses: floorDiv(n, 250_000),
    school_repairs: floorDiv(n, 5_000_000),
    water_connections: floorDiv(n, 50_000),
    child_support_grants: floorDiv(n, 6_360),
    old_age_grants: floorDiv(n, 26_400),
    hospital_beds: floorDiv(n, 1_000_000),
    teachers_per_year: floorDiv(n, 300_000),
  };
}
