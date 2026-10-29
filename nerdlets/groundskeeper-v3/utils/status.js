import { LOOKUP, REASON, REASON_LABEL, STATUS } from '../constants';
import { versionAge } from './format';
import { latestRelease } from './releases';
import { isBehind, versionComparator } from './versions';

// EOL is checked before BEHIND: a version can be both "the recommended one" and
// past its own EOL date (New Relic keeps recommending it until a newer release
// ships), so EOL needs to win regardless of whether it also equals recommendedVersion.
// While the AgentUpdate lookup is still in flight (`checking`) the row is
// CHECKING, unless it's already known to be EOL. No recommendation (AgentUpdate
// sent nothing) counts as Current; rowNotes() below adds a note when there's a
// newer agent release.
const rowStatus = ({ version, recommendedVersion, eolDate, checking } = {}) => {
  if (eolDate && Date.now() >= eolDate.getTime()) return STATUS.EOL;
  if (checking) return STATUS.CHECKING;
  if (isBehind(version, recommendedVersion)) return STATUS.BEHIND;
  return STATUS.CURRENT;
};

const LOOKUP_FAILED_NOTE =
  "Couldn't check for a recommended version. Reload the app to try again.";
const NOT_REPORTING_NOTE =
  "This app hasn't reported recently, so its agent couldn't be checked.";
const NO_RECOMMENDATION_NOTE =
  "A recommended version wasn't found, which usually means newer agents don't support this app's runtime.";

// Notes for a row, as plain sentences, when AgentUpdate reported no
// recommendation. The app stays Current either way. Only an app that has
// connected recently gets AgentUpdate events, and then only on a runtime newer
// agents support, so: a failed lookup or an app that isn't reporting says so;
// otherwise, if the app isn't on the newest agent release, the likely reason is
// its runtime. Either way the newest release is named, but not as a
// recommendation. Nothing is noted while the lookup is still in flight.
const rowNotes = (
  { version, reporting },
  recommendedVersion,
  releasesForLanguage,
  lookup
) => {
  if (recommendedVersion || lookup === LOOKUP.CHECKING) return [];
  let reason = NO_RECOMMENDATION_NOTE;
  if (lookup === LOOKUP.FAILED) reason = LOOKUP_FAILED_NOTE;
  else if (reporting === false) reason = NOT_REPORTING_NOTE;
  const latest = latestRelease(releasesForLanguage);
  if (!isBehind(version, latest)) {
    return reason === NO_RECOMMENDATION_NOTE ? [] : [reason];
  }
  return [reason, `The newest agent release is ${latest}.`];
};

// Single place where a normalized entity (utils/entities.js), its looked-up
// recommendedVersion (hooks/useRecommendedVersions.js), its language's release
// history (hooks/useAgentReleases.js), and its AgentUpdate.reasons and
// .versionDiff and lookup state (also from hooks/useRecommendedVersions.js)
// come together into one row. Table, summary
// tiles, and detail panel all consume this so they can't disagree on a given app's
// status/age.
const enrichEntity = (
  entity,
  recommendedVersion,
  releasesForLanguage = {},
  reasons,
  versionDiff,
  lookup
) => {
  const eolDate = releasesForLanguage[entity.version]?.eolDate;
  const releaseDates = Object.keys(releasesForLanguage).reduce(
    (acc, version) => ({
      ...acc,
      [version]: releasesForLanguage[version].date
    }),
    {}
  );
  const behind = isBehind(entity.version, recommendedVersion);
  return {
    ...entity,
    recommendedVersion,
    reasons,
    versionDiff,
    status: rowStatus({
      version: entity.version,
      recommendedVersion,
      eolDate,
      checking: lookup === LOOKUP.CHECKING
    }),
    age: behind
      ? versionAge(entity.version, recommendedVersion, releaseDates)
      : null,
    notes: rowNotes(entity, recommendedVersion, releasesForLanguage, lookup)
  };
};

// `reasons` is the comma-separated AgentUpdate.reasons string (see
// constants/reasons.js) -- split, trim, and drop anything empty.
const parseReasons = (reasons = '') =>
  reasons
    .split(',')
    .map(reason => reason.trim())
    .filter(Boolean);

