import semver from 'semver';
import { ICON_COLOR } from '../constants';
import { durationBetween } from './format';

const RELEASE_NOTES_BASE = 'https://docs.newrelic.com/';

// One Feed tag per release-note category, so the Feed's chips do the filtering
// the old Security/Bugs/Features tabs used to. `one`/`many` name the notes in
// an entry's title ("1 security fix", "3 bug fixes").
const NOTE_CATEGORIES = [
  {
    field: 'security',
    tag: 'Security',
    color: ICON_COLOR.CRITICAL,
    one: 'security fix',
    many: 'security fixes'
  },
  {
    field: 'bugs',
    tag: 'Bug fix',
    color: ICON_COLOR.WARNING,
    one: 'bug fix',
    many: 'bug fixes'
  },
  {
    field: 'features',
    tag: 'Feature',
    color: ICON_COLOR.INFO,
    one: 'new feature',
    many: 'new features'
  }
];

// Newest first, by semver.coerce() since agent versions aren't always strict
// semver (e.g. dotnet's 4-part versions). A version that doesn't coerce keeps its
// place relative to the others rather than being dropped.
const compareDescending = (a, b) => {
  const coercedA = semver.coerce(a);
  const coercedB = semver.coerce(b);
  return coercedA && coercedB ? semver.compare(coercedB, coercedA) : 0;
};

// `versionDiff` is the comma-separated AgentUpdate.versionDiff string: the
// versions between the agent's own and the recommended one. Split, trim, drop
// empties and duplicates, newest first.
const parseVersionDiff = (versionDiff = '') =>
  [
    ...new Set(
      (versionDiff || '')
        .split(',')
        .map(version => version.trim())
        .filter(Boolean)
    )
  ].sort(compareDescending);

// Feed entries (components/Feed) for one version: one per category that has
// notes, not one per note -- a long upgrade can span dozens of releases with
// several notes each, which as separate entries would bury the history. The
// entry's title counts the notes and its text lists them, one per line. A
// release with no notes, or a version agentReleases doesn't know about at all,
// still gets one entry so the version shows up in the history.
const versionEntries = (version, release) => {
  if (!release) {
    return [
      { key: version, label: version, title: 'No release details available.' }
    ];
  }
  const time = release.date ? release.date.getTime() : undefined;
  const href = release.slug
    ? `${RELEASE_NOTES_BASE}${release.slug}`
    : undefined;
  const groups = NOTE_CATEGORIES.filter(
    ({ field }) => (release[field] || []).length
  ).map(({ field, tag, color, one, many }) => {
    const notes = release[field];
    return {
      key: `${version}:${field}`,
      time,
      label: version,
      title: `${notes.length} ${notes.length === 1 ? one : many}`,
      text: notes.map(note => `• ${note}`).join('\n'),
      tag,
      color,
      href
    };
  });
  return groups.length
    ? groups
    : [
        {
          key: version,
          time,
          label: version,
          title: href ? 'Release notes' : 'No release notes listed.',
          href
        }
      ];
};

// Everything the upgrade-history sidebar needs for one entity: the versions from
// its AgentUpdate.versionDiff (not a semver range over agentReleases -- New
// Relic's own list of what's in between), each joined with agentReleases for its
// date, link and notes, as Feed entries newest first; plus the header's span
// and EOL date.
const buildUpgradeHistory = (entity = {}, releasesForLanguage = {}) => {
  const { version: currentVersion, recommendedVersion, versionDiff } = entity;
  const versions = parseVersionDiff(versionDiff);
  return {
    versions,
    eolDate: releasesForLanguage[currentVersion]?.eolDate || null,
    duration: durationBetween(
      releasesForLanguage[currentVersion]?.date,
      releasesForLanguage[recommendedVersion]?.date
    ),
    entries: versions.flatMap(version =>
      versionEntries(version, releasesForLanguage[version])
    )
  };
};

export { parseVersionDiff, buildUpgradeHistory };
