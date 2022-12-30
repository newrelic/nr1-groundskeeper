import React, { useEffect, useRef } from 'react';

const percentFormatter = new Intl.NumberFormat('default', {
  style: 'percent',
  maximumFractionDigits: 2,
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
      ></div>
    </div>
  );
};

export default ProgressBar;
