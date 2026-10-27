// Ported from nr-groundskeeper-cli/bin/queries.js agentUpdates(), generalized to
// query across every account represented in the current batch of entities at once
// (the CLI only ever deals with one account, passed via its -a flag).
//
// `AgentUpdate` is an event New Relic agents themselves report; `recommendedVersion`
// is New Relic's own answer to "what should this agent be running", which is why we
// use this instead of re-deriving it from semver tables like groundskeeper-v2 does.
// `reasons` is a comma-separated string (see constants/reasons.js) explaining why
// that version is recommended -- utils/status.js's hasSecurityFix() reads it to
// drive the Security fixes KPI and the table's Target column. `versionDiff` is a
// comma-separated list of the versions between the agent's own and the
// recommended one -- the upgrade-history sidebar is built from it
// (utils/releases.js buildUpgradeHistory()).
//
// NRQL's `entity.guid IN (...)` clause has a limit on how many values it accepts
// (~25), so a batch of guids larger than that can't go in a single `nrql(...)`
// field -- it's chunked into multiple aliased ("named") `nrql` fields in one
// GraphQL request instead (`nrql0`, `nrql1`, ...), each with its own IN clause.
const GUIDS_PER_QUERY = 25;

// Always returns at least one (possibly empty) chunk, so callers -- including a
// zero-guid call -- get at least one aliased field back.
const chunk = (items, size) =>
  items.length
    ? items.reduce((chunks, item, index) => {
        const chunkIndex = Math.floor(index / size);
        (chunks[chunkIndex] = chunks[chunkIndex] || []).push(item);
        return chunks;
      }, [])
    : [[]];

const agentUpdateNrql = (accountIds, guids) => `nrql(
      accounts: [${accountIds.join(', ')}]
      query: "FROM AgentUpdate SELECT latest(recommendedVersion) AS recommendedVersion, latest(reasons) AS reasons, latest(versionDiff) AS versionDiff SINCE 7 days ago WHERE entity.guid IN ('${guids.join(
        "', '"
      )}') FACET entity.guid LIMIT MAX"
    ) {
      results
    }`;

const recommendedVersionQuery = (accountIds = [], guids = []) => `
{
  actor {
    ${chunk(guids, GUIDS_PER_QUERY)
      .map(
        (guidChunk, index) =>
          `nrql${index}: ${agentUpdateNrql(accountIds, guidChunk)}`
      )
      .join('\n    ')}
  }
}
`;

// useNerdGraphQuery expects a real query string on every render. Before the first
// batch of entities has loaded there's nothing to look up yet, but we still have to
// pass *something* -- an empty/missing `query` crashes the hook internally trying to
// read `.definitions` off of it. This is a harmless, always-valid stand-in for that gap.
const NOOP_QUERY = '{ actor { user { name } } }';

export { GUIDS_PER_QUERY, recommendedVersionQuery, NOOP_QUERY };
