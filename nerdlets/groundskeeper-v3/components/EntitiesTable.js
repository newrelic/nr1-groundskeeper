import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  AutoSizer,
  DataTable,
  DataTableBody,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableRow,
  DataTableRowCell
} from 'nr1';

import StatusBadge from './StatusBadge';

// `rows` are pre-enriched entities from utils/status.js enrichEntity() (already
// carrying recommendedVersion/status/age) -- this component just renders them and
// reports which one was clicked; it doesn't fetch or derive anything itself.
// `count` (the search's total) vs `rows.length` (what's loaded so far) is what
// drives DataTable's own infinite-scroll "loading N-M of count..." placeholder rows.
const EntitiesTable = ({
  count,
  fetchMore,
  onSelectRow,
  rows,
  selectedGuid
}) => {
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
            items={rows}
            itemCount={count}
            height={height}
            onLoadMoreItems={fetchMore}
            onClickTableRow={clickHandler}
          >
            <DataTableHeader>
              <DataTableHeaderCell name="name" value="name">
                Application
              </DataTableHeaderCell>
              <DataTableHeaderCell name="version" value="version">
                Version
              </DataTableHeaderCell>
              <DataTableHeaderCell
                name="recommendedVersion"
                value="recommendedVersion"
              >
                Recommended Version
              </DataTableHeaderCell>
              <DataTableHeaderCell name="status" value="status">
                Status
              </DataTableHeaderCell>
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
                  {/* DataTableRowCell only accepts a function (optionally plus a
                      DataTableAdditionalValueCell) as children, not raw JSX/text --
                      it calls this to render, it doesn't just display it. */}
                  <DataTableRowCell>{() => item.name}</DataTableRowCell>
                  <DataTableRowCell className="entities-table__mono">
                    {() => item.version || '—'}
                  </DataTableRowCell>
                  <DataTableRowCell className="entities-table__mono entities-table__muted">
                    {() =>
                      item.recommendedVersion &&
                      item.recommendedVersion !== item.version
                        ? item.recommendedVersion
                        : '—'
                    }
                  </DataTableRowCell>
                  <DataTableRowCell>
                    {() => <StatusBadge status={item.status} />}
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
  onSelectRow: PropTypes.func,
  rows: PropTypes.array,
  selectedGuid: PropTypes.string
};

EntitiesTable.defaultProps = {
  count: 0,
  rows: []
};

export default EntitiesTable;
