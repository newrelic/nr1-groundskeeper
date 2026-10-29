// Agent versions aren't strict semver: dotnet and PHP have 4-part versions
// (10.30.0.1), and the same version can be written with or without trailing zeros
// (8.1.0 vs 8.1.0.0). So versions are compared as their leading run of
// dot-separated numbers, with missing parts read as 0. Anything after that run
// (a pre-release label, a build suffix) is ignored. A version with no number in it
// at all can't be parsed.
const parseVersion = version => {
  const match = String(version ?? '').match(/\d+(?:\.\d+)*/);
  return match ? match[0].split('.').map(Number) : null;
};

// Negative when a is older than b, positive when it's newer, 0 when they're the
// same version. null when either can't be parsed, so callers pick their own
// fallback.
const compareVersions = (a, b) => {
  const partsA = parseVersion(a);
  const partsB = parseVersion(b);
  if (!partsA || !partsB) return null;
  const length = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < length; i++) {
    const diff = (partsA[i] || 0) - (partsB[i] || 0);
    if (diff) return diff;
  }
  return 0;
};

// Ascending comparator for sorting. Versions that can't be parsed (including
// missing ones) sort after the ones that can, alphabetically among themselves.
const versionComparator = (a, b) => {
  const compared = compareVersions(a, b);
  if (compared !== null) return compared;
  const parsedA = Boolean(parseVersion(a));
  const parsedB = Boolean(parseVersion(b));
  if (parsedA !== parsedB) return parsedA ? -1 : 1;
  return (a || '').localeCompare(b || '');
};

// The one "Behind" rule: the agent is running an older version than the
// recommended one. Being ahead of the recommendation, or on the same version
// written differently, isn't behind. With no recommendation there's nothing to be
// behind. When either version can't be parsed, any difference counts as behind.
const isBehind = (version, recommendedVersion) => {
  if (!version || !recommendedVersion) return false;
  const compared = compareVersions(version, recommendedVersion);
  return compared === null ? version !== recommendedVersion : compared < 0;
};

export { compareVersions, versionComparator, isBehind };
