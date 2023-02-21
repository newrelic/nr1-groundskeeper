import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  SectionMessage
} from 'nr1';

import { downloadDTIE } from '../csv';
import useDTIngestEstimates from '../hooks/useDTIngestEstimates';
import { formatInGB, monthlyGB } from '../formatter';

const disclaimerText = `
  NEW RELIC (A) EXPRESSLY DISCLAIMS THE ACCURACY, ADEQUACY, OR 
  COMPLETENESS OF ANY ESTIMATES AND INFORMATION PROVIDED IN THIS 
  APP, AND (B) SHALL NOT BE LIABLE FOR ANY ERRORS, OMISSIONS OR 
  OTHER DEFECTS IN THIS APP, ESTIMATES AND INFORMATION PROVIDED, 
  OR FOR ANY ACTIONS TAKEN IN RELIANCE THEREON.
`.replace(/\s/g, ' ');

const DTIngestEstimator = ({ entities, onClose }) => {
  const [entityEstimates, setEntityEstimates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date('2023-02-14'));
  const { ingestEstimatesBytes, loading } = useDTIngestEstimates({
    entities,
    selectedDate
  });

  useEffect(() => {
    if (!ingestEstimatesBytes || !Object.keys(ingestEstimatesBytes).length)
      return;
    setEntityEstimates(
      entities.map(({ guid, account, name, language }) => ({
        account,
        name,
        language,
        estimatesGigabytes:
          guid in ingestEstimatesBytes &&
          ingestEstimatesBytes[guid].length === 3
            ? ingestEstimatesBytes[guid].map(b => b / 1000000000)
            : [0, 0, 0]
      }))
    );
  }, [ingestEstimatesBytes]);

  const estimateCell = useCallback(estimateGB => (
    <TableRowCell
      alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}
      additionalValue={monthlyGB(estimateGB)}
    >
      {formatInGB(estimateGB)}
    </TableRowCell>
  ));

  const downloadHandler = useCallback(() => downloadDTIE(entityEstimates), [
    entityEstimates
  ]);

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
        <div className="col right">
          <Button
            loading={loading}
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
        <Table className="recommendations" items={entityEstimates} multivalue>
          <TableHeader>
            <TableHeaderCell>Account</TableHeaderCell>
            <TableHeaderCell>App</TableHeaderCell>
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
              {estimateCell(item.estimatesGigabytes[0])}
              {estimateCell(item.estimatesGigabytes[1])}
              {estimateCell(item.estimatesGigabytes[2])}
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
