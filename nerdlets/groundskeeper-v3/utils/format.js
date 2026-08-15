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

export { versionAge };
