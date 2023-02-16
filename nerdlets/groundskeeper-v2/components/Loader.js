import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { Button } from 'nr1';

import ProgressBar from './ProgressBar';

const Loader = ({ count, loaded, onEnd }) => {
  const [infoText, setInfoText] = useState('');

  useEffect(() => {
    if (count) setInfoText(`Scanning ${count} applications`);
  }, [count]);

  return (
    <div className="container">
      <div className="loader">
        <div className="status">
          <ProgressBar max={count} value={loaded} onEnd={onEnd} />
          <div className="info">{infoText}</div>
          {count === loaded ? (
            <div className="close">
              <Button
                iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__CLOSE}
                type={Button.TYPE.PLAIN}
                sizeType={Button.SIZE_TYPE.SMALL}
                onClick={onEnd}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

Loader.propTypes = {
  count: PropTypes.number,
  loaded: PropTypes.number,
  onEnd: PropTypes.func
};

export default Loader;
