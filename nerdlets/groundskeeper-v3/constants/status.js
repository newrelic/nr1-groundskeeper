// See utils/status.js for how a row/tile actually gets assigned one of these.
const STATUS = {
  CURRENT: 'current',
  BEHIND: 'behind',
  EOL: 'eol'
};

const STATUS_LABEL = {
  [STATUS.CURRENT]: 'Current',
  [STATUS.BEHIND]: 'Behind',
  [STATUS.EOL]: 'EOL'
};

export { STATUS, STATUS_LABEL };
