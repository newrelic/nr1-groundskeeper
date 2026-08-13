import React from 'react';
import PropTypes from 'prop-types';
import { STATUS } from '../constants';

// CVE exposed always reads 0 for now -- CVE detection is the next step, not this one.
const TILES = [
  { status: STATUS.CURRENT, label: 'Up to date' },
  { status: STATUS.BEHIND, label: 'Behind' },
  { status: STATUS.CVE, label: 'CVE exposed' },
  { status: STATUS.EOL, label: 'Stale / EOL' }
];

const SummaryTiles = ({ counts }) => (
  <div className="summary-tiles">
    {TILES.map(({ status, label }) => (
      <div
        key={status}
        className={`summary-tiles__tile summary-tiles__tile--${status}`}
      >
        <div className="summary-tiles__label">{label}</div>
        <div className="summary-tiles__value">
          {(counts[status] || 0).toLocaleString()}
        </div>
      </div>
    ))}
  </div>
);

SummaryTiles.propTypes = {
  counts: PropTypes.object
};

SummaryTiles.defaultProps = {
  counts: {}
};

export default SummaryTiles;
