import React from 'react';
import PropTypes from 'prop-types';
import { STATUS, STATUS_LABEL } from '../constants';

// Coloring is driven entirely by the `status-badge--<status>` class in styles.scss,
// keyed off the same STATUS values utils/status.js computes -- so a new status only
// needs a label here and a color rule in the stylesheet.
const StatusBadge = ({ status }) => (
  <span className={`status-badge status-badge--${status}`}>
    {STATUS_LABEL[status] || status}
  </span>
);

StatusBadge.propTypes = {
  status: PropTypes.oneOf(Object.values(STATUS))
};

export default StatusBadge;
