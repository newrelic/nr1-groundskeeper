import { fetchAgentUpdates, parseAgentUpdates } from './agentUpdates';

const noWait = () => Promise.resolve();

const response = results => ({ data: { actor: { nrql0: { results } } } });

describe('parseAgentUpdates', () => {
  test('gathers results from every aliased nrql field, keyed by guid', () => {
    const data = {
      actor: {
        nrql0: {
          results: [
            {
              facet: 'guid-1',
              recommendedVersion: '8.21.1',
              reasons: 'BUG_FIXES',
              versionDiff: '8.21.0, 8.21.1'
            }
          ]
        },
        nrql1: {
          results: [{ facet: 'guid-2', recommendedVersion: '2.1.0' }]
        }
      }
    };

    expect(parseAgentUpdates(data)).toEqual({
      'guid-1': {
        recommendedVersion: '8.21.1',
        reasons: 'BUG_FIXES',
        versionDiff: '8.21.0, 8.21.1'
      },
      'guid-2': {
        recommendedVersion: '2.1.0',
        reasons: undefined,
        versionDiff: undefined
      }
    });
  });

  test('is empty with no data', () => {
    expect(parseAgentUpdates(undefined)).toEqual({});
    expect(parseAgentUpdates({ actor: {} })).toEqual({});
  });
});

describe('fetchAgentUpdates', () => {
  test('queries the batch and resolves with its results', async () => {
    const runQuery = jest.fn(() =>
      Promise.resolve(
        response([{ facet: 'guid-1', recommendedVersion: '8.21.1' }])
      )
    );

    const results = await fetchAgentUpdates(runQuery, {
      accountIds: [111],
      guids: ['guid-1']
    });

    expect(runQuery).toHaveBeenCalledTimes(1);
    expect(runQuery.mock.calls[0][0]).toContain("entity.guid IN ('guid-1')");
    expect(results['guid-1'].recommendedVersion).toBe('8.21.1');
  });

  test('retries after an error, waiting longer each time', async () => {
    const runQuery = jest
      .fn()
      .mockResolvedValueOnce({ error: new Error('timeout') })
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(response([{ facet: 'guid-1' }]));
    const wait = jest.fn(noWait);

    const results = await fetchAgentUpdates(
      runQuery,
      { accountIds: [111], guids: ['guid-1'] },
      { wait }
    );

    expect(runQuery).toHaveBeenCalledTimes(3);
    expect(wait.mock.calls).toEqual([[1000], [2000]]);
    expect(results).toHaveProperty('guid-1');
  });

  test('treats a GraphQL errors array as a failed attempt', async () => {
    const runQuery = jest
      .fn()
      .mockResolvedValueOnce({ errors: [{ message: 'bad' }] })
      .mockResolvedValueOnce(response([]));

    await fetchAgentUpdates(runQuery, {}, { wait: noWait });

    expect(runQuery).toHaveBeenCalledTimes(2);
  });

  test('rejects with the last error once every attempt fails', async () => {
    const runQuery = jest
      .fn()
      .mockRejectedValueOnce(new Error('first'))
      .mockRejectedValueOnce(new Error('second'))
      .mockRejectedValueOnce(new Error('third'));

    await expect(
      fetchAgentUpdates(runQuery, {}, { wait: noWait })
    ).rejects.toThrow('third');
    expect(runQuery).toHaveBeenCalledTimes(3);
  });
});
