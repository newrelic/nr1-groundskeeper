import { compareVersions, isBehind, versionComparator } from './versions';

describe('compareVersions', () => {
  test('compares numerically, not as strings', () => {
    expect(compareVersions('9.1.0', '10.2.0')).toBeLessThan(0);
    expect(compareVersions('10.2.0', '9.1.0')).toBeGreaterThan(0);
    expect(compareVersions('8.9.0', '8.10.0')).toBeLessThan(0);
  });

  test('treats missing trailing parts as 0', () => {
    expect(compareVersions('8.1.0', '8.1.0.0')).toBe(0);
    expect(compareVersions('8.1', '8.1.0')).toBe(0);
  });

  test('compares a 4th part (dotnet, PHP)', () => {
    expect(compareVersions('10.30.0.1', '10.30.0.2')).toBeLessThan(0);
  });

  test('ignores a leading v and anything after the numbers', () => {
    expect(compareVersions('v8.1.0', '8.1.0')).toBe(0);
    expect(compareVersions('1.2.3-beta.4', '1.2.3')).toBe(0);
  });

  test('is null when either version has no number in it', () => {
    expect(compareVersions('unknown', '8.1.0')).toBeNull();
    expect(compareVersions('8.1.0', undefined)).toBeNull();
    expect(compareVersions('', '')).toBeNull();
  });
});

describe('versionComparator', () => {
  test('sorts versions numerically', () => {
    expect(['10.2.0', '9.1.0', '9.10.0'].sort(versionComparator)).toEqual([
      '9.1.0',
      '9.10.0',
      '10.2.0'
    ]);
  });

  test('sorts versions it cannot parse after the ones it can', () => {
    expect(
      ['unknown', '10.2.0', undefined, '9.1.0'].sort(versionComparator)
    ).toEqual(['9.1.0', '10.2.0', 'unknown', undefined]);
  });
});

describe('isBehind', () => {
  test('is true when running an older version', () => {
    expect(isBehind('9.1.0', '10.2.0')).toBe(true);
  });

  test('is false when running the recommended version', () => {
    expect(isBehind('8.1.0', '8.1.0')).toBe(false);
  });

  test('is false for the same version written differently', () => {
    expect(isBehind('8.1.0.0', '8.1.0')).toBe(false);
  });

  test('is false when ahead of the recommendation', () => {
    expect(isBehind('8.2.0', '8.1.0')).toBe(false);
  });

  test('is false with no recommendation or no version', () => {
    expect(isBehind('8.1.0', undefined)).toBe(false);
    expect(isBehind(undefined, '8.1.0')).toBe(false);
  });

  test('falls back to inequality when a version cannot be parsed', () => {
    expect(isBehind('unknown', '8.1.0')).toBe(true);
    expect(isBehind('unknown', 'unknown')).toBe(false);
  });
});
