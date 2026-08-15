import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from 'nr1';
import { STATUS, STATUS_LABEL } from '../constants';

// Single place mapping our STATUS values to nr1's Badge type, keyed off the same
// STATUS values utils/status.js computes -- so a new status only needs a label in
// constants/status.js and a Badge type here.
const BADGE_TYPE = {
  [STATUS.CURRENT]: Badge.TYPE.SUCCESS,
  [STATUS.BEHIND]: Badge.TYPE.WARNING,
  [STATUS.EOL]: Badge.TYPE.CRITICAL
};

const StatusBadge = ({ status }) => (
  <Badge type={BADGE_TYPE[status]}>{STATUS_LABEL[status] || status}</Badge>
);

StatusBadge.propTypes = {
  status: PropTypes.oneOf(Object.values(STATUS))
};

export default StatusBadge;
