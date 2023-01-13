import semver from 'semver';
import { AGENTS } from './constants';

const cveList = {
  [AGENTS.JAVA]: {
    '6.5.4': [
      {
        display: 'CVE-2021-44832',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/java-release-notes/java-agent-654'
      }
    ],
    '6.5.3': [
      {
        display: 'CVE-2021-45105',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/java-release-notes/java-agent-6.5.3'
      }
    ],
    '6.5.2': [
      {
        display: 'CVE-2021-45046',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/java-release-notes/java-agent-652'
      }
    ],
    '6.5.1': [
      {
        display: 'CVE-2021-44228',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/java-release-notes/java-agent-651'
      }
    ],
    '7.4.2': [
      {
        display: 'CVE-2021-45046',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/java-release-notes/java-agent-742'
      }
    ],
    '7.4.3': [
      {
        display: 'CVE-2021-45105',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/java-release-notes/java-agent-743'
      }
    ],
    '7.4.1': [
      {
        display: 'CVE-2021-44228',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/java-release-notes/java-agent-741'
      }
    ],
    '7.5.0': [
      {
        display: 'CVE-2021-44832',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/java-release-notes/java-agent-750'
      },
      {
        display: 'CVE-2017-14063',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/java-release-notes/java-agent-750'
      }
    ],
    '7.9.0': [
      {
        display: 'CVE-2020-29582',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/java-release-notes/java-agent-790'
      }
    ]
  },
  [AGENTS.GO]: {
    '3.15.0': [
      {
        display: 'CVE-2020-28483',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/go-release-notes/go-agent-3-15-0'
      }
    ],
    '3.16.1': [
      {
        display: 'CVE-2020-9283',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/go-release-notes/go-agent-3-16-1'
      }
    ]
  },
  [AGENTS.NODEJS]: {
    '4.0.0': [
      {
        display: 'CVE-2018-3739',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/nodejs-release-notes/node-agent-400'
      }
    ],
    '5.13.1': [
      {
        display: 'https-proxy-agent fix',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/nodejs-release-notes/node-agent-5131'
      }
    ],
    '8.12.0': [
      {
        display: 'CVE-2022-25878',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/nodejs-release-notes/node-agent-8-12-0'
      }
    ],
    '8.14.1': [
      {
        display: '@grpc/proto-loader fix',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/nodejs-release-notes/node-agent-8-14-1'
      }
    ]
  },
  [AGENTS.RUBY]: {
    '6.12.0': [
      {
        display: 'CVE-2020-8130',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/ruby-release-notes/ruby-agent-6120367'
      }
    ],
    '8.0.0': [
      {
        display: 'Rack updated for security fix',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/ruby-release-notes/ruby-agent-800'
      }
    ]
  },
  [AGENTS.DOTNET]: {
    '9.9.0.0': [
      {
        display: 'CWE-755',
        releaseNotes:
          'https://docs.newrelic.com/docs/release-notes/agent-release-notes/net-release-notes/net-agent-9900'
      }
    ]
  }
};

const exposures = ({
  language,
  agentVersions: { default: agentVersion } = {}
} = {}) => {
  if (!language || !agentVersion) return {};
  const cveForLang = cveList[language];
  if (!cveForLang) return {};
  const versions = Object.keys(cveForLang);
  if (!versions.length) return {};
  const { count, list } = versions.reduce(
    ({ count, list }, ver) =>
      semver.satisfies(agentVersion, `<${ver}`)
        ? {
            count: count + cveForLang[ver].length,
            list: [...list, ...cveForLang[ver]]
          }
        : { count, list },
    { count: 0, list: [] }
  );
  return { count, list };
};

export { exposures };
