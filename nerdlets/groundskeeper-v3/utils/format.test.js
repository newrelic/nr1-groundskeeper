import { versionAge } from './format';

describe('versionAge', () => {
  const dates = {
    '7.4.0': new Date('2023-01-01T00:00:00Z'),
    '8.21.1': new Date('2024-01-02T00:00:00Z'), // 366 days later
    '8.4.2': new Date('2023-01-08T00:00:00Z'), // 7 days later
    '8.0.0': new Date('2023-03-03T00:00:00Z') // 61 days later
  };

  test('returns null when either version is missing a known release date', () => {
    expect(versionAge('unknown', '8.21.1', dates)).toBeNull();
    expect(versionAge('7.4.0', 'unknown', dates)).toBeNull();
    expect(versionAge('7.4.0', '8.21.1', {})).toBeNull();
  });

  test('returns null when the recommended version is not newer', () => {
    expect(versionAge('8.21.1', '7.4.0', dates)).toBeNull();
    expect(versionAge('7.4.0', '7.4.0', dates)).toBeNull();
  });

  test('formats a gap under a month as days', () => {
    expect(versionAge('7.4.0', '8.4.2', dates)).toBe('7 days old');
  });

  test('formats a gap over a month as months', () => {
    expect(versionAge('7.4.0', '8.0.0', dates)).toBe('over 2 months old');
  });

  test('formats a gap over a year as years', () => {
    expect(versionAge('7.4.0', '8.21.1', dates)).toBe('over 1 year old');
  });
});
