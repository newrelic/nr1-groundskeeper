const MS_IN_DAY = 1000 * 60 * 60 * 24;

// Ported from groundskeeper-v2/recommendations.js howOld(), fixing its division-precedence bug
// (the original did `Math.ceil(recVer - curVer) / MS_IN_DAY`, dividing an already-rounded
// millisecond difference by MS_IN_DAY instead of converting to days first).
// `releaseDates` is a version -> Date map for one language (see utils/status.js enrichEntity).
const versionAge = (currentVersion, recommendedVersion, releaseDates = {}) => {
  const recDate = releaseDates[recommendedVersion];
  const curDate = releaseDates[currentVersion];
  if (!recDate || !curDate) return null;
  const daysOld = Math.ceil((recDate - curDate) / MS_IN_DAY);
  if (!daysOld || daysOld < 0) return null;
  if (daysOld > 365) {
    const years = Math.trunc(daysOld / 365);
    return `over ${years} year${years > 1 ? 's' : ''} old`;
  }
  if (daysOld > 30) {
    const months = Math.trunc(daysOld / 30);
    return `over ${months} month${months > 1 ? 's' : ''} old`;
  }
  return `${daysOld} day${daysOld > 1 ? 's' : ''} old`;
};

// Plain "N days/months/years" between two release dates, for the upgrade path
// modal's header meta line (e.g. "31 releases · 14 months · EOL ..."). Unlike
// versionAge() above, this has no "over ... old" phrasing -- the modal states the
// span directly rather than describing how stale the current version is. Stays in
// months up to 2 years (24 months) before switching to years, matching how the
// modal's own mock phrases a ~14-month span as "14 months", not "1 year".
const durationBetween = (fromDate, toDate) => {
  if (!fromDate || !toDate) return null;
  const days = Math.round((toDate - fromDate) / MS_IN_DAY);
  if (days < 0) return null;
  if (days < 30) return `${days} day${days === 1 ? '' : 's'}`;
  const months = Math.round(days / 30);
  if (months < 24) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? '' : 's'}`;
};

// Anchored release Dates (see useAgentReleases.js's parseDate) are UTC midnight,
// so slicing the ISO string gives the calendar date without any timezone drift.
const formatISODate = date => (date ? date.toISOString().slice(0, 10) : null);

export { versionAge, durationBetween, formatISODate };
