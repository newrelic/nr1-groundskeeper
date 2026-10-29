import React from 'react';
import PropTypes from 'prop-types';
import { Badge, Icon } from 'nr1';
import { STATUS, STATUS_ICON, STATUS_LABEL } from '../constants';

// Single place mapping our STATUS values to nr1's Badge type, keyed off the same
// STATUS values utils/status.js computes -- so a new status only needs a label in
// constants/status.js, a Badge type here, and an icon in constants/icons.js.
const BADGE_TYPE = {
  [STATUS.CURRENT]: Badge.TYPE.SUCCESS,
  [STATUS.BEHIND]: Badge.TYPE.WARNING,
  [STATUS.EOL]: Badge.TYPE.CRITICAL,
  [STATUS.CHECKING]: Badge.TYPE.INFO
};

// nr1's Badge only takes a string -- it stringifies whatever children it gets,
// so an Icon inside it renders as "[object Object]". The icon sits next to it
// instead.
const StatusBadge = ({ status }) => (
  <span className="status-badge">
    {STATUS_ICON[status] ? (
      <Icon
        className="status-badge__icon"
        type={STATUS_ICON[status].type}
        color={STATUS_ICON[status].color}
      />
    ) : null}
    <Badge type={BADGE_TYPE[status]}>{STATUS_LABEL[status] || status}</Badge>
  </span>
);

StatusBadge.propTypes = {
  status: PropTypes.oneOf(Object.values(STATUS))
};

export default StatusBadge;
