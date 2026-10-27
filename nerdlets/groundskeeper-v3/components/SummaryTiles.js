import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'nr1';
import { ICON_KEY, STATUS, STATUS_ICON } from '../constants';

// `securityFixes` isn't a STATUS key (see utils/status.js summarize()) -- a row can
// be BEHIND or EOL *and* have a security fix in its reasons, so it's tallied and
// displayed independently rather than as a mutually-exclusive status.
const TILES = [
  { key: STATUS.CURRENT, label: 'Current' },
  { key: STATUS.BEHIND, label: 'Behind', variant: 'warning' },
  {
    key: ICON_KEY.SECURITY_FIXES,
    label: 'Security fixes',
    variant: 'critical'
  },
  { key: STATUS.EOL, label: 'Past EOL', variant: 'critical' }
];

const SummaryTiles = ({ counts }) => (
  <div className="summary-tiles">
    {TILES.map(({ key, label, variant }) => (
      <div
        key={key}
        className={
          variant
            ? `summary-tiles__tile summary-tiles__tile--${variant}`
            : 'summary-tiles__tile'
        }
      >
        <div className="summary-tiles__label">
          <Icon
            className="summary-tiles__icon"
            type={STATUS_ICON[key].type}
            color={STATUS_ICON[key].color}
          />
          {label}
        </div>
        <div className="summary-tiles__value">
          {(counts[key] || 0).toLocaleString()}
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
