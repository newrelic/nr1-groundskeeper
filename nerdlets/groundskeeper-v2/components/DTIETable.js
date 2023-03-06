import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell
} from 'nr1';

import { formatInGB, monthlyGB } from '../formatter';
import { COLUMNS } from './DTIngestEstimator';

const COL_IDX = {
  MODERATE: 0,
  HIGH: 1,
  VERY_HIGH: 2
};

const DTIETable = ({
  entities,
  selectedEntities,
  setSelectedEntities,
  entityEstimates,
  summaryCols
}) => {
  const [sortingTypes, setSortingTypes] = useState([
    TableHeaderCell.SORTING_TYPE.NONE,
    TableHeaderCell.SORTING_TYPE.NONE,
    TableHeaderCell.SORTING_TYPE.NONE,
    TableHeaderCell.SORTING_TYPE.NONE,
    TableHeaderCell.SORTING_TYPE.NONE,
    TableHeaderCell.SORTING_TYPE.NONE
  ]);

  const estimate = useCallback(
    (guid, index) => (entityEstimates[guid] || [])[index]
  );

  const estimateCell = useCallback(estimateGB => (
    <TableRowCell
      alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}
      additionalValue={estimateGB !== 0 ? monthlyGB(estimateGB) : '0'}
    >
      {estimateGB !== 0 ? formatInGB(estimateGB) : '0'}
    </TableRowCell>
  ));

  const headerClickHandler = useCallback(
    (_, { nextSortingType, sortingOrder }) =>
      setSortingTypes(st =>
        st.map((t, i) =>
          i === sortingOrder
            ? nextSortingType
            : TableHeaderCell.SORTING_TYPE.NONE
        )
      )
  );

  const summaryColHandler = useCallback(e => {
    const { dataset: { col } = {} } = e || {};
    const { left = 0, width = 0 } = e?.getBoundingClientRect() || {};
    if (col) {
      summaryCols.current[col].style.width = `${width}px`;
      summaryCols.current[col].style.left = `${left}px`;
    }
  });

  return (
    <Table
      className="recommendations"
      items={entities}
      multivalue
      selected={({ item: { guid } }) => selectedEntities[guid]}
      onSelect={({ target: { checked } = {} }, { item: { guid } }) =>
        setSelectedEntities(se => ({
          ...se,
          [guid]: checked
        }))
      }
    >
      <TableHeader>
        <TableHeaderCell
          value={({ item }) => item.account?.name}
          sortable
          sortingType={sortingTypes[1]}
          sortingOrder={1}
          onClick={headerClickHandler}
        >
          Account
        </TableHeaderCell>
        <TableHeaderCell
          value={({ item }) => item.name}
          sortable
          sortingType={sortingTypes[0]}
          sortingOrder={0}
          onClick={headerClickHandler}
        >
          App
        </TableHeaderCell>
        <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
          Agent version(s)
        </TableHeaderCell>
        <TableHeaderCell
          value={({ item }) => item.language}
          sortable
          sortingType={sortingTypes[2]}
          sortingOrder={2}
          onClick={headerClickHandler}
        >
          Language
        </TableHeaderCell>
        <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
          Runtime version(s)
        </TableHeaderCell>
        <TableHeaderCell
          alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}
          value={({ item }) => estimate(item.guid, COL_IDX.MODERATE) || 0}
          sortable
          sortingType={sortingTypes[3]}
          sortingOrder={3}
          onClick={headerClickHandler}
        >
          <div data-col={COLUMNS.MODERATE} ref={summaryColHandler}>
            Moderate (50th Percentile)
          </div>
        </TableHeaderCell>
        <TableHeaderCell
          alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}
          value={({ item }) => estimate(item.guid, COL_IDX.HIGH) || 0}
          sortable
          sortingType={sortingTypes[4]}
          sortingOrder={4}
          onClick={headerClickHandler}
        >
          <div data-col={COLUMNS.HIGH} ref={summaryColHandler}>
            High (70th Percentile)
          </div>
        </TableHeaderCell>
        <TableHeaderCell
          alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}
          value={({ item }) => estimate(item.guid, COL_IDX.VERY_HIGH) || 0}
          sortable
          sortingType={sortingTypes[5]}
          sortingOrder={5}
          onClick={headerClickHandler}
        >
          <div data-col={COLUMNS.VERY_HIGH} ref={summaryColHandler}>
            Very High (90th Percentile)
          </div>
        </TableHeaderCell>
      </TableHeader>
      {({ item }) => (
        <TableRow>
          <TableRowCell additionalValue={item.account?.name}>
            {item.account?.id}
          </TableRowCell>
          <TableRowCell>{item.name}</TableRowCell>
          <TableRowCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
            {item.agentVersions?.display || ''}
          </TableRowCell>
          <TableRowCell>{item.language}</TableRowCell>
          <TableRowCell
            alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}
            additionalValue={item.runtimeVersions?.type}
          >
            {item.runtimeVersions?.display || ''}
          </TableRowCell>
          {estimateCell(estimate(item.guid, COL_IDX.MODERATE))}
          {estimateCell(estimate(item.guid, COL_IDX.HIGH))}
          {estimateCell(estimate(item.guid, COL_IDX.VERY_HIGH))}
        </TableRow>
      )}
    </Table>
  );
};

DTIETable.propTypes = {
  entities: PropTypes.array,
  selectedEntities: PropTypes.object,
  setSelectedEntities: PropTypes.func,
  entityEstimates: PropTypes.object,
  summaryCols: PropTypes.object
};

export default DTIETable;
