import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';

const RemoveIcon = memo(() => (
  <svg
    width="8"
    height="8"
    viewBox="0 0 8 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.00008 4.70712L1.50008 7.20712L0.792969 6.50001L3.29297 4.00001L0.792969 1.50001L1.50008 0.792908L4.00008 3.29291L6.50008 0.792908L7.20718 1.50001L4.70718 4.00001L7.20718 6.50001L6.50008 7.20712L4.00008 4.70712Z"
      fill="#0B6ACB"
    />
  </svg>
));

const Tag = ({ value, onRemove }) => {
  const removeClickHandler = useCallback(evt => {
    evt.stopPropagation();
    if (onRemove) onRemove(evt);
  });

  return (
    <span className="tag">
      <span className="text">{value}</span>
      <span className="remove" onClick={removeClickHandler}>
        <RemoveIcon />
      </span>
    </span>
  );
};

Tag.propTypes = {
  value: PropTypes.string,
  onRemove: PropTypes.func
};

export default Tag;
