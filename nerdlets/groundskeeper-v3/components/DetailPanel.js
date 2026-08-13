import React from 'react';
import PropTypes from 'prop-types';

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
    age
  } = entity;
  const isBehind =
    Boolean(recommendedVersion) && recommendedVersion !== version;

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
          {isBehind
            ? `${version} → ${recommendedVersion}`
            : `Running ${version || 'unknown'}`}
        </div>
        {isBehind && age ? (
          <div className="detail-panel__age">{age}</div>
        ) : null}
      </div>
      {/* Deliberately a placeholder, not real logic -- CVE detection is the next
          step after this pass, see constants/status.js. */}
      <div className="detail-panel__exposures-label">Exposures</div>
      <div className="detail-panel__exposures-placeholder">
        CVE detection coming soon.
      </div>
    </div>
  );
};

DetailPanel.propTypes = {
  entity: PropTypes.object,
  onClose: PropTypes.func
};

export default DetailPanel;
