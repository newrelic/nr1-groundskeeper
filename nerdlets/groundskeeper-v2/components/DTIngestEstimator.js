import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  Toast
} from 'nr1';

import useDTIngestEstimates from '../hooks/useDTIngestEstimates';
import { formatInGB, monthlyGB } from '../formatter';
import { downloadDTIE } from '../csv';
import DatePicker from './DatePicker';
import DTSplash from './DTSplash';
import DTHelpPopover from './DTHelpPopover';

const SELECT_APPS_TEXT =
  'Select application(s) that require Distributed Tracing';

const SELECT_DATE_TEXT =
  'Select a date in the last month that reflects the typical traffic pattern and volume for the set of applications';

const COLUMNS = {
  MODERATE: 'moderate',
  HIGH: 'high',
  VERY_HIGH: 'veryHigh'
};

const toGigabytes = bytes => (bytes ? bytes / 1000000000 : 0);

const DTIngestEstimator = ({ entities, onClose, hideSplash, onHideSplash }) => {
  const [entityEstimates, setEntityEstimates] = useState({});
  const [selectedDate, setSelectedDate] = useState();
  const [selectedEntities, setSelectedEntities] = useState({});
  const [filteredEntities, setFilteredEntities] = useState([]);
  const [sortingTypes, setSortingTypes] = useState([
    TableHeaderCell.SORTING_TYPE.NONE,
    TableHeaderCell.SORTING_TYPE.NONE,
    TableHeaderCell.SORTING_TYPE.NONE
  ]);
  const { ingestEstimatesBytes, loading, error } = useDTIngestEstimates({
    entities: filteredEntities,
    selectedDate
  });
  const summaryCols = useRef({});
  const listingDiv = useRef();
  const headerDiv = useRef();

  useEffect(() => {
    if (!ingestEstimatesBytes || !Object.keys(ingestEstimatesBytes).length)
      return;
    setFilteredEntities([]);
    setEntityEstimates(ee => ({
      ...ee,
      ...Object.keys(ingestEstimatesBytes).reduce(
        (acc, guid) => ({
          ...acc,
          [guid]:
            ingestEstimatesBytes[guid].length === 3
              ? ingestEstimatesBytes[guid].map(b => toGigabytes(b))
              : [0, 0, 0]
        }),
        {}
      )
    }));
  }, [ingestEstimatesBytes]);

  useEffect(() => {
    if (!error) return;
    Toast.showToast({
      title: 'Error',
      description: 'There were error(s) retrieving the data.',
      type: Toast.TYPE.CRITICAL
    });
  }, [error]);

  const estimateCell = useCallback(estimateGB => (
    <TableRowCell
      alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}
      additionalValue={estimateGB !== 0 ? monthlyGB(estimateGB) : '0'}
    >
      {estimateGB !== 0 ? formatInGB(estimateGB) : '0'}
    </TableRowCell>
  ));

  const summaryCell = useCallback(dailyTotalGB => (
    <>
      <div>{dailyTotalGB !== 0 ? `${formatInGB(dailyTotalGB)}/day` : '0'}</div>
      <div>{dailyTotalGB !== 0 ? monthlyGB(dailyTotalGB) : '0'}</div>
    </>
  ));

  const downloadHandler = useCallback(
    () =>
      downloadDTIE(
        entities
          .filter(({ guid }) => selectedEntities[guid])
          .map(({ guid, account, name, language }) => ({
            account,
            name,
            language,
            estimatesGigabytes:
              guid in entityEstimates ? entityEstimates[guid] : [0, 0, 0]
          }))
      ),
    [selectedEntities, entityEstimates]
  );

  const clickHandler = useCallback(() => {
    const style = {};
    if (listingDiv.current && headerDiv.current) {
      const { bottom: listingBottom = 0 } =
        listingDiv.current.getBoundingClientRect() || {};
      const { bottom: headerBottom = 0 } =
        headerDiv.current.getBoundingClientRect() || {};
      if (listingBottom && headerBottom) {
        style.marginBottom = listingBottom - headerBottom;
      }
    }

    if (
      !Object.keys(selectedEntities).filter(guid => selectedEntities[guid])
        .length
    ) {
      style.marginBottom = style.marginBottom - 100;
      Toast.showToast({
        description: SELECT_APPS_TEXT,
        style
      });
      return;
    }
    if (!(selectedDate && selectedDate instanceof Date)) {
      style.marginBottom = style.marginBottom - 180;
      Toast.showToast({
        description: SELECT_DATE_TEXT,
        style
      });
      return;
    }

    setFilteredEntities(
      entities.filter(
        ({ guid }) => !(guid in entityEstimates) && selectedEntities[guid]
      )
    );
  }, [selectedEntities, entityEstimates, selectedDate]);

  const dateChangeHandler = useCallback(dt => {
    setSelectedDate(dt);
    setEntityEstimates({});
  });

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

  const summary = useMemo(
    () =>
      entities.reduce(
        (acc, { guid }) => {
          if (selectedEntities[guid]) {
            acc.count = acc.count + 1;
            acc[COLUMNS.MODERATE] =
              acc[COLUMNS.MODERATE] + ((entityEstimates[guid] || [])[0] || 0);
            acc[COLUMNS.HIGH] =
              acc[COLUMNS.HIGH] + ((entityEstimates[guid] || [])[1] || 0);
            acc[COLUMNS.VERY_HIGH] =
              acc[COLUMNS.VERY_HIGH] + ((entityEstimates[guid] || [])[2] || 0);
          }
          return acc;
        },
        {
          count: 0,
          [COLUMNS.MODERATE]: 0,
          [COLUMNS.HIGH]: 0,
          [COLUMNS.VERY_HIGH]: 0
        }
      ),
    [entities, selectedEntities, entityEstimates, selectedDate]
  );

  if (!hideSplash)
    return <DTSplash closeHandler={onHideSplash} cancelHandler={onClose} />;

  return (
    <div className="listing" ref={listingDiv}>
      <div className="header" ref={headerDiv}>
        <div className="col">
          <Button
            type={Button.TYPE.PLAIN}
            sizeType={Button.SIZE_TYPE.SMALL}
            iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__SKIP_BACK}
            onClick={onClose}
          >
            Back
          </Button>
        </div>
        <div className="col right">
          <span className="help">
            <DTHelpPopover />
          </span>
        </div>
        <div className="col">
          <div className="group-fields">
            <DatePicker date={selectedDate} onChange={dateChangeHandler} />
            <Button
              type={Button.TYPE.PRIMARY}
              sizeType={Button.SIZE_TYPE.SMALL}
              iconType={
                Button.ICON_TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__TRACES
              }
              loading={loading}
              onClick={clickHandler}
            >
              Calculate DT ingest estimates
            </Button>
          </div>
        </div>
        <div className="col">
          <Button
            type={Button.TYPE.SECONDARY}
            sizeType={Button.SIZE_TYPE.SMALL}
            loading={loading}
            disabled={
              !Object.keys(ingestEstimatesBytes).length ||
              !Object.keys(selectedEntities).filter(e => selectedEntities[e])
                .length
            }
            onClick={downloadHandler}
          >
            Download
          </Button>
        </div>
      </div>
      <div className="content has-footer">
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
            <TableHeaderCell>Agent version(s)</TableHeaderCell>
            <TableHeaderCell
              value={({ item }) => item.language}
              sortable
              sortingType={sortingTypes[2]}
              sortingOrder={2}
              onClick={headerClickHandler}
            >
              Language
            </TableHeaderCell>
            <TableHeaderCell>Runtime version(s)</TableHeaderCell>
            <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
              <div data-col={COLUMNS.MODERATE} ref={summaryColHandler}>
                Moderate (50th Percentile)
              </div>
            </TableHeaderCell>
            <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
              <div data-col={COLUMNS.HIGH} ref={summaryColHandler}>
                High (70th Percentile)
              </div>
            </TableHeaderCell>
            <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
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
              {estimateCell((entityEstimates[item.guid] || [])[0])}
              {estimateCell((entityEstimates[item.guid] || [])[1])}
              {estimateCell((entityEstimates[item.guid] || [])[2])}
            </TableRow>
          )}
        </Table>
      </div>
      <div className="footer">
        <div className="summary count">
          <div>{`${summary.count} selected item(s)`}</div>
        </div>
        <div
          className="summary moderate"
          ref={e => (summaryCols.current[COLUMNS.MODERATE] = e)}
        >
          {summaryCell(summary[COLUMNS.MODERATE])}
        </div>
        <div
          className="summary high"
          ref={e => (summaryCols.current[COLUMNS.HIGH] = e)}
        >
          {summaryCell(summary[COLUMNS.HIGH])}
        </div>
        <div
          className="summary very-high"
          ref={e => (summaryCols.current[COLUMNS.VERY_HIGH] = e)}
        >
          {summaryCell(summary[COLUMNS.VERY_HIGH])}
        </div>
      </div>
    </div>
  );
};

DTIngestEstimator.propTypes = {
  entities: PropTypes.array,
  onClose: PropTypes.func,
  hideSplash: PropTypes.bool,
  onHideSplash: PropTypes.func
};

export default DTIngestEstimator;
