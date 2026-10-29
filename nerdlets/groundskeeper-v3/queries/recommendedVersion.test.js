import { GUIDS_PER_QUERY, recommendedVersionQuery } from './recommendedVersion';

describe('recommendedVersionQuery', () => {
  test('includes every account id in the accounts array', () => {
    const query = recommendedVersionQuery([1, 2, 3], ['guid-1']);

    expect(query).toContain('accounts: [1, 2, 3]');
  });

  test('quotes every guid in the WHERE ... IN clause', () => {
    const query = recommendedVersionQuery([1], ['guid-1', 'guid-2']);

    expect(query).toContain("entity.guid IN ('guid-1', 'guid-2')");
  });

  test('facets by entity.guid, selects latest(recommendedVersion), latest(reasons) and latest(versionDiff), and looks back 7 days', () => {
    const query = recommendedVersionQuery([1], ['guid-1']);

    expect(query).toContain(
      'SELECT latest(recommendedVersion) AS recommendedVersion'
    );
    expect(query).toContain('latest(reasons) AS reasons');
    expect(query).toContain('latest(versionDiff) AS versionDiff');
    expect(query).toContain('SINCE 7 days ago');
    expect(query).toContain('FACET entity.guid');
    expect(query).toContain('FROM AgentUpdate');
  });

  test('defaults to empty accounts/guids when called with no args', () => {
    const query = recommendedVersionQuery();

    expect(query).toContain('nrql0:');
    expect(query).toContain('accounts: []');
    expect(query).toContain("entity.guid IN ('')");
  });

  test('emits a single aliased nrql field when at or under the per-query guid limit', () => {
    const guids = Array.from(
      { length: GUIDS_PER_QUERY },
      (_, i) => `guid-${i}`
    );
    const query = recommendedVersionQuery([1], guids);

    expect(query).toContain('nrql0:');
    expect(query).not.toContain('nrql1:');
    expect(query).toContain('guid-0');
    expect(query).toContain(`guid-${GUIDS_PER_QUERY - 1}`);
  });

  test('splits guids over the per-query limit into multiple aliased nrql fields', () => {
    const guids = Array.from(
      { length: GUIDS_PER_QUERY + 5 },
      (_, i) => `guid-${i}`
    );
    const query = recommendedVersionQuery([1], guids);

    expect(query).toContain('nrql0:');
    expect(query).toContain('nrql1:');
    expect(query).not.toContain('nrql2:');

    const [, chunk0, chunk1] = query.split(/nrql\d:/);
    expect(chunk0).toContain('guid-0');
    expect(chunk0).toContain(`guid-${GUIDS_PER_QUERY - 1}`);
    expect(chunk0).not.toContain(`guid-${GUIDS_PER_QUERY}`);
    expect(chunk1).toContain(`guid-${GUIDS_PER_QUERY}`);
    expect(chunk1).toContain(`guid-${GUIDS_PER_QUERY + 4}`);
    expect(chunk1).not.toContain('guid-0');
  });

  test('reuses the same accounts list for every chunk', () => {
    const guids = Array.from(
      { length: GUIDS_PER_QUERY + 5 },
      (_, i) => `guid-${i}`
    );
    const query = recommendedVersionQuery([1, 2], guids);

    expect(query.match(/accounts: \[1, 2\]/g)).toHaveLength(2);
  });
});
