import { useEffect, useRef, useState } from 'react';
import { useNerdGraphQuery } from 'nr1';
import { NOOP_QUERY, recommendedVersionQuery } from '../queries';

// A setState updater merging one field of the FACET results into a guid -> value
// map. It bails out (returns the same `prev` reference) when nothing actually
// changed, so React can skip the re-render. Without this, a `data` object that
// isn't referentially stable across renders for an unchanged query -- which we
// can't guarantee about useNerdGraphQuery -- would re-set state, which
// re-renders, which re-runs the effect below... forever.
// Single-dimension FACET results come back as { facet, recommendedVersion,
// reasons, versionDiff }, where `facet` is the guid itself -- matches the CLI's
// own destructuring.
const mergeFacetField = (results, field) => prev => {
  let changed = false;
  const next = { ...prev };
  results.forEach(({ facet, [field]: value }) => {
    if (facet && next[facet] !== value) {
      next[facet] = value;
      changed = true;
    }
  });
  return changed ? next : prev;
};

// Looks up "Recommended Version" (and why it's recommended, via `reasons`, and the
// versions in between, via `versionDiff`) from the
// same source nr-groundskeeper-cli uses: the `AgentUpdate` NRQL event New Relic
// agents self-report, rather than a hardcoded semver table (see
// groundskeeper-v2/recommendations.js). As `entities` grows page by page (via
// useApmEntities' fetchMore), this only queries guids we haven't resolved yet --
// re-querying the whole list on every page would make the FACET grow without bound and
// re-fetch data we already have.
const useRecommendedVersions = (entities = []) => {
  const [recommendedVersions, setRecommendedVersions] = useState({});
  const [reasons, setReasons] = useState({});
  const [versionDiffs, setVersionDiffs] = useState({});
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
    // A guid batch larger than queries/recommendedVersion.js's GUIDS_PER_QUERY
    // comes back as multiple aliased fields (nrql0, nrql1, ...) rather than a
    // single `nrql` field -- gather results across all of them.
    const results = Object.keys(data?.actor || {})
      .filter(key => key.startsWith('nrql'))
      .flatMap(key => data.actor[key]?.results || []);
    if (!results.length) return;
    setRecommendedVersions(mergeFacetField(results, 'recommendedVersion'));
    setReasons(mergeFacetField(results, 'reasons'));
    setVersionDiffs(mergeFacetField(results, 'versionDiff'));
  }, [data]);

  return { recommendedVersions, reasons, versionDiffs, error };
};

export default useRecommendedVersions;
