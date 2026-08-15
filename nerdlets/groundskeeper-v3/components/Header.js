import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Icon } from 'nr1';

// `viewName`/view type have no backing state yet -- there's no saved-view loading
// feature to source them from, so they're hardcoded placeholders until that lands.
const VIEW_NAME = 'Untitled view';
const VIEW_TYPE = 'private';

// Favoriting is visual-only for now (its logic is a follow-up, same as Save
// view having no real destination yet) -- this just tracks its own on-screen
// state. Hide current lives in index.js now (see groundskeeper-v3__filters)
// since it actually filters the table. "Open view..." is gone -- the view-name
// dropdown (gs-header__chevron) is where switching views will live instead.
const Header = ({ count, hasUnsavedChanges, saveDisabled }) => {
  const [favorited, setFavorited] = useState(false);
  const toggleFavorited = () => setFavorited(value => !value);

  return (
    <div className="gs-header">
      {/* A plain container, not a <button>, per request -- role/tabIndex/onKeyDown
          keep it keyboard- and screen-reader-operable the way a real button would
          be for free. */}
      <span
        className="gs-header__favorite"
        role="button"
        tabIndex={0}
        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        aria-pressed={favorited}
        onClick={toggleFavorited}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleFavorited();
          }
        }}
      >
        <Icon
          type={
            favorited
              ? Icon.TYPE.PROFILES__EVENTS__FAVORITE__WEIGHT_BOLD
              : Icon.TYPE.PROFILES__EVENTS__FAVORITE
          }
          color={
            favorited
              ? 'var(--nr1--color--interactive--favorite, #F0B400)'
              : undefined
          }
        />
      </span>
      <div className="gs-header__view">
        <div className="gs-header__view-name">
          <span>{VIEW_NAME}</span>
          <span className="gs-header__chevron" aria-hidden="true" />
          {hasUnsavedChanges ? (
            <span className="gs-header__dot" aria-hidden="true" />
          ) : null}
        </div>
        <div className="gs-header__meta">
          {count.toLocaleString()} apps · {VIEW_TYPE}
          {hasUnsavedChanges ? ' · unsaved changes' : ''}
        </div>
      </div>
      <div className="gs-header__actions">
        <Button sizeType={Button.SIZE_TYPE.SMALL} disabled={saveDisabled}>
          Save view
        </Button>
      </div>
    </div>
  );
};

Header.propTypes = {
  count: PropTypes.number,
  hasUnsavedChanges: PropTypes.bool,
  saveDisabled: PropTypes.bool
};

Header.defaultProps = {
  count: 0,
  hasUnsavedChanges: false,
  saveDisabled: true
};

export default Header;
