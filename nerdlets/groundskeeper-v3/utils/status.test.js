import { STATUS } from '../constants';
import { enrichEntity, rowStatus, summarize } from './status';

describe('rowStatus', () => {
  test('is CURRENT when there is no recommended version yet', () => {
    expect(rowStatus({ version: '8.21.1' })).toBe(STATUS.CURRENT);
  });

  test('is CURRENT when running the recommended version', () => {
    expect(rowStatus({ version: '8.21.1', recommendedVersion: '8.21.1' })).toBe(
      STATUS.CURRENT
    );
  });

  test('is BEHIND when a different, known recommended version exists', () => {
    expect(rowStatus({ version: '7.4.0', recommendedVersion: '8.21.1' })).toBe(
      STATUS.BEHIND
    );
  });

  test('is EOL once the running version is past its EOL date, even if current', () => {
    const eolDate = new Date('2020-01-01T00:00:00Z');
    expect(
      rowStatus({
        version: '8.21.1',
        recommendedVersion: '8.21.1',
        eolDate
      })
    ).toBe(STATUS.EOL);
  });

  test('EOL takes precedence over BEHIND', () => {
    const eolDate = new Date('2020-01-01T00:00:00Z');
    expect(
      rowStatus({ version: '7.4.0', recommendedVersion: '8.21.1', eolDate })
    ).toBe(STATUS.EOL);
  });

  test('a future EOL date does not count as EOL yet', () => {
    const eolDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
    expect(
      rowStatus({ version: '8.21.1', recommendedVersion: '8.21.1', eolDate })
    ).toBe(STATUS.CURRENT);
  });
});

describe('enrichEntity', () => {
  const entity = { guid: 'g1', name: 'checkout-api', version: '7.4.0' };
  const releasesForLanguage = {
    '7.4.0': { date: new Date('2023-01-01T00:00:00Z'), eolDate: null },
    '8.21.1': { date: new Date('2024-06-01T00:00:00Z'), eolDate: null }
  };

  test('attaches recommendedVersion, status, and age', () => {
    const row = enrichEntity(entity, '8.21.1', releasesForLanguage);

    expect(row).toMatchObject({
      guid: 'g1',
      name: 'checkout-api',
      version: '7.4.0',
      recommendedVersion: '8.21.1',
      status: STATUS.BEHIND
    });
    expect(row.age).toBe('over 1 year old');
  });

  test('age is null when already on the recommended version', () => {
    const row = enrichEntity(entity, '7.4.0', releasesForLanguage);

    expect(row.status).toBe(STATUS.CURRENT);
    expect(row.age).toBeNull();
  });

  test('handles an unknown language with no release history', () => {
    const row = enrichEntity(entity, '8.21.1', undefined);

    expect(row.status).toBe(STATUS.BEHIND);
    expect(row.age).toBeNull();
  });
});

describe('summarize', () => {
  test('tallies rows by status, always including every status key', () => {
    const rows = [
      { status: STATUS.CURRENT },
      { status: STATUS.CURRENT },
      { status: STATUS.BEHIND },
      { status: STATUS.EOL }
    ];

    expect(summarize(rows)).toEqual({
      [STATUS.CURRENT]: 2,
      [STATUS.BEHIND]: 1,
      [STATUS.EOL]: 1,
      [STATUS.CVE]: 0
    });
  });

  test('returns all-zero counts for no rows', () => {
    expect(summarize([])).toEqual({
      [STATUS.CURRENT]: 0,
      [STATUS.BEHIND]: 0,
      [STATUS.EOL]: 0,
      [STATUS.CVE]: 0
    });
  });
});
