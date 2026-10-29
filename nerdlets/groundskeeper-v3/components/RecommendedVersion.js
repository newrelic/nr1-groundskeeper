import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Tooltip } from 'nr1';

import { ICON_KEY, STATUS, STATUS_ICON } from '../constants';
import { describeReasons, hasSecurityFix } from '../utils';

// What an EOL row shows when AgentUpdate hasn't reported a recommendation for
// it -- the cell must never render an empty label.
const NO_RECOMMENDATION_LABEL = 'Upgrade required';

// Most critical first: EOL beats a security fix, which beats plain "behind".
const iconKey = ({ status, reasons }) => {
  if (status === STATUS.EOL) return STATUS.EOL;
  if (hasSecurityFix(reasons)) return ICON_KEY.SECURITY_FIXES;
  return STATUS.BEHIND;
};

const tooltipText = ({ status, reasons, recommendedVersion }) => {
  const included = describeReasons(reasons);
  if (status !== STATUS.EOL) return included || 'A newer version is available.';
  const eol = recommendedVersion
    ? 'This version is past its end of life.'
    : 'This version is past its end of life, and no recommended version was reported.';
  return included ? `${eol} ${included}` : eol;
};

// The Recommended Version cell for a row that isn't current (EntitiesTable
// renders a dash for current ones): a criticality icon, the version, the
// reasons on hover, and one click -- or Enter/Space, since it's a real button --
// to open the upgrade history. `item` is an enriched row (utils/status.js
// enrichEntity()).
const RecommendedVersion = ({ item, onClick }) => {
  const icon = STATUS_ICON[iconKey(item)];
  const label = item.recommendedVersion || NO_RECOMMENDATION_LABEL;
  const tooltip = tooltipText(item);

  return (
    <Tooltip text={tooltip} placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}>
      <button
        type="button"
        className="u-unstyledButton gk-unstyled-button recommended-version"
        aria-label={`${label}. ${tooltip} Show upgrade history.`}
        onClick={event => {
          // Opening the upgrade history is this cell's whole job -- don't also
          // let the click select the row (DataTable's onClickTableRow).
          event.stopPropagation();
          onClick(item);
        }}
      >
        <Icon
          className="recommended-version__icon"
          type={icon.type}
          color={icon.color}
        />
        <span
          className={
            item.recommendedVersion
              ? 'recommended-version__label recommended-version__label--version'
              : 'recommended-version__label'
          }
        >
          {label}
        </span>
      </button>
    </Tooltip>
  );
};

RecommendedVersion.propTypes = {
  item: PropTypes.shape({
    status: PropTypes.oneOf(Object.values(STATUS)),
    recommendedVersion: PropTypes.string,
    reasons: PropTypes.string
  }).isRequired,
  onClick: PropTypes.func
};

RecommendedVersion.defaultProps = {
  onClick: () => {}
};

export { NO_RECOMMENDATION_LABEL };
export default RecommendedVersion;
