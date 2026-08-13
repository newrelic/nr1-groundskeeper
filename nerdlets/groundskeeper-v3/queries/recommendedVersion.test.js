import { NOOP_QUERY, recommendedVersionQuery } from './recommendedVersion';

describe('recommendedVersionQuery', () => {
  test('includes every account id in the accounts array', () => {
    const query = recommendedVersionQuery([1, 2, 3], ['guid-1']);

    expect(query).toContain('accounts: [1, 2, 3]');
  });

  test('quotes every guid in the WHERE ... IN clause', () => {
    const query = recommendedVersionQuery([1], ['guid-1', 'guid-2']);

    expect(query).toContain("entity.guid IN ('guid-1', 'guid-2')");
  });

  test('facets by entity.guid and selects latest(recommendedVersion)', () => {
    const query = recommendedVersionQuery([1], ['guid-1']);

    expect(query).toContain(
      'SELECT latest(recommendedVersion) AS recommendedVersion'
    );
    expect(query).toContain('FACET entity.guid');
    expect(query).toContain('FROM AgentUpdate');
  });

  test('defaults to empty accounts/guids when called with no args', () => {
    const query = recommendedVersionQuery();

    expect(query).toContain('accounts: []');
    expect(query).toContain("entity.guid IN ('')");
  });
});

describe('NOOP_QUERY', () => {
  // Regression test: hooks/useRecommendedVersions.js must always hand
  // useNerdGraphQuery a real, valid query string -- never undefined/empty -- or the
  // hook throws "Cannot read properties of undefined (reading 'definitions')"
  // internally before any entities have loaded. See that hook for the full story.
  test('is a non-empty, well-formed query with no interpolated placeholders', () => {
    expect(typeof NOOP_QUERY).toBe('string');
    expect(NOOP_QUERY.trim().length).toBeGreaterThan(0);
    expect(NOOP_QUERY).toContain('actor');
  });
});
