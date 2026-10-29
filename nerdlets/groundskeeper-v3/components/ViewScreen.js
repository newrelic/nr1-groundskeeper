import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'nr1';

import { FilterBar } from '@newrelic/nr-labs-components';

import DetailPanel from './DetailPanel';
import EntitiesTable from './EntitiesTable';
import SummaryTiles from './SummaryTiles';
import UpgradePathModal from './UpgradePathModal';
import ViewModal from './ViewModal';
import { STATUS } from '../constants';
import {
  useAgentReleases,
  useApmEntities,
  useRecommendedVersions,
  useViewChrome
} from '../hooks';
import {
  enrichEntity,
  filtersArrayToNrql,
  findView,
  keyValuesFromEntities,
  sameSettings,
  summarize,
  viewSettings
} from '../utils';

const DEFAULT_FILTER_OPTIONS = [{ option: 'name', type: 'string', values: [] }];

// One open view: the filters, tiles and table, starting from the view's saved
// settings. index.js mounts it with key={view.id}, so opening another view
// starts fresh -- FilterBar only reads `defaultSelections` when it mounts.
//
// The settings a view saves (filters, Hide current, Show account name, sort) are
// held here and compared with the view's saved ones: Save as new view (and, on
// a saved view, Save view) only show once they differ. The view's name and
// Favorite/Settings are in the platform header (see hooks/useViewChrome.js).
// Writes go through the on* props, which resolve to `{ error }`.
const ViewScreen = ({
  view,
  isFavorite,
  isDefault,
  otherDefaultTitle,
  onToggleFavorite,
  onSetDefault,
  onSaveView,
  onCreateView,
  onEditView,
  onDeleteView
}) => {
  const saved = useMemo(() => viewSettings(view), [view]);
  const [entitiesFilters, setEntitiesFilters] = useState(saved.filters);
  const [hideCurrent, setHideCurrent] = useState(saved.hideCurrent);
  const [showAccountName, setShowAccountName] = useState(saved.showAccountName);
  const [sorting, setSorting] = useState(saved.sorting);
  const [filterOptions, setFilterOptions] = useState(DEFAULT_FILTER_OPTIONS);
  const [selectedGuid, setSelectedGuid] = useState(null);
  const [upgradePathEntity, setUpgradePathEntity] = useState(null);
  const [upgradePathHidden, setUpgradePathHidden] = useState(true);
  const [modalMode, setModalMode] = useState(null);
  const [saving, setSaving] = useState(false);

  const settings = {
    filters: entitiesFilters,
    hideCurrent,
    showAccountName,
    sorting
  };
  const hasUnsavedChanges = !sameSettings(settings, saved);
  // Changed back to exactly the built-in view it came from (all its filters
  // removed, say), there's nothing worth saving: it would be a copy of that.
  const baseView = findView([], view.builtIn ? view.id : view.baseViewId) || {};
  const showSaveActions =
    hasUnsavedChanges && !sameSettings(settings, baseView);

  const filters = useMemo(() => filtersArrayToNrql(entitiesFilters), [
    entitiesFilters
  ]);

  const { count, entities, fetchMore } = useApmEntities({ filters });
  const { releases } = useAgentReleases();
  const {
    recommendedVersions,
    reasons,
    versionDiffs,
    lookups
  } = useRecommendedVersions(entities);

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
          versionDiffs[entity.guid],
          lookups[entity.guid]
        )
      ),
    [entities, recommendedVersions, releases, reasons, versionDiffs, lookups]
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

  useViewChrome({
    title: view.title,
    isFavorite,
    onToggleFavorite,
    onOpenSettings: () => setModalMode(ViewModal.MODE.SETTINGS)
  });

  const save = async () => {
    setSaving(true);
    await onSaveView(view, viewSettings(settings));
    setSaving(false);
  };

  // Settings: rename (saved views only) and change the default, each only if
  // it changed.
  const submitSettings = async ({
    title,
    description,
    isDefault: makeDefault
  }) => {
    const renamed =
      !view.builtIn &&
      (title !== view.title || description !== (view.description || ''));
    if (renamed) {
      const { error } = (await onEditView(view, { title, description })) || {};
      if (error) return { error };
    }
    if (makeDefault !== isDefault) {
      const { error } = (await onSetDefault(view, makeDefault)) || {};
      if (error) return { error };
    }
    return {};
  };

  // A new view starts from this one as it is now, unsaved changes included,
  // and remembers which built-in view it came from.
  const submitNewView = ({ title, description, isDefault: makeDefault }) =>
    onCreateView(
      {
        title,
        description,
        ...viewSettings(settings),
        domain: view.domain,
        baseViewId: view.builtIn ? view.id : view.baseViewId
      },
      { makeDefault }
    );

  const submitModal = async fields => {
    const result =
      (await (modalMode === ViewModal.MODE.SETTINGS
        ? submitSettings(fields)
        : submitNewView(fields))) || {};
    if (!result.error) setModalMode(null);
    return result;
  };

  const settingsOpen = modalMode === ViewModal.MODE.SETTINGS;

  return (
    <div className="groundskeeper-v3">
      <div className="groundskeeper-v3__filters">
        <div className="groundskeeper-v3__filter-bar">
          <span className="groundskeeper-v3__predefined-filter">
            domain = {view.domain || 'APM'}
          </span>
          <FilterBar
            options={filterOptions}
            defaultSelections={saved.filters}
            onChange={setEntitiesFilters}
          />
        </div>
        {showSaveActions ? (
          <div className="groundskeeper-v3__save-actions">
            <Button
              variant={Button.VARIANT.PRIMARY}
              sizeType={Button.SIZE_TYPE.SMALL}
              disabled={saving}
              onClick={() => setModalMode(ViewModal.MODE.CREATE)}
            >
              Save as new view
            </Button>
            {view.builtIn ? null : (
              <Button
                variant={Button.VARIANT.PRIMARY}
                sizeType={Button.SIZE_TYPE.SMALL}
                disabled={saving}
                loading={saving}
                onClick={save}
              >
                Save view
              </Button>
            )}
          </div>
        ) : null}
      </div>
      <SummaryTiles counts={counts} />
      <div className="groundskeeper-v3__content">
        <EntitiesTable
          count={visibleCount}
          fetchMore={fetchMore}
          hideCurrent={hideCurrent}
          onSelectRow={setSelectedGuid}
          onShowUpgradePath={showUpgradePath}
          onSortingChange={setSorting}
          onToggleHideCurrent={() => setHideCurrent(value => !value)}
          onToggleShowAccountName={() => setShowAccountName(value => !value)}
          rows={visibleRows}
          selectedGuid={selectedGuid}
          showAccountName={showAccountName}
          sorting={sorting}
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
      <ViewModal
        hidden={!modalMode}
        mode={modalMode || ViewModal.MODE.CREATE}
        builtIn={settingsOpen && Boolean(view.builtIn)}
        initialTitle={settingsOpen ? view.title : ''}
        initialDescription={settingsOpen ? view.description || '' : ''}
        initialIsDefault={settingsOpen && isDefault}
        otherDefaultTitle={settingsOpen && isDefault ? null : otherDefaultTitle}
        onSubmit={submitModal}
        onDelete={() => {
          setModalMode(null);
          onDeleteView(view);
        }}
        onClose={() => setModalMode(null)}
      />
    </div>
  );
};

ViewScreen.propTypes = {
  view: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    domain: PropTypes.string,
    builtIn: PropTypes.bool,
    baseViewId: PropTypes.string
  }).isRequired,
  isFavorite: PropTypes.bool,
  isDefault: PropTypes.bool,
  // The user's default view's title, when it's another view.
  otherDefaultTitle: PropTypes.string,
  onToggleFavorite: PropTypes.func.isRequired,
  onSetDefault: PropTypes.func.isRequired,
  onSaveView: PropTypes.func.isRequired,
  onCreateView: PropTypes.func.isRequired,
  onEditView: PropTypes.func.isRequired,
  onDeleteView: PropTypes.func.isRequired
};

export default ViewScreen;
