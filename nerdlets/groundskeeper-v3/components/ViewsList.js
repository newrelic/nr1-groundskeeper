import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { HeadingText, Icon, Spinner, TextField } from 'nr1';

import { BUILT_IN_VIEWS } from '../constants';
import { formatCreatedMeta } from '../utils';

const byTitle = (a, b) => (a.title || '').localeCompare(b.title || '');

const matches = (view, term) =>
  !term ||
  (view.title || '').toLowerCase().includes(term) ||
  (view.description || '').toLowerCase().includes(term);

const ViewCard = ({
  view,
  favorited,
  isDefault,
  onOpen,
  onToggleFavorite,
  onSetDefault
}) => {
  // The card is clickable as a whole, for the mouse; the title is the real
  // button, so keyboard and screen-reader users get one control per action
  // instead of buttons nested inside a button.
  const meta = view.builtIn
    ? 'Built-in'
    : formatCreatedMeta(view.createdBy, view.createdAt);
  const stop = handler => event => {
    event.stopPropagation();
    handler();
  };
  return (
    <li className="view-card" onClick={() => onOpen(view.id)}>
      <div className="view-card__header">
        <button
          type="button"
          className="u-unstyledButton gk-unstyled-button view-card__title"
          title={view.title}
          onClick={stop(() => onOpen(view.id))}
        >
          {view.title || 'Untitled view'}
        </button>
        <button
          type="button"
          className={`u-unstyledButton gk-unstyled-button view-card__favorite${
            favorited ? ' view-card__favorite--on' : ''
          }`}
          aria-label={
            favorited
              ? `Remove ${view.title} from favorites`
              : `Add ${view.title} to favorites`
          }
          aria-pressed={favorited}
          onClick={stop(() => onToggleFavorite(view.id))}
        >
          <Icon
            type={
              favorited
                ? Icon.TYPE.PROFILES__EVENTS__FAVORITE__WEIGHT_BOLD
                : Icon.TYPE.PROFILES__EVENTS__FAVORITE
            }
            color={favorited ? 'var(--gk-color-favorite)' : undefined}
          />
        </button>
      </div>
      {view.description ? (
        <p className="view-card__description">{view.description}</p>
      ) : null}
      <div className="view-card__footer">
        <span className="view-card__meta" title={meta}>
          {meta}
        </span>
        {isDefault ? (
          <span className="view-card__default">Default</span>
        ) : (
          <button
            type="button"
            className="u-unstyledButton gk-unstyled-button view-card__set-default"
            aria-label={`Set ${view.title} as your default view`}
            onClick={stop(() => onSetDefault(view.id))}
          >
            Set as default
          </button>
        )}
      </div>
    </li>
  );
};

ViewCard.propTypes = {
  view: PropTypes.object.isRequired,
  favorited: PropTypes.bool,
  isDefault: PropTypes.bool,
  onOpen: PropTypes.func.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
  onSetDefault: PropTypes.func.isRequired
};

// The app's landing page: the built-in views and the account's saved views,
// with favorites in their own section at the top. Views are only made from
// an open one (its Save as new view), so there's no New view here.
const ViewsList = ({
  views,
  loading,
  error,
  favorites,
  defaultViewId,
  onOpenView,
  onToggleFavorite,
  onSetDefault
}) => {
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();

  const sections = useMemo(() => {
    const builtIn = BUILT_IN_VIEWS.filter(view => matches(view, term));
    const saved = views.filter(view => matches(view, term)).sort(byTitle);
    const isFavorite = view => Boolean(favorites[view.id]);
    return [
      {
        key: 'favorites',
        title: 'Favorites',
        views: [...builtIn, ...saved].filter(isFavorite)
      },
      {
        key: 'built-in',
        title: 'Built-in',
        views: builtIn.filter(view => !isFavorite(view))
      },
      {
        key: 'saved',
        title: 'Saved views',
        views: saved.filter(view => !isFavorite(view))
      }
    ];
  }, [views, favorites, term]);

  const nothingMatches = term && sections.every(s => s.views.length === 0);

  const savedEmptyText = () => {
    if (loading) return null;
    if (error) return `Couldn't load saved views: ${error.message || error}`;
    if (term) return null;
    // Favorited saved views are in Favorites, not missing.
    if (views.length) return null;
    return 'No saved views yet. Open a built-in view, filter it, and use Save as new view.';
  };

  return (
    <div className="views-list">
      <div className="views-list__header">
        <HeadingText type={HeadingText.TYPE.HEADING_3}>Views</HeadingText>
        <div className="views-list__actions">
          <TextField
            type={TextField.TYPE.SEARCH}
            placeholder="Search views"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="views-list__body">
        {nothingMatches ? (
          <p className="views-list__empty">No views match that search.</p>
        ) : (
          sections.map(section => {
            const emptyText = section.key === 'saved' ? savedEmptyText() : null;
            const showLoading = section.key === 'saved' && loading;
            if (!section.views.length && !emptyText && !showLoading) {
              return null;
            }
            return (
              <section key={section.key} className="views-list__section">
                <h4 className="views-list__section-title">{section.title}</h4>
                {section.views.length ? (
                  <ul className="views-list__grid">
                    {section.views.map(view => (
                      <ViewCard
                        key={view.id}
                        view={view}
                        favorited={Boolean(favorites[view.id])}
                        isDefault={view.id === defaultViewId}
                        onOpen={onOpenView}
                        onToggleFavorite={onToggleFavorite}
                        onSetDefault={onSetDefault}
                      />
                    ))}
                  </ul>
                ) : null}
                {showLoading ? (
                  <div className="views-list__loading">
                    <Spinner inline /> Loading saved views…
                  </div>
                ) : null}
                {emptyText ? (
                  <p className="views-list__empty">{emptyText}</p>
                ) : null}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
};

ViewsList.propTypes = {
  views: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  favorites: PropTypes.object,
  defaultViewId: PropTypes.string,
  onOpenView: PropTypes.func.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
  onSetDefault: PropTypes.func.isRequired
};

ViewsList.defaultProps = {
  views: [],
  loading: false,
  favorites: {},
  defaultViewId: null
};

export default ViewsList;
