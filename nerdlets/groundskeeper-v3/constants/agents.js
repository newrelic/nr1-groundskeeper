// Maps the docs.agentReleases `AgentName` GraphQL enum to the APM entity `language` field value.
const AGENTS = {
  DOTNET: 'dotnet',
  GO: 'go',
  JAVA: 'java',
  NODEJS: 'nodejs',
  PHP: 'php',
  PYTHON: 'python',
  RUBY: 'ruby'
};

const LANGUAGES = Object.values(AGENTS);

export { AGENTS, LANGUAGES };
