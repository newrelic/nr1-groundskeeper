import { act } from 'react-dom/test-utils';
import { NerdGraphQuery } from 'nr1';

import useRecommendedVersions from './useRecommendedVersions';
import { LOOKUP } from '../constants';
import { renderHook } from './testUtils';

// A promise plus the functions that settle it, so a test decides when (and in
// what order) each request answers.
const deferred = () => {
  const settle = {};
  const promise = new Promise((resolve, reject) => {
    settle.resolve = resolve;
    settle.reject = reject;
  });
  return { promise, ...settle };
};

const response = results => ({ data: { actor: { nrql0: { results } } } });

// Lets pending promise callbacks (and the state updates they make) run.
const flush = () => act(() => new Promise(resolve => setTimeout(resolve, 0)));

const noWait = () => Promise.resolve();
const useHook = entities => useRecommendedVersions(entities, { wait: noWait });

const queryOf = call => call[0].query;

describe('useRecommendedVersions', () => {
  beforeEach(() => {
    NerdGraphQuery.query.mockReset();
  });

  test('makes no request with no entities', () => {
    renderHook(useHook, []);

    expect(NerdGraphQuery.query).not.toHaveBeenCalled();
  });

  test('queries every account and guid in the first batch of entities', () => {
    NerdGraphQuery.query.mockReturnValue(deferred().promise);

    renderHook(useHook, [
      { guid: 'guid-1', accountId: 111 },
      { guid: 'guid-2', accountId: 222 }
    ]);

    const query = queryOf(NerdGraphQuery.query.mock.calls[0]);
    expect(query).toContain('accounts: [111, 222]');
    expect(query).toContain("entity.guid IN ('guid-1', 'guid-2')");
  });

  test('marks guids CHECKING while the request is out, DONE once answered', async () => {
    const request = deferred();
    NerdGraphQuery.query.mockReturnValue(request.promise);

    const { result } = renderHook(useHook, [
      { guid: 'guid-1', accountId: 111 },
      { guid: 'guid-2', accountId: 111 }
    ]);
    expect(result.current.lookups).toEqual({
      'guid-1': LOOKUP.CHECKING,
      'guid-2': LOOKUP.CHECKING
    });

    request.resolve(
      response([{ facet: 'guid-1', recommendedVersion: '8.21.1' }])
    );
    await flush();

    // guid-2 had no AgentUpdate event: answered, just with nothing to report.
    expect(result.current.lookups).toEqual({
      'guid-1': LOOKUP.DONE,
      'guid-2': LOOKUP.DONE
    });
    expect(result.current.recommendedVersions).toEqual({ 'guid-1': '8.21.1' });
  });

  test('only queries guids not already requested once a new page loads', () => {
    NerdGraphQuery.query.mockReturnValue(deferred().promise);
    const { rerender } = renderHook(useHook, [
      { guid: 'guid-1', accountId: 111 }
    ]);

    rerender([
      { guid: 'guid-1', accountId: 111 },
      { guid: 'guid-2', accountId: 222 }
    ]);

    expect(NerdGraphQuery.query).toHaveBeenCalledTimes(2);
    const query = queryOf(NerdGraphQuery.query.mock.calls[1]);
    expect(query).toContain('guid-2');
    expect(query).not.toContain('guid-1');
    expect(query).toContain('accounts: [222]');
  });

  test('makes no request when a page adds no new guids', () => {
    NerdGraphQuery.query.mockReturnValue(deferred().promise);
    const { rerender } = renderHook(useHook, [
      { guid: 'guid-1', accountId: 111 }
    ]);

    rerender([{ guid: 'guid-1', accountId: 111 }]);

    expect(NerdGraphQuery.query).toHaveBeenCalledTimes(1);
  });

  // The bug: with one shared query, a second page arriving before the first
  // response replaced the first request, and its results were never applied.
  test('keeps both batches when a second page loads before the first answers', async () => {
    const first = deferred();
    const second = deferred();
    NerdGraphQuery.query
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result, rerender } = renderHook(useHook, [
      { guid: 'guid-1', accountId: 111 }
    ]);
    rerender([
      { guid: 'guid-1', accountId: 111 },
      { guid: 'guid-2', accountId: 111 }
    ]);

    second.resolve(
      response([
        { facet: 'guid-2', recommendedVersion: '2.1.0', reasons: 'BUG_FIXES' }
      ])
    );
    await flush();
    first.resolve(
      response([
        {
          facet: 'guid-1',
          recommendedVersion: '8.21.1',
          versionDiff: '8.21.0, 8.21.1'
        }
      ])
    );
    await flush();

    expect(result.current.recommendedVersions).toEqual({
      'guid-1': '8.21.1',
      'guid-2': '2.1.0'
    });
    expect(result.current.reasons).toEqual({
      'guid-1': undefined,
      'guid-2': 'BUG_FIXES'
    });
    expect(result.current.versionDiffs).toEqual({
      'guid-1': '8.21.0, 8.21.1',
      'guid-2': undefined
    });
    expect(result.current.lookups).toEqual({
      'guid-1': LOOKUP.DONE,
      'guid-2': LOOKUP.DONE
    });
  });

  test('retries a failed request before giving up', async () => {
    NerdGraphQuery.query
      .mockResolvedValueOnce({ error: new Error('timeout') })
      .mockResolvedValueOnce(
        response([{ facet: 'guid-1', recommendedVersion: '8.21.1' }])
      );

    const { result } = renderHook(useHook, [
      { guid: 'guid-1', accountId: 111 }
    ]);
    await flush();

    expect(NerdGraphQuery.query).toHaveBeenCalledTimes(2);
    expect(result.current.lookups).toEqual({ 'guid-1': LOOKUP.DONE });
    expect(result.current.recommendedVersions).toEqual({ 'guid-1': '8.21.1' });
  });

  test('marks guids FAILED after every retry fails, and requests them again with the next page', async () => {
    NerdGraphQuery.query.mockRejectedValue(new Error('network'));

    const { result, rerender } = renderHook(useHook, [
      { guid: 'guid-1', accountId: 111 }
    ]);
    await flush();

    expect(NerdGraphQuery.query).toHaveBeenCalledTimes(3);
    expect(result.current.lookups).toEqual({ 'guid-1': LOOKUP.FAILED });

    NerdGraphQuery.query.mockReset();
    NerdGraphQuery.query.mockReturnValue(deferred().promise);
    rerender([
      { guid: 'guid-1', accountId: 111 },
      { guid: 'guid-2', accountId: 111 }
    ]);

    expect(queryOf(NerdGraphQuery.query.mock.calls[0])).toContain(
      "entity.guid IN ('guid-1', 'guid-2')"
    );
    expect(result.current.lookups).toEqual({
      'guid-1': LOOKUP.CHECKING,
      'guid-2': LOOKUP.CHECKING
    });
  });

  test('ignores a response that arrives after unmounting', async () => {
    const request = deferred();
    NerdGraphQuery.query.mockReturnValue(request.promise);
    const { unmount } = renderHook(useHook, [
      { guid: 'guid-1', accountId: 111 }
    ]);
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    unmount();
    request.resolve(response([{ facet: 'guid-1' }]));
    await flush();

    // React warns about state updates on an unmounted component.
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  test('ignores entities with no guid or no accountId', () => {
    renderHook(useHook, [
      { guid: null, accountId: 111 },
      { guid: 'guid-1', accountId: null }
    ]);

    expect(NerdGraphQuery.query).not.toHaveBeenCalled();
  });
});
