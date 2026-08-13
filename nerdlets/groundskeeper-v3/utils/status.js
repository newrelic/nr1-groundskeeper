import { STATUS } from '../constants';
import { versionAge } from './format';

// NOTE: CVE detection is not implemented yet, so rowStatus never returns STATUS.CVE
// and summarize() always reports 0 for it. That's the next step, not this one.
//
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
// recommendedVersion (hooks/useRecommendedVersions.js), and its language's release
// history (hooks/useAgentReleases.js) come together into one row. Table, summary
// tiles, and detail panel all consume this so they can't disagree on a given app's
// status/age.
const enrichEntity = (entity, recommendedVersion, releasesForLanguage = {}) => {
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

// Tallies enriched rows into the counts SummaryTiles renders.
const summarize = (rows = []) =>
  rows.reduce(
    (acc, { status }) => ({ ...acc, [status]: (acc[status] || 0) + 1 }),
    {
      [STATUS.CURRENT]: 0,
      [STATUS.BEHIND]: 0,
      [STATUS.EOL]: 0,
      [STATUS.CVE]: 0
    }
  );

export { rowStatus, enrichEntity, summarize };
