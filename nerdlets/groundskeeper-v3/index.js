import React, { useEffect, useMemo, useState } from 'react';

import { FilterBar } from '@newrelic/nr-labs-components';

import {
  DetailPanel,
  EntitiesTable,
  ErrorBoundary,
  Header,
  SummaryTiles
} from './components';
import {
  useAgentReleases,
  useApmEntities,
  useRecommendedVersions
} from './hooks';
import {
  enrichEntity,
  filtersArrayToNrql,
  formatSyncTime,
  keyValuesFromEntities,
  summarize
} from './utils';

const DEFAULT_FILTER_OPTIONS = [{ option: 'name', type: 'string', values: [] }];

// Everything with real logic lives in this inner component (not the default export
// below) so that ErrorBoundary -- which can only catch errors thrown by its children,
// not by itself -- actually sits *above* the hooks that can throw (e.g. a bad
// GraphQL/NRQL response) instead of alongside them.
const GroundskeeperV3Content = () => {
  const [entitiesFilters, setEntitiesFilters] = useState([]);
  const [filterOptions, setFilterOptions] = useState(DEFAULT_FILTER_OPTIONS);
  const [selectedGuid, setSelectedGuid] = useState(null);

  const filters = useMemo(() => filtersArrayToNrql(entitiesFilters), [
    entitiesFilters
  ]);

  const { count, entities, fetchMore } = useApmEntities({ filters });
  const { releases } = useAgentReleases();
  const { recommendedVersions } = useRecommendedVersions(entities);

  // Rebuild the FilterBar's option list (language + tags) as new entities page in,
  // merging into whatever the user has already picked rather than replacing it.
  useEffect(() => {
    setFilterOptions(existing => keyValuesFromEntities(entities, existing));
  }, [entities]);

  // One combinator (enrichEntity) so the table, the summary tiles, and the detail
  // panel all agree on the same recommendedVersion/status/age for a given row.
  const rows = useMemo(
    () =>
      entities.map(entity =>
        enrichEntity(
          entity,
          recommendedVersions[entity.guid],
          releases[entity.language]
        )
      ),
    [entities, recommendedVersions, releases]
  );

  const counts = useMemo(() => summarize(rows), [rows]);

  const selectedEntity = useMemo(
    () => rows.find(({ guid }) => guid === selectedGuid) || null,
    [rows, selectedGuid]
  );

  const syncedAt = useMemo(() => formatSyncTime(), []);

  return (
    <div className="groundskeeper-v3">
      <Header count={count} syncedAt={syncedAt} />
      <div className="groundskeeper-v3__filters">
        <FilterBar options={filterOptions} onChange={setEntitiesFilters} />
      </div>
      <SummaryTiles counts={counts} />
      <div className="groundskeeper-v3__content">
        <EntitiesTable
          count={count}
          fetchMore={fetchMore}
          onSelectRow={setSelectedGuid}
          rows={rows}
          selectedGuid={selectedGuid}
        />
        {selectedEntity ? (
          <DetailPanel
            entity={selectedEntity}
            onClose={() => setSelectedGuid(null)}
          />
        ) : null}
      </div>
    </div>
  );
};

const GroundskeeperV3Nerdlet = () => (
  <ErrorBoundary label="Agent Groundskeeper v3">
    <GroundskeeperV3Content />
  </ErrorBoundary>
);

export default GroundskeeperV3Nerdlet;
