import {
  buildUpgradeHistory,
  latestRelease,
  parseVersionDiff
} from './releases';

const releasesForLanguage = {
  '7.4.0': {
    date: new Date('2024-06-11T00:00:00Z'),
    eolDate: new Date('2026-03-11T00:00:00Z'),
    security: [],
    bugs: [],
    features: [],
    slug: 'java-agent-740'
  },
  '8.0.1': {
    date: new Date('2024-09-20T00:00:00Z'),
    eolDate: null,
    security: ['Fixed permissions on the agent temp directory'],
    bugs: ['Fixed a bug'],
    features: [],
    slug: 'java-agent-801'
  },
  '8.6.0': {
    date: new Date('2025-01-15T00:00:00Z'),
    eolDate: null,
    security: ['Removed logging of query parameters in error traces'],
    bugs: [],
    features: ['Added a new feature'],
    slug: 'java-agent-860'
  },
  '8.21.1': {
    date: new Date('2025-08-02T00:00:00Z'),
    eolDate: null,
    security: [],
    bugs: ['Fixed another bug', 'Fixed yet another bug'],
    features: [],
    slug: 'java-agent-8211'
  }
};

describe('latestRelease', () => {
  test('is the highest version, not the last one listed', () => {
    expect(latestRelease(releasesForLanguage)).toBe('8.21.1');
  });

  test('compares numerically and skips versions it cannot parse', () => {
    expect(
      latestRelease({ '10.2.0': {}, '9.10.0': {}, unknown: {}, ' 6.1.0': {} })
    ).toBe('10.2.0');
  });

  test('is null with no releases', () => {
    expect(latestRelease({})).toBeNull();
    expect(latestRelease()).toBeNull();
  });
});

describe('parseVersionDiff', () => {
  test('splits, trims and sorts newest first', () => {
    expect(parseVersionDiff('8.0.1, 8.21.1,8.6.0')).toEqual([
      '8.21.1',
      '8.6.0',
      '8.0.1'
    ]);
  });

  test('sorts numerically, not as strings', () => {
    expect(parseVersionDiff('9.1.0,10.2.0')).toEqual(['10.2.0', '9.1.0']);
  });

  test('drops empty entries and duplicates', () => {
    expect(parseVersionDiff('8.6.0,, 8.6.0 ,')).toEqual(['8.6.0']);
  });

  test.each([undefined, null, ''])('returns [] for %p', value => {
    expect(parseVersionDiff(value)).toEqual([]);
  });
});

describe('buildUpgradeHistory', () => {
  const entity = {
    version: '7.4.0',
    recommendedVersion: '8.21.1',
    versionDiff: '8.0.1,8.6.0,8.21.1'
  };

  test('takes its versions from versionDiff, with eolDate and duration', () => {
    const history = buildUpgradeHistory(entity, releasesForLanguage);

    expect(history.versions).toEqual(['8.21.1', '8.6.0', '8.0.1']);
    expect(history.eolDate).toEqual(new Date('2026-03-11T00:00:00Z'));
    expect(history.duration).toBe('14 months');
  });

  test('uses versionDiff, not every release in the semver range', () => {
    const history = buildUpgradeHistory(
      { ...entity, versionDiff: '8.21.1' },
      releasesForLanguage
    );

    expect(history.versions).toEqual(['8.21.1']);
    expect(history.entries.map(e => e.label)).toEqual(['8.21.1']);
  });

  test('groups the notes of each release into one tagged entry per category, newest release first', () => {
    const { entries } = buildUpgradeHistory(entity, releasesForLanguage);

    expect(
      entries.map(({ label, tag, title, text }) => [label, tag, title, text])
    ).toEqual([
      [
        '8.21.1',
        'Bug fix',
        '2 bug fixes',
        '• Fixed another bug\n• Fixed yet another bug'
      ],
      [
        '8.6.0',
        'Security',
        '1 security fix',
        '• Removed logging of query parameters in error traces'
      ],
      ['8.6.0', 'Feature', '1 new feature', '• Added a new feature'],
      [
        '8.0.1',
        'Security',
        '1 security fix',
        '• Fixed permissions on the agent temp directory'
      ],
      ['8.0.1', 'Bug fix', '1 bug fix', '• Fixed a bug']
    ]);
  });

  test('gives every entry a unique key, the release time, a color and a release notes link', () => {
    const { entries } = buildUpgradeHistory(entity, releasesForLanguage);

    expect(new Set(entries.map(e => e.key)).size).toBe(entries.length);
    expect(entries[0]).toMatchObject({
      key: '8.21.1:bugs',
      time: new Date('2025-08-02T00:00:00Z').getTime(),
      href: 'https://docs.newrelic.com/java-agent-8211'
    });
    entries.forEach(e => expect(e.color).toEqual(expect.any(String)));
  });

  test('shows a version missing from agentReleases without details', () => {
    const { entries } = buildUpgradeHistory(
      { ...entity, versionDiff: '8.22.0,8.21.1' },
      releasesForLanguage
    );

    expect(entries[0]).toEqual({
      key: '8.22.0',
      label: '8.22.0',
      title: 'No release details available.'
    });
  });

  test('still lists a release that has no notes, linking to it', () => {
    const { entries } = buildUpgradeHistory(
      { version: '7.0.0', recommendedVersion: '7.4.0', versionDiff: '7.4.0' },
      releasesForLanguage
    );

    expect(entries).toEqual([
      {
        key: '7.4.0',
        time: new Date('2024-06-11T00:00:00Z').getTime(),
        label: '7.4.0',
        title: 'Release notes',
        href: 'https://docs.newrelic.com/java-agent-740'
      }
    ]);
  });

  test.each([undefined, ''])(
    'has no versions or entries when versionDiff is %p',
    versionDiff => {
      const history = buildUpgradeHistory(
        { ...entity, versionDiff },
        releasesForLanguage
      );

      expect(history.versions).toEqual([]);
      expect(history.entries).toEqual([]);
    }
  );

  test('handles no release history for the language', () => {
    const history = buildUpgradeHistory(entity);

    expect(history.versions).toEqual(['8.21.1', '8.6.0', '8.0.1']);
    expect(history.eolDate).toBeNull();
    expect(history.duration).toBeNull();
    expect(history.entries.map(e => e.title)).toEqual([
      'No release details available.',
      'No release details available.',
      'No release details available.'
    ]);
  });
});
