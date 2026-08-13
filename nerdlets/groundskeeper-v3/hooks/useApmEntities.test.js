import { useEntitySearchQuery } from 'nr1';

import useApmEntities from './useApmEntities';
import { renderHook } from './testUtils';

describe('useApmEntities', () => {
  beforeEach(() => {
    useEntitySearchQuery.mockReset();
  });

  test('queries strictly APM applications', () => {
    useEntitySearchQuery.mockReturnValue({
      data: { count: 0, entities: [] },
      fetchMore: jest.fn()
    });

    renderHook(useApmEntities, {});

    expect(useEntitySearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        entityDomain: 'APM',
        entityType: 'APPLICATION',
        includeTags: true
      })
    );
  });

  test('only passes a `filters` string through when one is given', () => {
    useEntitySearchQuery.mockReturnValue({
      data: { count: 0, entities: [] },
      fetchMore: jest.fn()
    });

    renderHook(useApmEntities, {});
    expect(useEntitySearchQuery.mock.calls[0][0]).not.toHaveProperty('filters');

    renderHook(useApmEntities, { filters: "language = 'java'" });
    expect(useEntitySearchQuery.mock.calls[1][0]).toMatchObject({
      filters: "language = 'java'"
    });
  });

  test('normalizes raw entities and passes count/fetchMore through', () => {
    const fetchMore = jest.fn();
    useEntitySearchQuery.mockReturnValue({
      data: {
        count: 42,
        entities: [
          {
            guid: 'g1',
            name: 'checkout-api',
            accountId: 123,
            language: 'java',
            reporting: true,
            runningAgentVersions: { minVersion: '7.4.0', maxVersion: '7.5.0' },
            tags: [{ key: 'env', values: ['production'] }]
          }
        ]
      },
      fetchMore
    });

    const { result } = renderHook(useApmEntities, {});

    expect(result.current.count).toBe(42);
    expect(result.current.fetchMore).toBe(fetchMore);
    expect(result.current.entities).toEqual([
      {
        guid: 'g1',
        name: 'checkout-api',
        accountId: 123,
        language: 'java',
        reporting: true,
        version: '7.4.0',
        tags: { env: ['production'] }
      }
    ]);
  });

  // Regression test: useEntitySearchQuery can return `data: null` while its request
  // is in flight, not just `data: undefined`. A `= {}` destructuring default on
  // `data` only catches `undefined`, so this previously threw straight through.
  test('does not throw when data comes back as an explicit null', () => {
    useEntitySearchQuery.mockReturnValue({
      data: null,
      fetchMore: jest.fn()
    });

    const { result } = renderHook(useApmEntities, {});

    expect(result.current.count).toBe(0);
    expect(result.current.entities).toEqual([]);
  });

  test('logs to the console when the search errors', () => {
    const error = new Error('boom');
    useEntitySearchQuery.mockReturnValue({
      data: { count: 0, entities: [] },
      error,
      fetchMore: jest.fn()
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(useApmEntities, {});

    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching APM entities:',
      error
    );
    // eslint-disable-next-line no-console
    console.error.mockRestore();
  });
});
