import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  AutoSizer,
  DataTable,
  DataTableBody,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableRow,
  DataTableRowCell,
  DataTableToolbar,
  DataTableToolbarContent,
  Switch,
  Tooltip
} from 'nr1';

import RecommendedVersion from './RecommendedVersion';
import StatusBadge from './StatusBadge';
import { STATUS } from '../constants';
import { DEFAULT_SORTING, sortRows } from '../utils';

// `rows` are pre-enriched entities from utils/status.js enrichEntity() (already
// carrying recommendedVersion/status/age/reasons) -- this component just renders
// them and reports which one was clicked; it doesn't fetch or derive anything
// itself, other than sorting (via utils/status.js sortRows(), since Status needs
// severity order, not alphabetical).
// `count` (the search's total) vs `rows.length` (what's loaded so far) is what
// drives DataTable's own infinite-scroll "loading N-M of count..." placeholder rows.
// `hideCurrent` (index.js filters on it), `sorting` and `showAccountName` are all
// held by the caller, since a saved view keeps them -- this just renders them
// and reports changes.
const EntitiesTable = ({
  count,
  fetchMore,
  hideCurrent,
  onSelectRow,
  onShowUpgradePath,
  onSortingChange,
  onToggleHideCurrent,
  onToggleShowAccountName,
  rows,
  selectedGuid,
  showAccountName,
  sorting
}) => {
  const sortedRows = useMemo(
    () => sortRows(rows, sorting, { showAccountName }),
    [rows, sorting, showAccountName]
  );

  const clickHandler = useCallback(
    (_event, { item } = {}) => item?.guid && onSelectRow(item.guid),
    [onSelectRow]
  );

  return (
    <div className="entities-table">
      <AutoSizer>
        {({ height }) => (
          <DataTable
            ariaLabel="APM applications"
            items={sortedRows}
            itemCount={count}
            height={height}
            sorting={sorting}
            onSortingChange={onSortingChange}
            onLoadMoreItems={fetchMore}
            onClickTableRow={clickHandler}
          >
            <DataTableToolbar>
              <DataTableToolbarContent>
                <Switch
                  checked={hideCurrent}
                  label="Hide current"
                  onChange={onToggleHideCurrent}
                />
                <Switch
                  checked={showAccountName}
                  label="Show account name"
                  onChange={onToggleShowAccountName}
                />
              </DataTableToolbarContent>
            </DataTableToolbar>
            <DataTableHeader>
              <DataTableHeaderCell
                name="name"
                value={item => item.name}
                sortable
              >
                Application
              </DataTableHeaderCell>
              <DataTableHeaderCell
                name="account"
                value={item =>
                  showAccountName ? item.tags?.account?.[0] : item.accountId
                }
                sortable
              >
                Account
              </DataTableHeaderCell>
              <DataTableHeaderCell name="language" value="language" sortable>
                Language
              </DataTableHeaderCell>
              <DataTableHeaderCell name="version" value="version" sortable>
                Version
              </DataTableHeaderCell>
              <DataTableHeaderCell
                name="target"
                value="recommendedVersion"
                sortable
              >
                Recommended Version
              </DataTableHeaderCell>
              <DataTableHeaderCell name="status" value="status" sortable>
                Status
              </DataTableHeaderCell>
              <DataTableHeaderCell name="notes">Notes</DataTableHeaderCell>
            </DataTableHeader>
            <DataTableBody>
              {({ item }) => (
                <DataTableRow
                  className={
                    item.guid === selectedGuid
                      ? 'entities-table__row--selected'
                      : undefined
                  }
                >
                  <DataTableRowCell>{() => item.name}</DataTableRowCell>
                  <DataTableRowCell>
                    {() =>
                      (showAccountName
                        ? item.tags?.account?.[0]
                        : item.accountId) ?? '—'
                    }
                  </DataTableRowCell>
                  <DataTableRowCell>
                    {() => item.language || '—'}
                  </DataTableRowCell>
                  <DataTableRowCell className="entities-table__mono">
                    {() => item.version || '—'}
                  </DataTableRowCell>
                  <DataTableRowCell>
                    {() =>
                      item.status === STATUS.CURRENT ? (
                        '—'
                      ) : (
                        <RecommendedVersion
                          item={item}
                          onClick={onShowUpgradePath}
                        />
                      )
                    }
                  </DataTableRowCell>
                  <DataTableRowCell>
                    {() => <StatusBadge status={item.status} />}
                  </DataTableRowCell>
                  <DataTableRowCell>
                    {() => {
                      // The cell truncates long notes; the tooltip has them in full.
                      const notes = (item.notes || []).join(' ');
                      return notes ? (
                        <Tooltip text={notes}>
                          <span className="entities-table__notes">{notes}</span>
                        </Tooltip>
                      ) : (
                        '—'
                      );
                    }}
                  </DataTableRowCell>
                </DataTableRow>
              )}
            </DataTableBody>
          </DataTable>
        )}
      </AutoSizer>
    </div>
  );
};

EntitiesTable.propTypes = {
  count: PropTypes.number,
  fetchMore: PropTypes.func,
  hideCurrent: PropTypes.bool,
  onSelectRow: PropTypes.func,
  onShowUpgradePath: PropTypes.func,
  onSortingChange: PropTypes.func,
  onToggleHideCurrent: PropTypes.func,
  onToggleShowAccountName: PropTypes.func,
  rows: PropTypes.array,
  selectedGuid: PropTypes.string,
  showAccountName: PropTypes.bool,
  sorting: PropTypes.shape({
    name: PropTypes.string,
    direction: PropTypes.string
  })
};

EntitiesTable.defaultProps = {
  count: 0,
  hideCurrent: false,
  // A no-op default so the Recommended Version cell's click always has
  // something to call, even when a caller doesn't care to wire one up
  // (same reasoning as onToggleHideCurrent's no-op default below).
  onShowUpgradePath: () => {},
  // A no-op default, not just documentation -- the Hide current Switch always
  // needs an onChange to stay a controlled input (see its `checked` prop), even
  // when a caller doesn't care to wire one up.
  onToggleHideCurrent: () => {},
  onSortingChange: () => {},
  onToggleShowAccountName: () => {},
  rows: [],
  showAccountName: false,
  sorting: DEFAULT_SORTING
};

export default EntitiesTable;
