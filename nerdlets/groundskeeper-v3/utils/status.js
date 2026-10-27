import { REASON, REASON_LABEL, STATUS } from '../constants';
import { versionAge } from './format';

// EOL is checked before BEHIND: a version can be both "the recommended one" and
// past its own EOL date (New Relic keeps recommending it until a newer release
// ships), so EOL needs to win regardless of whether it also equals recommendedVersion.
const rowStatus = ({ version, recommendedVersion, eolDate } = {}) => {
  if (eolDate && Date.now() >= eolDate.getTime()) return STATUS.EOL;
  if (recommendedVersion && version && recommendedVersion !== version) {
    return STATUS.BEHIND;
  }
  return STATUS.CURRENT;
};

// Single place where a normalized entity (utils/entities.js), its looked-up
// recommendedVersion (hooks/useRecommendedVersions.js), its language's release
// history (hooks/useAgentReleases.js), and its AgentUpdate.reasons and
// .versionDiff (also from hooks/useRecommendedVersions.js) come together into one
// row. Table, summary
// tiles, and detail panel all consume this so they can't disagree on a given app's
// status/age.
const enrichEntity = (
  entity,
  recommendedVersion,
  releasesForLanguage = {},
  reasons,
  versionDiff
) => {
  const eolDate = releasesForLanguage[entity.version]?.eolDate;
  const releaseDates = Object.keys(releasesForLanguage).reduce(
    (acc, version) => ({
      ...acc,
      [version]: releasesForLanguage[version].date
    }),
    {}
  );
  const isBehind =
    Boolean(recommendedVersion) && recommendedVersion !== entity.version;
  return {
    ...entity,
    recommendedVersion,
    reasons,
    versionDiff,
    status: rowStatus({
      version: entity.version,
      recommendedVersion,
      eolDate
    }),
    age: isBehind
      ? versionAge(entity.version, recommendedVersion, releaseDates)
      : null
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
// BEHIND (yellow), then CURRENT (green). Plain alphabetical order on the status
// string ("behind" < "current" < "eol") wouldn't match that, hence a dedicated rank.
const STATUS_SEVERITY = {
  [STATUS.EOL]: 0,
  [STATUS.BEHIND]: 1,
  [STATUS.CURRENT]: 2
};

// One comparator per sortable column, keyed by the DataTableHeaderCell `name` it
// belongs to (see components/EntitiesTable.js). Each returns ascending order;
// sortRows() below reverses for `direction: 'desc'`. `account` isn't here -- its
// comparator depends on the Account column's display mode, see accountComparator.
const COLUMN_COMPARATORS = {
  status: (a, b) => STATUS_SEVERITY[a.status] - STATUS_SEVERITY[b.status],
  name: (a, b) => (a.name || '').localeCompare(b.name || ''),
  language: (a, b) => (a.language || '').localeCompare(b.language || ''),
  version: (a, b) => (a.version || '').localeCompare(b.version || ''),
  target: (a, b) =>
    (a.recommendedVersion || '').localeCompare(b.recommendedVersion || '')
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