const hasSecurityFix = reasons =>
  parseReasons(reasons).includes(REASON.SECURITY_VULNERABILITY_FIXES);

// Turns an AgentUpdate.reasons string into the sentence the Recommended Version
// cell's tooltip shows (components/RecommendedVersion.js), e.g. "Includes security fixes
// and bug fixes." Returns null when there's nothing to say (no reasons, or reasons
// this UI doesn't have a label for).
const describeReasons = reasons => {
  const labels = parseReasons(reasons)
    .map(reason => REASON_LABEL[reason])
    .filter(Boolean);
  if (!labels.length) return null;
  if (labels.length === 1) return `Includes ${labels[0]}.`;
  const [last, ...rest] = labels.slice().reverse();
  return `Includes ${rest.reverse().join(', ')} and ${last}.`;
};

// Tallies enriched rows into the counts SummaryTiles renders. `securityFixes` is
// independent of `status` (a row can be BEHIND or EOL *and* have a security fix in
// its reasons), so it's tallied separately rather than folded into the STATUS keys.
const summarize = (rows = []) =>
  rows.reduce(
    (acc, { status, reasons }) => ({
      ...acc,
      [status]: (acc[status] || 0) + 1,
      securityFixes: acc.securityFixes + (hasSecurityFix(reasons) ? 1 : 0)
    }),
    {
      [STATUS.CURRENT]: 0,
      [STATUS.BEHIND]: 0,
      [STATUS.EOL]: 0,
      securityFixes: 0
    }
  );

// Severity order for the Status column's default sort -- EOL (red) first, then
// BEHIND (yellow), then CURRENT (green), then CHECKING (not known yet). Plain
// alphabetical order on the status string ("behind" < "current" < "eol")
// wouldn't match that, hence a dedicated rank.
const STATUS_SEVERITY = {
  [STATUS.EOL]: 0,
  [STATUS.BEHIND]: 1,
  [STATUS.CURRENT]: 2,
  [STATUS.CHECKING]: 3
};

// One comparator per sortable column, keyed by the DataTableHeaderCell `name` it
// belongs to (see components/EntitiesTable.js). Each returns ascending order;
// sortRows() below reverses for `direction: 'desc'`. `account` isn't here -- its
// comparator depends on the Account column's display mode, see accountComparator.
const COLUMN_COMPARATORS = {
  status: (a, b) => STATUS_SEVERITY[a.status] - STATUS_SEVERITY[b.status],
  name: (a, b) => (a.name || '').localeCompare(b.name || ''),
  language: (a, b) => (a.language || '').localeCompare(b.language || ''),
  version: (a, b) => versionComparator(a.version, b.version),
  target: (a, b) =>
    versionComparator(a.recommendedVersion, b.recommendedVersion)
};

// The Account column shows either accountId (numeric) or the account name
// (tags.account[0], alphabetical) depending on EntitiesTable's "Show account name"
// toggle -- sorting follows whichever of the two is currently displayed.
const accountComparator = showAccountName =>
  showAccountName
    ? (a, b) =>
        (a.tags?.account?.[0] || '').localeCompare(b.tags?.account?.[0] || '')
    : (a, b) => (a.accountId || 0) - (b.accountId || 0);

// Default: sorted by Status severity, ascending -- EOL, then BEHIND, then CURRENT.
const DEFAULT_SORTING = { name: 'status', direction: 'asc' };

// `sorting` matches nr1 DataTable's controlled-sorting shape: { name, direction }.
// An unrecognized column name (or no sorting at all) leaves `rows` as-is.
// `showAccountName` only matters when sorting.name is 'account' -- see
// accountComparator above.
const sortRows = (
  rows = [],
  sorting = DEFAULT_SORTING,
  { showAccountName = false } = {}
) => {
  const compare =
    sorting?.name === 'account'
      ? accountComparator(showAccountName)
      : COLUMN_COMPARATORS[sorting?.name];
  if (!compare) return rows;
  const sorted = [...rows].sort(compare);
  return sorting.direction === 'desc' ? sorted.reverse() : sorted;
};

export {
  rowStatus,
  enrichEntity,
  parseReasons,
  hasSecurityFix,
  describeReasons,
  summarize,
  DEFAULT_SORTING,
  sortRows
};
