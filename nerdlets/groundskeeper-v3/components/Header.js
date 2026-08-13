import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'nr1';

// Export/Help are visual-only for now (out of scope per the v3 scaffolding plan) --
// wire them up once there's an actual export/help destination to point at.
const Header = ({ count, syncedAt }) => (
  <div className="gs-header">
    <div>
      <div className="gs-header__title">Agent Groundskeeper</div>
      <div className="gs-header__meta">
        {count.toLocaleString()} apps · synced {syncedAt}
      </div>
    </div>
    <div className="gs-header__actions">
      <Button sizeType={Button.SIZE_TYPE.SMALL}>Export</Button>
      <Button sizeType={Button.SIZE_TYPE.SMALL}>Help</Button>
    </div>
  </div>
);

Header.propTypes = {
  count: PropTypes.number,
  syncedAt: PropTypes.string
};

Header.defaultProps = {
  count: 0
};

export default Header;
