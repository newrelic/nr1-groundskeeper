import { useEffect, useRef, useState } from 'react';
import { useNerdGraphQuery } from 'nr1';
import { NOOP_QUERY, recommendedVersionQuery } from '../queries';

// Looks up "Recommended Version" from the same source nr-groundskeeper-cli uses: the
// `AgentUpdate` NRQL event New Relic agents self-report, rather than a hardcoded semver
// table (see groundskeeper-v2/recommendations.js). As `entities` grows page by page
// (via useApmEntities' fetchMore), this only queries guids we haven't resolved yet --
// re-querying the whole list on every page would make the FACET grow without bound and
// re-fetch data we already have.
const useRecommendedVersions = (entities = []) => {
  const [recommendedVersions, setRecommendedVersions] = useState({});
  const [pendingQuery, setPendingQuery] = useState(null);
  // Ref, not state: we need to read/mutate this synchronously inside the effect below
  // without triggering a re-render or getting stale closures across renders.
  const queriedGuids = useRef(new Set());

  useEffect(() => {
    const unqueried = entities.filter(
      ({ guid }) => guid && !queriedGuids.current.has(guid)
    );
    if (!unqueried.length) return;
    unqueried.forEach(({ guid }) => queriedGuids.current.add(guid));
    // NRQL's `accounts` param needs every account guid in this batch spans, since
    // AgentUpdate events live in each entity's own account.
    const accountIds = [
      ...new Set(unqueried.map(({ accountId }) => accountId).filter(Boolean))
    ];
    const guids = unqueried.map(({ guid }) => guid);
    if (!accountIds.length || !guids.length) return;
    setPendingQuery(recommendedVersionQuery(accountIds, guids));
  }, [entities]);

  // Hooks can't be called conditionally, so on the very first render (before any
  // entities have arrived) we still have to pass useNerdGraphQuery *some* query --
  // see NOOP_QUERY's comment for why that can't just be omitted.
  const { data, error } = useNerdGraphQuery({
    query: pendingQuery || NOOP_QUERY
  });

  useEffect(() => {
    const results = data?.actor?.nrql?.results;
    if (!Array.isArray(results) || !results.length) return;
    setRecommendedVersions(prev => {
      // Bail out (return the same `prev` reference) when nothing actually changed,
      // so React can skip the re-render. Without this, a `data` object that isn't
      // referentially stable across renders for an unchanged query -- which we
      // can't guarantee about useNerdGraphQuery -- would re-set state, which
      // re-renders, which re-runs this effect... forever.
      let changed = false;
      const next = { ...prev };
      // Single-dimension FACET results come back as { facet, recommendedVersion },
      // where `facet` is the guid itself -- matches the CLI's own destructuring.
      results.forEach(({ facet, recommendedVersion }) => {
        if (facet && next[facet] !== recommendedVersion) {
          next[facet] = recommendedVersion;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [data]);

  return { recommendedVersions, error };
};

export default useRecommendedVersions;
