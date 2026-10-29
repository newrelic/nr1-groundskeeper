// The `AgentUpdate.reasons` NRQL event field is a comma-separated string built from
// this enum (see queries/recommendedVersion.js / hooks/useRecommendedVersions.js).
const REASON = {
  BUG_FIXES: 'BUG_FIXES',
  SECURITY_VULNERABILITY_FIXES: 'SECURITY_VULNERABILITY_FIXES',
  NEW_FEATURES: 'NEW_FEATURES'
};

const REASON_LABEL = {
  [REASON.BUG_FIXES]: 'bug fixes',
  [REASON.SECURITY_VULNERABILITY_FIXES]: 'security fixes',
  [REASON.NEW_FEATURES]: 'new features'
};

export { REASON, REASON_LABEL };
