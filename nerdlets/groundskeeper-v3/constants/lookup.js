// Where a guid's AgentUpdate lookup stands (hooks/useRecommendedVersions.js).
// No entry at all means it hasn't been requested yet, or can't be (no account).
const LOOKUP = {
  CHECKING: 'checking',
  DONE: 'done',
  FAILED: 'failed'
};

export { LOOKUP };
