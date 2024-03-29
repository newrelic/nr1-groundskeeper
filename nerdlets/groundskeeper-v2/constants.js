const agentsList = [
  { key: 'DOTNET', id: 'dotnet', match: /^NET Version$/ },
  { key: 'GO', id: 'go', match: /^runtime.Version$/ },
  { key: 'JAVA', id: 'java', match: /^Java version$/ },
  { key: 'NODEJS', id: 'nodejs', match: /^Node.js version$/ },
  { key: 'PHP', id: 'php', match: /^Dispatcher$/ },
  { key: 'PYTHON', id: 'python', match: /^Python Version$/ },
  { key: 'RUBY', id: 'ruby', match: /^[J]?Ruby version$/ }
];

const AGENTS = agentsList.reduce(
  (acc, { key, id }) => ({ ...acc, [key]: id }),
  {}
);

const AGENTS_REGEX_STRING = agentsList.reduce(
  (acc, { id, match }) => ({ ...acc, [id]: match }),
  {}
);

const LANGUAGES = agentsList.map(({ id }) => id);

const RUNTIMES = {
  RUBY_JRUBY: {
    MATCH: /jruby/,
    KEY: 'jruby',
    DISPLAY: 'JRuby'
  },
  RUBY_CRUBY: {
    MATCH: /cruby/,
    KEY: 'cruby',
    DISPLAY: 'CRuby'
  },
  DOTNET_CORE: {
    MATCH: /Core/,
    KEY: 'core',
    DISPLAY: '.NET Core'
  },
  DOTNET_FRAMEWORK: {
    MATCH: /Framework/,
    KEY: 'framework',
    DISPLAY: '.Net Framework'
  }
};

const STATUS = {
  OK: 'ok',
  WARNING: 'warning',
  CRITICAL: 'critical'
};

const defaultReleaseNotes = {
  [AGENTS.GO]:
    'https://docs.newrelic.com/docs/release-notes/agent-release-notes/go-release-notes/',
  [AGENTS.JAVA]:
    'https://docs.newrelic.com/docs/release-notes/agent-release-notes/java-release-notes/',
  [AGENTS.DOTNET]:
    'https://docs.newrelic.com/docs/release-notes/agent-release-notes/net-release-notes/',
  [AGENTS.NODEJS]:
    'https://docs.newrelic.com/docs/release-notes/agent-release-notes/nodejs-release-notes/',
  [AGENTS.PYTHON]:
    'https://docs.newrelic.com/docs/release-notes/agent-release-notes/python-release-notes/',
  [AGENTS.PHP]:
    'https://docs.newrelic.com/docs/release-notes/agent-release-notes/php-release-notes/',
  [AGENTS.RUBY]:
    'https://docs.newrelic.com/docs/release-notes/agent-release-notes/ruby-release-notes/'
};

export {
  AGENTS,
  AGENTS_REGEX_STRING,
  LANGUAGES,
  RUNTIMES,
  STATUS,
  defaultReleaseNotes
};
