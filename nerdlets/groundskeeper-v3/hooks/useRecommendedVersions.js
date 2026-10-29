import { useEffect, useMemo, useRef, useState } from 'react';
import { NerdGraphQuery } from 'nr1';
import { LOOKUP } from '../constants';
import { fetchAgentUpdates } from '../utils/agentUpdates';

const runQuery = query => NerdGraphQuery.query({ query });

// Sets every guid in `guids` to `value` in a guid -> value map.
const setAll = (guids, value) => prev =>
  guids.reduce((next, guid) => ({ ...next, [guid]: value }), prev);

// Looks up "Recommended Version" (and why it's recommended, via `reasons`, and the
// versions in between, via `versionDiff`) from the `AgentUpdate` NRQL event New
// Relic agents self-report (see utils/agentUpdates.js). As `entities` grows page
// by page (via useApmEntities' fetchMore), each page's new guids go out as their
// own request, so a fast scroll can have several in flight at once; each one's
// results are merged in as it arrives. `lookups` says where each guid stands
// (constants/lookup.js): CHECKING while its request is out, DONE once it's
// answered (whether or not there was an event), FAILED after every retry
// failed. A failed guid is requested again with the next page that loads.
// `options.wait` is passed to fetchAgentUpdates, for tests.
const useRecommendedVersions = (entities = [], options = {}) => {
  const [agentUpdates, setAgentUpdates] = useState({});
  const [lookups, setLookups] = useState({});
  // Ref, not state: read and changed synchronously in the effect below, without
  // re-rendering. Holds guids that are in flight or done, not failed ones.
  const requestedGuids = useRef(new Set());
  const mounted = useRef(true);
  const { wait } = options;

  useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );

  useEffect(() => {
    const batch = entities.filter(
      ({ guid, accountId }) =>
        guid && accountId && !requestedGuids.current.has(guid)
    );
    if (!batch.length) return;
    const guids = batch.map(({ guid }) => guid);
    guids.forEach(guid => requestedGuids.current.add(guid));
    // NRQL's `accounts` param needs every account this batch spans, since
    // AgentUpdate events live in each entity's own account.
    const accountIds = [...new Set(batch.map(({ accountId }) => accountId))];
    setLookups(setAll(guids, LOOKUP.CHECKING));

    fetchAgentUpdates(runQuery, { accountIds, guids }, { wait })
      .then(results => {
        if (!mounted.current) return;
        setAgentUpdates(prev => ({ ...prev, ...results }));
        setLookups(setAll(guids, LOOKUP.DONE));
      })
      .catch(() => {
        if (!mounted.current) return;
        guids.forEach(guid => requestedGuids.current.delete(guid));
        setLookups(setAll(guids, LOOKUP.FAILED));
      });
  }, [entities, wait]);

  // Kept as three guid -> value maps, the shape enrichEntity's callers use.
  const { recommendedVersions, reasons, versionDiffs } = useMemo(
    () =>
      Object.keys(agentUpdates).reduce(
        (acc, guid) => {
          acc.recommendedVersions[guid] = agentUpdates[guid].recommendedVersion;
          acc.reasons[guid] = agentUpdates[guid].reasons;
          acc.versionDiffs[guid] = agentUpdates[guid].versionDiff;
          return acc;
        },
        { recommendedVersions: {}, reasons: {}, versionDiffs: {} }
      ),
    [agentUpdates]
  );

  return { recommendedVersions, reasons, versionDiffs, lookups };
};

export default useRecommendedVersions;
