import { LegalMapperService } from './legal-mapper.service';

describe('LegalMapperService', () => {
  const mapper = new LegalMapperService();

  it('maps "corruption" to PRECCA section 3', () => {
    const refs = mapper.mapCrimes(['corruption']);
    expect(refs.some((r) => r.short_name === 'PRECCA' && r.section === '3')).toBe(
      true,
    );
  });

  it('maps "tender fraud" to PRECCA section 13 AND PFMA section 86', () => {
    const refs = mapper.mapCrimes(['tender fraud']);
    expect(refs.some((r) => r.short_name === 'PRECCA' && r.section === '13')).toBe(
      true,
    );
    expect(refs.some((r) => r.short_name === 'PFMA' && r.section === '86')).toBe(
      true,
    );
  });

  it('maps "murder" to Common Law AND Constitution section 11', () => {
    const refs = mapper.mapCrimes(['murder']);
    expect(
      refs.some((r) => r.short_name === 'Common Law' && r.section === 'Murder'),
    ).toBe(true);
    expect(
      refs.some((r) => r.short_name === 'Constitution' && r.section === '11'),
    ).toBe(true);
  });

  it('maps alias "bribery" to the same result as "corruption"', () => {
    const bribery = mapper.mapCrimes(['bribery']);
    const corruption = mapper.mapCrimes(['corruption']);
    expect(bribery).toEqual(corruption);
  });

  it('maps alias "procurement fraud" to "tender fraud" statutes', () => {
    const alias = mapper.mapCrimes(['procurement fraud']);
    const direct = mapper.mapCrimes(['tender fraud']);
    expect(alias).toEqual(direct);
  });

  it('maps alias "obstruction of justice" to "defeating justice" statutes', () => {
    const refs = mapper.mapCrimes(['obstruction of justice']);
    expect(
      refs.some(
        (r) =>
          r.short_name === 'Common Law' &&
          r.section === 'Defeating or obstructing the course of justice',
      ),
    ).toBe(true);
  });

  it('returns empty array for unknown crime type', () => {
    expect(mapper.mapCrimes(['teleportation fraud'])).toEqual([]);
  });

  it('deduplicates statutes when same crime appears twice in input', () => {
    const refs = mapper.mapCrimes(['corruption', 'corruption']);
    const precca = refs.filter((r) => r.short_name === 'PRECCA' && r.section === '3');
    expect(precca).toHaveLength(1);
  });

  it('handles empty crimes array without throwing', () => {
    expect(mapper.mapCrimes([])).toEqual([]);
  });

  it('handles null/undefined input gracefully', () => {
    expect(mapper.mapCrimes(null)).toEqual([]);
    expect(mapper.mapCrimes(undefined)).toEqual([]);
  });
});
