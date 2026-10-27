import React, { useEffect, useMemo, useRef, useState } from 'react';

import { FilterBar } from '@newrelic/nr-labs-components';

import {
  DetailPanel,
  EntitiesTable,
  ErrorBoundary,
  Header,
  SummaryTiles,
  UpgradePathModal
} from './components';
import { STATUS } from './constants';
import {
  useAgentReleases,
  useApmEntities,
  useRecommendedVersions
} from './hooks';
import {
  enrichEntity,
  filtersArrayToNrql,
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
  const [hideCurrent, setHideCurrent] = useState(false);
  const [upgradePathEntity, setUpgradePathEntity] = useState(null);
  const [upgradePathHidden, setUpgradePathHidden] = useState(true);

  const filters = useMemo(() => filtersArrayToNrql(entitiesFilters), [
    entitiesFilters
  ]);

  const { count, entities, fetchMore } = useApmEntities({ filters });
  const { releases } = useAgentReleases();
  const { recommendedVersions, reasons, versionDiffs } = useRecommendedVersions(
    entities
  );

  // Baseline to compare against for Header's Save view button/unsaved-changes dot.
  // There's no saved-view-loading feature yet, so this baseline is always the
  // filters present on mount -- once that feature exists, it should be reset
  // whenever a view is loaded instead.
  const initialFiltersRef = useRef(entitiesFilters);
  const hasUnsavedChanges =
    JSON.stringify(entitiesFilters) !==
    JSON.stringify(initialFiltersRef.current);
  const saveDisabled = entitiesFilters.length === 0 || !hasUnsavedChanges;

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
          releases[entity.language],
          reasons[entity.guid],
          versionDiffs[entity.guid]
        )
      ),
    [entities, recommendedVersions, releases, reasons, versionDiffs]
  );

  const counts = useMemo(() => summarize(rows), [rows]);

  // There's no server-side "count of non-current rows" query, so while pages are
  // still loading (rows.length < count) `itemCount` stays the server's unfiltered
  // total -- DataTable needs to keep calling fetchMore, since more non-current
  // rows may still be among the unloaded ones. Only once every entity has
  // actually been fetched (rows.length >= count) does itemCount switch to the
  // filtered length -- otherwise DataTable sees a permanent gap between what's
  // rendered and itemCount and keeps calling fetchMore forever, even past the
  // end of the real data.
  const visibleRows = useMemo(
    () =>
      hideCurrent ? rows.filter(row => row.status !== STATUS.CURRENT) : rows,
    [rows, hideCurrent]
  );
  const allLoaded = rows.length >= count;
  const visibleCount = hideCurrent && allLoaded ? visibleRows.length : count;

  const selectedEntity = useMemo(
    () => rows.find(({ guid }) => guid === selectedGuid) || null,
    [rows, selectedGuid]
  );

  // `upgradePathEntity` is deliberately left set while the modal is closing (not
  // cleared to null) -- Modal keeps rendering its children through the slide-out
  // animation (see components/Modal.js), so nulling the entity immediately would
  // blank the content out from under that animation.
  const showUpgradePath = entity => {
    setUpgradePathEntity(entity);
    setUpgradePathHidden(false);
  };

  return (
    <div className="groundskeeper-v3">
      <Header
        count={count}
        hasUnsavedChanges={hasUnsavedChanges}
        saveDisabled={saveDisabled}
      />
      <div className="groundskeeper-v3__filters">
        <span className="groundskeeper-v3__predefined-filter">
          domain = APM
        </span>
        <FilterBar options={filterOptions} onChange={setEntitiesFilters} />
      </div>
      <SummaryTiles counts={counts} />
      <div className="groundskeeper-v3__content">
        <EntitiesTable
          count={visibleCount}
          fetchMore={fetchMore}
          hideCurrent={hideCurrent}
          onSelectRow={setSelectedGuid}
          onShowUpgradePath={showUpgradePath}
          onToggleHideCurrent={() => setHideCurrent(value => !value)}
          rows={visibleRows}
          selectedGuid={selectedGuid}
        />
        {selectedEntity ? (
          <DetailPanel
            entity={selectedEntity}
            onClose={() => setSelectedGuid(null)}
          />
        ) : null}
      </div>
      <UpgradePathModal
        entity={upgradePathEntity}
        releasesForLanguage={releases[upgradePathEntity?.language]}
        hidden={upgradePathHidden}
        onClose={() => setUpgradePathHidden(true)}
      />
    </div>
  );
};

const GroundskeeperV3Nerdlet = () => (
  <ErrorBoundary label="Agent Groundskeeper v3">
    <GroundskeeperV3Content />
  </ErrorBoundary>
);

export default GroundskeeperV3Nerdlet;
