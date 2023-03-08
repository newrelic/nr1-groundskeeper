import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import { BlockText } from 'nr1';

import { COLUMNS } from './DTIngestEstimator';
import { formatInGB, monthlyGB } from '../formatter';

const DTIEFooter = ({ summary, summaryCols }) => {
  const summaryCell = useCallback(dailyTotalGB => (
    <>
      <div>{dailyTotalGB !== 0 ? `${formatInGB(dailyTotalGB)}/day` : '0'}</div>
      <div>{dailyTotalGB !== 0 ? monthlyGB(dailyTotalGB) : '0'}</div>
    </>
  ));

  return (
    <div className="footer">
      <div className="text">
        <BlockText>
          Expected amount of Distributed Tracing ingest which may be generated
          by the selected app(s):
        </BlockText>
      </div>
      <div className="summaries">
        <div className="summary count">
          <div>{`${summary.count} selected app(s)`}</div>
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

DTIEFooter.propTypes = {
  summary: PropTypes.object,
  summaryCols: PropTypes.object
};

export default DTIEFooter;
