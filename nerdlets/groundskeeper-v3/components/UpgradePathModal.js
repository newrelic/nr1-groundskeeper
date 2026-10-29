import React from 'react';
import PropTypes from 'prop-types';

import Feed from './Feed';
import Modal from './Modal';
import { STATUS } from '../constants';
import { buildUpgradeHistory, formatISODate, isBehind } from '../utils';

// Release dates are UTC midnight (see useAgentReleases.js's parseDate), so show
// just the calendar date -- Feed's default would add a meaningless time of day,
// shifted into the browser's timezone.
const formatReleaseDate = time => formatISODate(new Date(time));

// The two cases where there's nothing to upgrade *to*, even though the row
// isn't current: past EOL with no recommendation at all, or past EOL while
// already on the recommended version (New Relic keeps recommending it until a
// newer release ships -- see utils/status.js rowStatus()).
const eolNotice = ({ status, version, recommendedVersion }) => {
  if (status !== STATUS.EOL) return null;
  if (!recommendedVersion) {
    return 'This version is past its end of life, and no recommended version was reported. Upgrade to a supported version.';
  }
  if (recommendedVersion === version) {
    return "This version is past its end of life, but it's still the recommended version -- no newer release is available yet.";
  }
  return null;
};

// `entity` is an enriched row (see utils/status.js enrichEntity()) for whichever
// app's Recommended Version cell was clicked; `releasesForLanguage` is that
// entity's slice of useAgentReleases()'s releases map. Nothing is rendered until
// an entity has actually been picked -- see index.js, which keeps hidden=true and
// entity=null until the first click, then leaves entity set (even while closing)
// so the close animation has something to render.
const UpgradePathModal = ({ entity, releasesForLanguage, hidden, onClose }) => {
  if (!entity) return null;

  const { language, version, recommendedVersion } = entity;
  const { versions, eolDate, duration, entries } = buildUpgradeHistory(
    entity,
    releasesForLanguage || {}
  );
  const hasTarget = isBehind(version, recommendedVersion);
  const notice = eolNotice(entity);

  const metaParts = [
    versions.length
      ? `${versions.length} release${versions.length === 1 ? '' : 's'}`
      : null,
    // Only a span between two different versions means anything.
    hasTarget ? duration : null,
    eolDate ? `EOL ${formatISODate(eolDate)}` : null
  ].filter(Boolean);

  return (
    <Modal
      hidden={hidden}
      onClose={onClose}
      style={{ '--modal-width': '480px' }}
    >
      <div className="upgrade-path-modal">
        <div className="upgrade-path-modal__header">
          <div className="upgrade-path-modal__title">
            {language} agent · {version}
            {hasTarget ? ` → ${recommendedVersion}` : null}
          </div>
          {metaParts.length ? (
            <div className="upgrade-path-modal__meta">
              {metaParts.join(' · ')}
            </div>
          ) : null}
          {notice ? (
            <div className="upgrade-path-modal__notice">{notice}</div>
          ) : null}
        </div>
        <div className="upgrade-path-modal__body">
          <Feed
            className="upgrade-path-modal__feed"
            entries={entries}
            formatTime={formatReleaseDate}
            empty={
              hasTarget
                ? 'No version history was reported for this upgrade.'
                : 'No newer versions to show.'
            }
          />
        </div>
      </div>
    </Modal>
  );
};

UpgradePathModal.propTypes = {
  entity: PropTypes.shape({
    language: PropTypes.string,
    version: PropTypes.string,
    recommendedVersion: PropTypes.string,
    versionDiff: PropTypes.string,
    status: PropTypes.oneOf(Object.values(STATUS))
  }),
  releasesForLanguage: PropTypes.object,
  hidden: PropTypes.bool,
  onClose: PropTypes.func
};

export default UpgradePathModal;
