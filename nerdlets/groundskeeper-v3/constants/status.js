// See utils/status.js for how a row/tile actually gets assigned one of these.
// CVE is defined here (for the tile + badge styling) but nothing currently computes
// it -- CVE detection is the deliberately-deferred next step, not this pass.
const STATUS = {
  CURRENT: 'current',
  BEHIND: 'behind',
  EOL: 'eol',
  CVE: 'cve'
};

const STATUS_LABEL = {
  [STATUS.CURRENT]: 'Current',
  [STATUS.BEHIND]: 'Behind',
  [STATUS.EOL]: 'EOL',
  [STATUS.CVE]: 'CVE'
};

export { STATUS, STATUS_LABEL };
