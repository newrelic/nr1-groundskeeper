import semver from 'semver';
import { AGENTS } from './constants';

const cveList = {
  [AGENTS.JAVA]: {
    '6.5.4': ['CVE-2021-44832'],
    '6.5.3': ['CVE-2021-45105'],
    '6.5.2': ['CVE-2021-45046'],
    '6.5.1': ['CVE-2021-44228'],
    '7.4.2': ['CVE-2021-45046'],
    '7.4.3': ['CVE-2021-45105'],
    '7.4.1': ['CVE-2021-44228'],
    '7.5.0': ['CVE-2021-44832', 'CVE-2017-14063'],
    '7.9.0': ['CVE-2020-29582'],
  },
  [AGENTS.GO]: {
    '3.15.0': ['CVE-2020-28483'],
    '3.16.1': ['CVE-2020-9283'],
  },
  [AGENTS.NODEJS]: {
    '4.0.0': ['CVE-2018-3739'],
    '5.13.1': ['https-proxy-agent fix'],
    '8.12.0': ['CVE-2022-25878'],
    '8.14.1': ['@grpc/proto-loader fix'],
  },
  [AGENTS.RUBY]: {
    '6.12.0': ['CVE-2020-8130'],
    '8.0.0': ['Rack updated for security fix'],
  },
  [AGENTS.DOTNET]: {
    '9.9.0.0': ['CWE-755'],
  },
};

const exposures = ({
  language,
  agentVersions: { default: agentVersion } = {},
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
            list: [...list, ...cveForLang[ver]],
          }
        : { count, list },
    { count: 0, list: [] }
  );
  return { count, list };
};

export { exposures };
