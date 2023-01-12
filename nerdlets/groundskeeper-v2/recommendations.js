import semver from 'semver';
import { AGENTS, RUNTIMES, STATUS } from './constants';

const LATEST = 'LATEST';
const MS_IN_DAY = 1000 * 60 * 60 * 24;

const recommendations = {
  [AGENTS.DOTNET]: {
    [RUNTIMES.DOTNET_CORE.KEY]: [
      {
        match: '2.0 - 3.0',
        version: '9.9.0',
        status: STATUS.WARNING,
        message: '',
      },
      { match: '>=3.1', version: LATEST, status: STATUS.WARNING, message: '' },
    ],
    [RUNTIMES.DOTNET_FRAMEWORK.KEY]: [
      {
        match: '<=4.0',
        version: '6.22.0',
        status: STATUS.WARNING,
        message: '',
      },
      {
        match: '4.5.0 - 4.6.1',
        version: '9.9.0',
        status: STATUS.WARNING,
        message: '',
      },
      {
        match: '>=4.6.2',
        version: LATEST,
        status: STATUS.WARNING,
        message: '',
      },
    ],
  },
  [AGENTS.GO]: [
    {
      match: '<1.7',
      version: null,
      status: STATUS.CRITICAL,
      message: 'Runtime not supported!',
    },
    {
      match: '1.7 - 1.16',
      version: '3.19.1',
      status: STATUS.CRITICAL,
      message: 'Golang version out of support. Please upgrade.',
    },
    {
      match: '1.17.x',
      version: LATEST,
      status: STATUS.CRITICAL,
      message: 'Golang version out of support. Please upgrade.',
    },
    {
      match: '1.18 - 1.19.x',
      version: LATEST,
      status: STATUS.WARNING,
      message: '',
    },
  ],
  [AGENTS.JAVA]: [
    {
      match: '<=1.6.x',
      version: null,
      status: STATUS.CRITICAL,
      message: 'No supported agent version',
    },
    { match: '1.7.x', version: '6.5.4', status: STATUS.WARNING, message: '' },
    { match: '>1.7.x', version: LATEST, status: STATUS.WARNING, message: '' },
  ],
  [AGENTS.NODEJS]: [
    { match: '10.x', version: '7.5.2', status: STATUS.WARNING, message: '' },
    { match: '12.x', version: '8.17.0', status: STATUS.WARNING, message: '' },
    {
      match: '14.x || 16.x || 18.x',
      version: LATEST,
      status: STATUS.WARNING,
      message: '',
    },
  ],
  [AGENTS.PHP]: [
    {
      match: '<7.4',
      version: null,
      status: STATUS.CRITICAL,
      message: 'No supported agent version',
    },
    { match: '>=7.4', version: LATEST, status: STATUS.WARNING, message: '' },
  ],
  [AGENTS.PYTHON]: [
    {
      match: '<=2.6.x',
      version: null,
      status: STATUS.CRITICAL,
      message: 'No supported agent version',
    },
    {
      match: '2.6.x || 3.3',
      version: '3.4.0.95',
      status: STATUS.WARNING,
      message: '',
    },
    {
      match: '3.4.x',
      version: '4.20.0.120',
      status: STATUS.WARNING,
      message: '',
    },
    {
      match: '3.5.x',
      version: '5.24.0.153',
      status: STATUS.WARNING,
      message: '',
    },
    {
      match: '3.6.x',
      version: '7.16.0.178',
      status: STATUS.WARNING,
      message: '',
    },
    {
      match: '2.7 || >=3.7.x',
      version: LATEST,
      status: STATUS.WARNING,
      message: '',
    },
  ],
  [AGENTS.RUBY]: {
    [RUNTIMES.RUBY_CRUBY.KEY]: [
      {
        match: '<2.0.x',
        version: null,
        status: STATUS.CRITICAL,
        message: 'No supported agent version',
      },
      {
        match: '2.0.x - 2.1.x',
        version: '6.15.0',
        status: STATUS.WARNING,
        message: '',
      },
      {
        match: '>=2.2.x',
        version: LATEST,
        status: STATUS.WARNING,
        message: '',
      },
    ],
    [RUNTIMES.RUBY_JRUBY.KEY]: [
      {
        match: '<9.0.x',
        version: null,
        status: STATUS.CRITICAL,
        message: 'No supported agent version',
      },
      {
        match: '>=9.0.x',
        version: LATEST,
        status: STATUS.WARNING,
        message: '',
      },
    ],
  },
};

const recommend = (
  { runtimeVersions: { default: runtimeVersion, type: runtimeType } = {} } = {},
  { language, agentVersions: { default: currentVersion } = {} } = {},
  latestReleases,
  agentReleases
) => {
  if (!runtimeVersion || !language) return {};
  let version, status, message, age;
  const agentRecommendations = runtimeType
    ? recommendations[language][runtimeKey(language, runtimeType)]
    : recommendations[language];
  if (agentRecommendations && agentRecommendations.length) {
    agentRecommendations.some(recommendation => {
      if (semver.satisfies(runtimeVersion, recommendation.match)) {
        version =
          recommendation.version === LATEST
            ? latestReleases[language].version
            : recommendation.version;
        status = recommendation.status;
        message = recommendation.message;
        return true;
      }
      return false;
    });
    if (latestReleases[language].version === currentVersion) {
      status = STATUS.OK;
      message = 'Running latest version!';
    } else if (version === currentVersion) {
      status = STATUS.OK;
      message = 'Running recommended version!';
    }
    const releases = agentReleases[language];
    if (currentVersion && releases)
      age = howOld(version, currentVersion, releases);
  }
  return { version, status, message, age };
};

const howOld = (recommendedVersion, currentVersion, releases) => {
  const daysOld =
    (releases[recommendedVersion] - releases[currentVersion]) / MS_IN_DAY;
  if (!daysOld) return { days: daysOld, display: '' };
  if (daysOld > 365) {
    const [years, plural] = [Math.trunc(daysOld / 365), daysOld % 365];
    return {
      days: daysOld,
      display: `${plural ? 'over' : ''} ${years} year${
        years > 1 ? 's' : ''
      } old`,
    };
  }
  if (daysOld > 30) {
    const [months, plural] = [Math.trunc(daysOld / 30), daysOld % 30];
    return {
      days: daysOld,
      display: `${plural ? 'over' : ''} ${months} month${
        months > 1 ? 's' : ''
      } old`,
    };
  }
  return { days: daysOld, display: `${daysOld} days old` };
};

const runtimeKey = (language, runtimeType) => {
  if (language === AGENTS.DOTNET) {
    if (runtimeType === RUNTIMES.DOTNET_CORE.DISPLAY)
      return RUNTIMES.DOTNET_CORE.KEY;
    if (runtimeType === RUNTIMES.DOTNET_FRAMEWORK.DISPLAY)
      return RUNTIMES.DOTNET_FRAMEWORK.KEY;
  } else if (language === AGENTS.RUBY) {
    if (runtimeType === RUNTIMES.RUBY_CRUBY.DISPLAY)
      return RUNTIMES.RUBY_CRUBY.KEY;
    if (runtimeType === RUNTIMES.RUBY_JRUBY.DISPLAY)
      return RUNTIMES.RUBY_JRUBY.KEY;
  }
};

export { recommend };
