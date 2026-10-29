import React from 'react';
import PropTypes from 'prop-types';
import { isBehind } from '../utils';

// `entity` is expected to already be an enriched row from utils/status.js
// enrichEntity() (recommendedVersion/age already computed) -- this component only
// renders, it doesn't derive anything.
const DetailPanel = ({ entity, onClose }) => {
  if (!entity) return null;
  const {
    name,
    language,
    accountId,
    version,
    recommendedVersion,
    age,
    notes = []
  } = entity;
  const behind = isBehind(version, recommendedVersion);

  return (
    <div className="detail-panel">
      <div className="detail-panel__header">
        <div className="detail-panel__title">{name}</div>
        <button
          type="button"
          className="detail-panel__close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="detail-panel__meta">
        {language} · acct {accountId}
      </div>
      <div className="detail-panel__version-box">
        <div className="detail-panel__version-transition">
          {behind
            ? `${version} → ${recommendedVersion}`
            : `Running ${version || 'unknown'}`}
        </div>
        {behind && age ? <div className="detail-panel__age">{age}</div> : null}
      </div>
      {notes.map(note => (
        <p key={note} className="detail-panel__note">
          {note}
        </p>
      ))}
    </div>
  );
};

DetailPanel.propTypes = {
  entity: PropTypes.object,
  onClose: PropTypes.func
};

export default DetailPanel;
