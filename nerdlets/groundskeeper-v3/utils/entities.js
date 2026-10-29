// Flattens a raw ApmApplicationEntityOutline (as shaped by
// hooks/useApmEntities.js's entity fragment extension) into the plain fields the
// rest of v3 works with.
//
// runningAgentVersions/tags use `|| {}`/`|| []` below, NOT a `= {}`/`= []` default
// in the destructure -- a destructuring default only kicks in for `undefined`, but
// GraphQL nullable fields with nothing to report (an app with no running agent
// versions, or no tags) come back as an explicit `null`, which a destructuring
// default does not catch and would throw straight through.
const normalizeEntity = ({
  guid,
  name,
  accountId,
  language,
  reporting,
  runningAgentVersions,
  tags
} = {}) => {
  const { maxVersion, minVersion } = runningAgentVersions || {};
  return {
    guid,
    name,
    accountId,
    language,
    reporting,
    // An app can report a min/max agent version range across its instances; fall
    // back to max when there's no min, matching groundskeeper-v2's same convention.
    version: minVersion || maxVersion || null,
    // Tags arrive as [{ key, values }], but utils/filters.js wants { [key]: values }
    // so it can look values up by key directly.
    tags: (tags || []).reduce(
      (acc, { key, values } = {}) => (key ? { ...acc, [key]: values } : acc),
      {}
    )
  };
};

export { normalizeEntity };
