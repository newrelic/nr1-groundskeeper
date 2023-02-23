import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Icon,
  SectionMessage,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  Tooltip
} from 'nr1';

import { downloadDTIE } from '../csv';
import useDTIngestEstimates from '../hooks/useDTIngestEstimates';
import { formatInGB, monthlyGB } from '../formatter';
import DatePicker from './DatePicker';

const disclaimerText = `
  NEW RELIC (A) EXPRESSLY DISCLAIMS THE ACCURACY, ADEQUACY, OR 
  COMPLETENESS OF ANY ESTIMATES AND INFORMATION PROVIDED IN THIS 
  APP, AND (B) SHALL NOT BE LIABLE FOR ANY ERRORS, OMISSIONS OR 
  OTHER DEFECTS IN THIS APP, ESTIMATES AND INFORMATION PROVIDED, 
  OR FOR ANY ACTIONS TAKEN IN RELIANCE THEREON.
`.replace(/\s/g, ' ');

const toGigabytes = bytes => (bytes ? bytes / 1000000000 : 0);

const DTIngestEstimator = ({ entities, onClose }) => {
  const [entityEstimates, setEntityEstimates] = useState({});
  const [selectedDate, setSelectedDate] = useState();
  const [selectedEntities, setSelectedEntities] = useState({});
  const [filteredEntities, setFilteredEntities] = useState([]);
  const { ingestEstimatesBytes, loading } = useDTIngestEstimates({
    entities: filteredEntities,
    selectedDate
  });

  useEffect(() => {
    if (!ingestEstimatesBytes || !Object.keys(ingestEstimatesBytes).length)
      return;
    setFilteredEntities([]);
    setEntityEstimates({
      ...entityEstimates,
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
    });
  }, [ingestEstimatesBytes]);

  const estimateCell = useCallback(estimateGB => (
    <TableRowCell
      alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}
      additionalValue={monthlyGB(estimateGB)}
    >
      {formatInGB(estimateGB)}
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
    setFilteredEntities(
      entities.filter(
        ({ guid }) => !(guid in entityEstimates) && selectedEntities[guid]
      )
    );
  }, [selectedEntities, entityEstimates]);

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
            <DatePicker date={selectedDate} onChange={setSelectedDate} />
            <Button
              type={Button.TYPE.PLAIN}
              onClick={clickHandler}
              sizeType={Button.SIZE_TYPE.SMALL}
              iconType={
                Button.ICON_TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__TRACES
              }
              disabled={
                !(
                  selectedDate &&
                  selectedDate instanceof Date &&
                  Object.keys(selectedEntities).filter(
                    guid => selectedEntities[guid]
                  ).length
                ) || loading
              }
            >
              Calculate DT ingest estimates
            </Button>
          </div>
          <Tooltip text="Pick a date">
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
        <div className="whole-row">
          <SectionMessage description={disclaimerText} />
        </div>
      </div>
      <div className="content">
        <Table
          className="recommendations"
          items={entities}
          multivalue
          selected={({ item: { guid } }) => selectedEntities[guid]}
          onSelect={({ target: { checked } = {} }, { item: { guid } }) =>
            setSelectedEntities({
              ...selectedEntities,
              [guid]: checked
            })
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
  onClose: PropTypes.func
};

export default DTIngestEstimator;
