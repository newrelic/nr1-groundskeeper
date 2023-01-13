import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const percentFormatter = new Intl.NumberFormat('default', {
  style: 'percent',
  maximumFractionDigits: 2
});

const ProgressBar = ({ max = 0, value = 0, onEnd }) => {
  const progressBar = useRef(null);

  useEffect(() => {
    const progressPct =
      max && value ? percentFormatter.format(value / max) : '0px';
    progressBar.current.style.width = progressPct;
  }, [max, value]);

  const transitionHandler = () => {
    if (value === max && onEnd) onEnd();
  };

  return (
    <div className="progress">
      <div
        className="counter"
        ref={progressBar}
        onTransitionEnd={transitionHandler}
      />
    </div>
  );
};

ProgressBar.propTypes = {
  max: PropTypes.number,
  value: PropTypes.number,
  onEnd: PropTypes.func
};

export default ProgressBar;
