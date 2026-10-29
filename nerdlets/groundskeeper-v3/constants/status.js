// See utils/status.js for how a row/tile actually gets assigned one of these.
const STATUS = {
  CURRENT: 'current',
  BEHIND: 'behind',
  EOL: 'eol',
  // The AgentUpdate lookup for the row is still in flight.
  CHECKING: 'checking'
};

const STATUS_LABEL = {
  [STATUS.CURRENT]: 'Current',
  [STATUS.BEHIND]: 'Behind',
  [STATUS.EOL]: 'EOL',
  [STATUS.CHECKING]: 'Checking…'
};

export { STATUS, STATUS_LABEL };
