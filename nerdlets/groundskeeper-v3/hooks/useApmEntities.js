import { useEffect, useMemo } from 'react';
import { ngql, useEntitySearchQuery } from 'nr1';
import { normalizeEntity } from '../utils';

// language/accountId/runningAgentVersions aren't in useEntitySearchQuery's default
// entity fields, same gap groundskeeper-v2/hooks/useFetchEntities.js works around.
const ENTITY_FRAGMENT_EXTENSION = ngql`
  fragment EntityFragmentExtension on ApmApplicationEntityOutline {
    accountId
    language
    reporting
    runningAgentVersions {
      maxVersion
      minVersion
    }
  }
`;

// Loads the APM applications the table shows, strictly domain APM + type APPLICATION
// (not just any APM-domain entity) per the v3 scope. `filters` is the NRQL-like
// string FilterBar selections get converted into (see utils/filters.js).
const useApmEntities = ({ filters } = {}) => {
  const { data, error, loading, fetchMore } = useEntitySearchQuery({
    entityDomain: 'APM',
    entityType: 'APPLICATION',
    entityFragmentExtension: ENTITY_FRAGMENT_EXTENSION,
    includeTags: true,
    // Omit the key entirely rather than pass '' -- an empty filters string is
    // harmless either way, but this keeps the query args honest about intent.
    ...(filters ? { filters } : {})
  });
  // `|| {}`, not a destructuring default -- `data` can come back as an explicit
  // `null` while loading, and a destructuring default only catches `undefined`.
  const { count = 0, entities: rawEntities = [] } = data || {};

  useEffect(() => {
    /* eslint-disable-next-line no-console */
    if (error) console.error('Error fetching APM entities:', error);
  }, [error]);

  // useEntitySearchQuery's `entities` is already cumulative across fetchMore pages,
  // so this stays in lockstep with `count` growing as more pages load.
  const entities = useMemo(() => rawEntities.map(normalizeEntity), [
    rawEntities
  ]);

  return { count, entities, error, loading, fetchMore };
};

export default useApmEntities;
