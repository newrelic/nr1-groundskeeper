// Ported from nr-groundskeeper-cli/bin/queries.js agentUpdates(), generalized to
// query across every account represented in the current batch of entities at once
// (the CLI only ever deals with one account, passed via its -a flag).
//
// `AgentUpdate` is an event New Relic agents themselves report; `recommendedVersion`
// is New Relic's own answer to "what should this agent be running", which is why we
// use this instead of re-deriving it from semver tables like groundskeeper-v2 does.
const recommendedVersionQuery = (accountIds = [], guids = []) => `
{
  actor {
    nrql(
      accounts: [${accountIds.join(', ')}]
      query: "FROM AgentUpdate SELECT latest(recommendedVersion) AS recommendedVersion SINCE 4 days ago WHERE entity.guid IN ('${guids.join(
        "', '"
      )}') FACET entity.guid LIMIT MAX"
    ) {
      results
    }
  }
}
`;

// useNerdGraphQuery expects a real query string on every render. Before the first
// batch of entities has loaded there's nothing to look up yet, but we still have to
// pass *something* -- an empty/missing `query` crashes the hook internally trying to
// read `.definitions` off of it. This is a harmless, always-valid stand-in for that gap.
const NOOP_QUERY = '{ actor { user { name } } }';

export { recommendedVersionQuery, NOOP_QUERY };
