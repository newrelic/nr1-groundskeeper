// Fetches AgentUpdate data (recommendedVersion, reasons, versionDiff) for one
// batch of entities. Shared by the table's lookups (hooks/useRecommendedVersions.js)
// and, later, the CSV export (CSV-1/CSV-2), so it takes the transport as a
// `runQuery(query)` function instead of importing nr1: the nerdlet passes
// NerdGraphQuery.query, the CLI a fetch to the NerdGraph API. Imported straight
// from queries/recommendedVersion.js, since queries/index.js pulls in nr1.
import { recommendedVersionQuery } from '../queries/recommendedVersion';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// A guid batch larger than GUIDS_PER_QUERY comes back as several aliased fields
// (nrql0, nrql1, ...), so results are gathered across all of them into
// guid -> { recommendedVersion, reasons, versionDiff }. Guids with no AgentUpdate
// event in the window simply aren't in the results.
const parseAgentUpdates = data =>
  Object.keys(data?.actor || {})
    .filter(key => key.startsWith('nrql'))
    .flatMap(key => data.actor[key]?.results || [])
    .reduce(
      (acc, { facet, recommendedVersion, reasons, versionDiff }) =>
        facet
          ? { ...acc, [facet]: { recommendedVersion, reasons, versionDiff } }
          : acc,
      {}
    );

// NerdGraphQuery.query resolves with { data, error } rather than rejecting, and
// a fetch-based runQuery may return GraphQL's { data, errors } -- either counts
// as a failed attempt.
const queryError = ({ error, errors } = {}) => error || errors?.[0] || null;

// Runs the batch, retrying a failed attempt after RETRY_DELAY_MS, then twice
// that, and so on. Resolves with the parsed results, or rejects with the last
// error once every attempt has failed. `wait` is only there so tests don't
// have to sit through the delays.
const fetchAgentUpdates = async (
  runQuery,
  { accountIds = [], guids = [] } = {},
  { attempts = RETRY_ATTEMPTS, wait = sleep } = {}
) => {
  const query = recommendedVersionQuery(accountIds, guids);
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await runQuery(query);
      const error = queryError(response);
      if (error) throw error;
      return parseAgentUpdates(response?.data);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(RETRY_DELAY_MS * attempt);
    }
  }
  throw lastError;
};

export { fetchAgentUpdates, parseAgentUpdates };
