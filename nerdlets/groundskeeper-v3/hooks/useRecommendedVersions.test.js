import { useNerdGraphQuery } from 'nr1';

import useRecommendedVersions from './useRecommendedVersions';
import { NOOP_QUERY } from '../queries';
import { renderHook } from './testUtils';

const lastQuery = () => {
  const calls = useNerdGraphQuery.mock.calls;
  return calls[calls.length - 1][0].query;
};

describe('useRecommendedVersions', () => {
  beforeEach(() => {
    useNerdGraphQuery.mockReset();
    useNerdGraphQuery.mockReturnValue({ data: undefined });
  });

  // Regression test for the bug this hook originally shipped with: before any
  // entities have loaded there's nothing to query yet, but useNerdGraphQuery still
  // gets called every render (hooks can't be conditional) -- and calling it with a
  // missing/undefined `query` crashed with "Cannot read properties of undefined
  // (reading 'definitions')". It must always receive a real, non-empty query string.
  test('never calls useNerdGraphQuery with a missing query, even with no entities', () => {
    renderHook(useRecommendedVersions, []);

    expect(useNerdGraphQuery).toHaveBeenCalled();
    const { query } = useNerdGraphQuery.mock.calls[0][0];
    expect(typeof query).toBe('string');
    expect(query.length).toBeGreaterThan(0);
    expect(query).toBe(NOOP_QUERY);
  });

  test('queries every account and guid in the first batch of entities', () => {
    renderHook(useRecommendedVersions, [
      { guid: 'guid-1', accountId: 111 },
      { guid: 'guid-2', accountId: 222 }
    ]);

    const query = lastQuery();
    expect(query).toContain('accounts: [111, 222]');
    expect(query).toContain("entity.guid IN ('guid-1', 'guid-2')");
  });

  test('only queries guids not already resolved once a new page loads', () => {
    const { rerender } = renderHook(useRecommendedVersions, [
      { guid: 'guid-1', accountId: 111 }
    ]);
    expect(lastQuery()).toContain('guid-1');

    rerender([
      { guid: 'guid-1', accountId: 111 },
      { guid: 'guid-2', accountId: 222 }
    ]);

    const query = lastQuery();
    expect(query).toContain('guid-2');
    expect(query).not.toContain('guid-1');
    expect(query).toContain('accounts: [222]');
  });

  test('skips querying entirely when a page adds no new guids', () => {
    const { rerender } = renderHook(useRecommendedVersions, [
      { guid: 'guid-1', accountId: 111 }
    ]);
    const queryAfterFirstRender = lastQuery();
    expect(queryAfterFirstRender).toContain('guid-1');

    rerender([{ guid: 'guid-1', accountId: 111 }]);

    // useNerdGraphQuery is still called every render (hooks can't be conditional),
    // but its query should be unchanged -- no new NRQL lookup was kicked off for a
    // guid that's already resolved.
    expect(lastQuery()).toBe(queryAfterFirstRender);
  });

  test('merges FACET results into recommendedVersions across separate queries', () => {
    useNerdGraphQuery.mockImplementation(({ query }) => {
      if (query.includes('guid-1')) {
        return {
          data: {
            actor: {
              nrql0: {
                results: [
                  {
                    facet: 'guid-1',
                    recommendedVersion: '8.21.1',
                    reasons: 'SECURITY_VULNERABILITY_FIXES',
                    versionDiff: '8.21.0,8.21.1'
                  }
                ]
              }
            }
          }
        };
      }
      if (query.includes('guid-3')) {
        return {
          data: {
            actor: {
              nrql0: {
                results: [
                  {
                    facet: 'guid-3',
                    recommendedVersion: '2.1.0',
                    reasons: 'BUG_FIXES'
                  }
                ]
              }
            }
          }
        };
      }
      return { data: undefined };
    });

    const { result, rerender } = renderHook(useRecommendedVersions, [
      { guid: 'guid-1', accountId: 111 }
    ]);
    expect(result.current.recommendedVersions).toEqual({ 'guid-1': '8.21.1' });
    expect(result.current.reasons).toEqual({
      'guid-1': 'SECURITY_VULNERABILITY_FIXES'
    });
    expect(result.current.versionDiffs).toEqual({
      'guid-1': '8.21.0,8.21.1'
    });

    rerender([
      { guid: 'guid-1', accountId: 111 },
      { guid: 'guid-3', accountId: 333 }
    ]);

    expect(result.current.recommendedVersions).toEqual({
      'guid-1': '8.21.1',
      'guid-3': '2.1.0'
    });
    expect(result.current.reasons).toEqual({
      'guid-1': 'SECURITY_VULNERABILITY_FIXES',
      'guid-3': 'BUG_FIXES'
    });
    expect(result.current.versionDiffs).toEqual({
      'guid-1': '8.21.0,8.21.1',
      'guid-3': undefined
    });
  });

  test('ignores entities with no guid or no accountId', () => {
    renderHook(useRecommendedVersions, [
      { guid: null, accountId: 111 },
      { guid: 'guid-1', accountId: null }
    ]);

    expect(lastQuery()).toBe(NOOP_QUERY);
  });
});
