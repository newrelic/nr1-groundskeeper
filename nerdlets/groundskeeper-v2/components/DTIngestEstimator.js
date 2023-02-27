import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Icon,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  Toast,
  Tooltip
} from 'nr1';

import useDTIngestEstimates from '../hooks/useDTIngestEstimates';
import { formatInGB, monthlyGB } from '../formatter';
import { downloadDTIE } from '../csv';
import DatePicker from './DatePicker';
import DTSplash from './DTSplash';

const SELECT_APPS_TEXT = ` application(s) that require Distributed Tracing `;

const SELECT_DATE_TEXT = `
a date in the last month that reflects the typical traffic pattern 
and volume for the set of applications
`.replace(/\s/g, ' ');

const TOOLTIP_TEXT = `Select ${SELECT_APPS_TEXT} and ${SELECT_DATE_TEXT}`;

const toGigabytes = bytes => (bytes ? bytes / 1000000000 : 0);

const DTIngestEstimator = ({ entities, onClose, hideSplash, closeSplash }) => {
  const [entityEstimates, setEntityEstimates] = useState({});
  const [selectedDate, setSelectedDate] = useState();
  const [selectedEntities, setSelectedEntities] = useState({});
  const [filteredEntities, setFilteredEntities] = useState([]);
  const { ingestEstimatesBytes, loading, error } = useDTIngestEstimates({
    entities: filteredEntities,
    selectedDate
  });

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
    if (
      !Object.keys(selectedEntities).filter(guid => selectedEntities[guid])
        .length
    ) {
      Toast.showToast({
        description: `Select ${SELECT_APPS_TEXT}`
      });
      return;
    }
    if (!(selectedDate && selectedDate instanceof Date)) {
      Toast.showToast({
        description: `Select ${SELECT_DATE_TEXT}`
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

  if (!hideSplash) return <DTSplash closeHandler={() => closeSplash(true)} />;

  return (
    <div className="listing">
      <div className="header">
        <div className="col">
          <Button
            type={Button.TYPE.PLAIN}
            onClick={onClose}
            sizeType={Button.SIZE_TYPE.SMALL}
            iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__SKIP_BACK}
          >
            Back
          </Button>
        </div>
        <div className="col with-info right">
          <div className="group-fields">
            <DatePicker date={selectedDate} onChange={dateChangeHandler} />
            <Button
              type={Button.TYPE.PRIMARY}
              onClick={clickHandler}
              sizeType={Button.SIZE_TYPE.SMALL}
              iconType={
                Button.ICON_TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__TRACES
              }
              loading={loading}
            >
              Calculate DT ingest estimates
            </Button>
          </div>
          <Tooltip text={TOOLTIP_TEXT}>
            <Icon type={Icon.TYPE.INTERFACE__INFO__INFO} />
          </Tooltip>
        </div>
        <div className="col">
          <Button
            loading={loading}
            disabled={
              !Object.keys(ingestEstimatesBytes).length ||
              !Object.keys(selectedEntities).filter(e => selectedEntities[e])
                .length
            }
            type={Button.TYPE.SECONDARY}
            onClick={downloadHandler}
          >
            Download
          </Button>
        </div>
      </div>
      <div className="content">
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
            <TableHeaderCell>Account</TableHeaderCell>
            <TableHeaderCell>App</TableHeaderCell>
            <TableHeaderCell>Agent version(s)</TableHeaderCell>
            <TableHeaderCell>Runtime version(s)</TableHeaderCell>
            <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
              Moderate (50th Percentile)
            </TableHeaderCell>
            <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
              High (70th Percentile)
            </TableHeaderCell>
            <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
              Very High (90th Percentile)
            </TableHeaderCell>
          </TableHeader>
          {({ item }) => (
            <TableRow>
              <TableRowCell additionalValue={item.account?.name}>
                {item.account?.id}
              </TableRowCell>
              <TableRowCell additionalValue={item.language}>
                {item.name}
              </TableRowCell>
              <TableRowCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
                {item.agentVersions?.display || ''}
              </TableRowCell>
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
    </div>
  );
};

DTIngestEstimator.propTypes = {
  entities: PropTypes.array,
  onClose: PropTypes.func,
  hideSplash: PropTypes.bool,
  closeSplash: PropTypes.func
};

export default DTIngestEstimator;
