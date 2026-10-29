import { Icon } from 'nr1';
import { STATUS } from './status';

// The app's own color tokens (declared on .groundskeeper-v3 in styles.scss),
// not NR1's --nr1--* ones, which the platform can change -- so a color is
// defined once, in the stylesheet, and icons pick it up from there.
const ICON_COLOR = {
  SUCCESS: 'var(--gk-color-success)',
  WARNING: 'var(--gk-color-warning)',
  CRITICAL: 'var(--gk-color-critical)',
  INFO: 'var(--gk-color-info)',
  MUTED: 'var(--gk-color-text-muted)'
};

// Not STATUS values, but states that still need an icon: a row/tile can have
// security fixes regardless of its status (see utils/status.js summarize()),
// UNKNOWN isn't used yet, and EOL_SOON is the state FEAT-3 adds.
const ICON_KEY = {
  SECURITY_FIXES: 'securityFixes',
  UNKNOWN: 'unknown',
  EOL_SOON: 'eolSoon'
};

// The one place mapping a state to its nr1 Icon type and color -- the summary
// tiles, the status badge, the Recommended Version cell and the upgrade-history
// feed all read from this, so they can't disagree on what a state looks like.
const STATUS_ICON = {
  [STATUS.CURRENT]: {
    type: Icon.TYPE.INTERFACE__SIGN__CHECKMARK,
    color: ICON_COLOR.SUCCESS
  },
  [STATUS.BEHIND]: {
    type: Icon.TYPE.INTERFACE__STATE__WARNING,
    color: ICON_COLOR.WARNING
  },
  [ICON_KEY.SECURITY_FIXES]: {
    type: Icon.TYPE.INTERFACE__OPERATIONS__SHIELD,
    color: ICON_COLOR.CRITICAL
  },
  [STATUS.EOL]: {
    type: Icon.TYPE.INTERFACE__STATE__CRITICAL,
    color: ICON_COLOR.CRITICAL
  },
  [ICON_KEY.UNKNOWN]: {
    type: Icon.TYPE.INTERFACE__INFO__HELP,
    color: ICON_COLOR.MUTED
  },
  [STATUS.CHECKING]: {
    type: Icon.TYPE.INTERFACE__STATE__LOADING,
    color: ICON_COLOR.MUTED
  },
  [ICON_KEY.EOL_SOON]: {
    type: Icon.TYPE.DATE_AND_TIME__DATE_AND_TIME__TIME,
    color: ICON_COLOR.WARNING
  }
};

const CSV_DOWNLOAD_ICON = Icon.TYPE.INTERFACE__OPERATIONS__DOWNLOAD;

export { ICON_COLOR, ICON_KEY, STATUS_ICON, CSV_DOWNLOAD_ICON };
