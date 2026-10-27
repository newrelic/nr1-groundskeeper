import { STATUS } from '../constants';
import {
  DEFAULT_SORTING,
  describeReasons,
  enrichEntity,
  hasSecurityFix,
  parseReasons,
  rowStatus,
  sortRows,
  summarize
} from './status';

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

  test('attaches the passed-through reasons string', () => {
    const row = enrichEntity(
      entity,
      '8.21.1',
      releasesForLanguage,
      'SECURITY_VULNERABILITY_FIXES,BUG_FIXES'
    );

    expect(row.reasons).toBe('SECURITY_VULNERABILITY_FIXES,BUG_FIXES');
  });

  test('attaches the passed-through versionDiff string', () => {
    const row = enrichEntity(
      entity,
      '8.21.1',
      releasesForLanguage,
      'BUG_FIXES',
      '8.21.0,8.21.1'
    );

    expect(row.versionDiff).toBe('8.21.0,8.21.1');
  });
});

describe('parseReasons', () => {
  test('splits, trims, and drops empties', () => {
    expect(parseReasons('BUG_FIXES, SECURITY_VULNERABILITY_FIXES')).toEqual([
      'BUG_FIXES',
      'SECURITY_VULNERABILITY_FIXES'
    ]);
  });

  test('returns an empty array for nothing', () => {
    expect(parseReasons()).toEqual([]);
    expect(parseReasons('')).toEqual([]);
  });
});

describe('hasSecurityFix', () => {
  test('is true when SECURITY_VULNERABILITY_FIXES is among the reasons', () => {
    expect(hasSecurityFix('BUG_FIXES,SECURITY_VULNERABILITY_FIXES')).toBe(true);
  });

  test('is false otherwise', () => {
    expect(hasSecurityFix('BUG_FIXES,NEW_FEATURES')).toBe(false);
    expect(hasSecurityFix()).toBe(false);
  });
});

describe('describeReasons', () => {
  test('describes a single reason', () => {
    expect(describeReasons('SECURITY_VULNERABILITY_FIXES')).toBe(
      'Includes security fixes.'
    );
  });

  test('joins two reasons with "and"', () => {
    expect(describeReasons('BUG_FIXES,SECURITY_VULNERABILITY_FIXES')).toBe(
      'Includes bug fixes and security fixes.'
    );
  });

  test('joins three or more reasons with commas and a trailing "and"', () => {
    expect(
      describeReasons('BUG_FIXES,SECURITY_VULNERABILITY_FIXES,NEW_FEATURES')
    ).toBe('Includes bug fixes, security fixes and new features.');
  });

  test('returns null for no reasons', () => {
    expect(describeReasons()).toBeNull();
    expect(describeReasons('')).toBeNull();
  });
});

describe('summarize', () => {
  test('tallies rows by status and securityFixes independently', () => {
    const rows = [
      { status: STATUS.CURRENT },
      { status: STATUS.CURRENT },
      { status: STATUS.BEHIND, reasons: 'SECURITY_VULNERABILITY_FIXES' },
      { status: STATUS.EOL, reasons: 'SECURITY_VULNERABILITY_FIXES,BUG_FIXES' }
    ];

    expect(summarize(rows)).toEqual({
      [STATUS.CURRENT]: 2,
      [STATUS.BEHIND]: 1,
      [STATUS.EOL]: 1,
      securityFixes: 2
    });
  });

  test('returns all-zero counts for no rows', () => {
    expect(summarize([])).toEqual({
      [STATUS.CURRENT]: 0,
      [STATUS.BEHIND]: 0,
      [STATUS.EOL]: 0,
      securityFixes: 0
    });
  });
});

describe('sortRows', () => {
  const current = { name: 'search-svc', status: STATUS.CURRENT };
  const behind = { name: 'checkout-api', status: STATUS.BEHIND };
  const eol = { name: 'legacy-batch', status: STATUS.EOL };
  const shuffled = [current, eol, behind];

  test('defaults to Status severity order: EOL, then BEHIND, then CURRENT', () => {
    expect(sortRows(shuffled)).toEqual([eol, behind, current]);
    expect(sortRows(shuffled, DEFAULT_SORTING)).toEqual([eol, behind, current]);
  });

  test('reverses Status severity order for direction: desc', () => {
    expect(sortRows(shuffled, { name: 'status', direction: 'desc' })).toEqual([
      current,
      behind,
      eol
    ]);
  });

  test('sorts by name ascending/descending', () => {
    expect(sortRows(shuffled, { name: 'name', direction: 'asc' })).toEqual([
      behind,
      eol,
      current
    ]);
    expect(sortRows(shuffled, { name: 'name', direction: 'desc' })).toEqual([
      current,
      eol,
      behind
    ]);
  });

  test('sorts by language, version, and target (recommendedVersion)', () => {
    const rowA = {
      language: 'java',
      version: '7.4.0',
      recommendedVersion: '8.21.1'
    };
    const rowB = {
      language: 'python',
      version: '9.4.0',
      recommendedVersion: '10.2.0'
    };

    expect(
      sortRows([rowB, rowA], { name: 'language', direction: 'asc' })
    ).toEqual([rowA, rowB]);
    expect(
      sortRows([rowA, rowB], { name: 'version', direction: 'desc' })
    ).toEqual([rowB, rowA]);
    // Lexical, not semver-aware: '1' < '8', so "10.2.0" sorts before "8.21.1".
    expect(
      sortRows([rowA, rowB], { name: 'target', direction: 'asc' })
    ).toEqual([rowB, rowA]);
  });

  test('sorts the account column by accountId when showAccountName is false', () => {
    const rowA = { accountId: 200, tags: { account: ['Zebra Prod'] } };
    const rowB = { accountId: 100, tags: { account: ['Anchor Prod'] } };

    expect(
      sortRows([rowA, rowB], { name: 'account', direction: 'asc' })
    ).toEqual([rowB, rowA]);
  });

  test('sorts the account column by account name when showAccountName is true', () => {
    const rowA = { accountId: 200, tags: { account: ['Zebra Prod'] } };
    const rowB = { accountId: 100, tags: { account: ['Anchor Prod'] } };

    expect(
      sortRows(
        [rowA, rowB],
        { name: 'account', direction: 'asc' },
        {
          showAccountName: true
        }
      )
    ).toEqual([rowB, rowA]);
    expect(
      sortRows(
        [rowB, rowA],
        { name: 'account', direction: 'desc' },
        {
          showAccountName: true
        }
      )
    ).toEqual([rowA, rowB]);
  });

  test('leaves rows unchanged for an unrecognized column', () => {
    expect(sortRows(shuffled, { name: 'unknown', direction: 'asc' })).toBe(
      shuffled
    );
  });

  test('defaults rows to an empty array', () => {
    expect(sortRows()).toEqual([]);
  });
});
