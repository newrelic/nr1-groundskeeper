import { useEffect, useState } from 'react';
import { ngql, useEntitiesByDomainTypeQuery, useNerdGraphQuery } from 'nr1';
import semver from 'semver';
import { AGENT_RELEASES } from './queries';
import { AGENTS, AGENTS_REGEX_STRING, LANGUAGES, RUNTIMES } from './constants';

const entityFragmentExtension = ngql`
  fragment EntityFragmentExtension on ApmApplicationEntityOutline {
    language
    runningAgentVersions {
      maxVersion
      minVersion
    }
  }
`;

const useFetchEntities = () => {
  const [agentReleases, setAgentReleases] = useState({});
  const [latestReleases, setLatestReleases] = useState({});
  const {
    data: releaseData,
    error: releaseError,
    loading: releaseLoading,
  } = useNerdGraphQuery({ query: AGENT_RELEASES });
  const {
    data: { count, entities, nextCursor } = {},
    error: listingError,
    loading: listingLoading,
    fetchMore: listingFetchMore,
  } = useEntitiesByDomainTypeQuery({
    entityDomain: 'APM',
    entityType: 'APPLICATION',
    includeTags: true,
    entityFragmentExtension,
  });

  useEffect(() => {
    if (!listingLoading && listingFetchMore) listingFetchMore();
  }, [listingFetchMore]);

  useEffect(() => {
    if (listingError)
      console.error('Error fetching entities list', listingError);
    if (releaseError) console.error('Error fetching releases', releaseError);
  }, [listingError, releaseError]);

  useEffect(() => {
    if (!releaseData || !releaseData.docs) return;
    const { history, latest } = LANGUAGES.reduce(
      (acc, language) => {
        acc.history[language] = {};
        (releaseData.docs[language] || []).forEach(({ version, date: dt }) => {
          const date = new Date(`${dt}T00:00:00Z`);
          if (!(language in acc.latest) || date > acc.latest[language].date) {
            acc.latest[language] = { version, date };
          }
          acc.history[language][version] = date;
        });
        return acc;
      },
      { history: {}, latest: {} }
    );
    setAgentReleases(history);
    setLatestReleases(latest);
  }, [releaseData]);

  // useEffect(() => {
  //   console.log('HOOK', entities.length)
  // }, [entities]);

  // useEffect(() => {
  //   console.log('releases', agentReleases, latestReleases)
  // }, [agentReleases, latestReleases]);

  return {
    count,
    entities: sanitize(entities),
    agentReleases,
    latestReleases,
  };
};

const sanitize = entities =>
  entities.map(
    ({
      account: { id, name } = {},
      guid,
      name: appName,
      language,
      runningAgentVersions,
      tags = [],
    } = {}) => ({
      account: { id, name },
      guid,
      name: appName,
      language,
      tags: tags.reduce(
        (acc, { key, values }) => ({
          ...acc,
          [key]: values.length === 1 ? values[0] : values,
        }),
        {}
      ),
      agentVersions: agentVersions(runningAgentVersions),
    })
  );
// .filter(({language, agentVersions}) => language && LANGUAGES.some(lang => lang === language) && agentVersions.defaultVersion)

const agentVersions = runningAgentVersions => {
  let max, min, defaultVersion, display;
  if (runningAgentVersions) {
    ({ maxVersion: max, minVersion: min } = runningAgentVersions);
    defaultVersion = !min ? max : min;
    display = max && min && max !== min ? `${min} - ${max}` : defaultVersion;
  }
  return { max, min, default: defaultVersion, display };
};

const runtimeVersions = (applicationInstances = [], language) => {
  const { versions, runtimeTypes } = applicationInstances.reduce(
    (acc, { versionAttribs, dispatcherAttribs }) => {
      const environmentAttributes =
        language === AGENTS.PHP ? dispatcherAttribs : versionAttribs;
      const versionRegexString = AGENTS_REGEX_STRING[language];
      if (
        !environmentAttributes ||
        !environmentAttributes.length ||
        !versionRegexString
      )
        return acc;
      const versionRegex = new RegExp(versionRegexString, 'i');
      const didFindVersion = environmentAttributes.some(
        ({ attribute, value }) => {
          if (versionRegex.test(attribute)) {
            const ver = semver.valid(semver.coerce(value));
            if (acc.versions.every(v => v !== ver)) acc.versions.push(ver);
            const runtimeType = parseRuntimeType(language, value);
            if (runtimeType && acc.runtimeTypes.every(r => r !== runtimeType))
              acc.runtimeTypes.push(runtimeType);
            return true;
          }
          return false;
        }
      );
      return acc;
    },
    { versions: [], runtimeTypes: [] }
  );

  const display = versions.length === 1 ? versions[0] : versions.join(', ');
  const runtime = {
    type: runtimeTypes.length === 1 ? runtimeTypes[0] : runtimeTypes.join(', '),
  };

  return { versions, display, runtime };
};

const parseRuntimeType = (language, value) => {
  if (language === AGENTS.DOTNET) {
    return value.match(RUNTIMES.DOTNET_CORE.MATCH)
      ? RUNTIMES.DOTNET_CORE.DISPLAY
      : RUNTIMES.DOTNET_FRAMEWORK.DISPLAY;
  } else if (language === AGENTS.RUBY) {
    return value.match(RUNTIMES.RUBY_JRUBY.MATCH)
      ? RUNTIMES.RUBY_JRUBY.DISPLAY
      : RUNTIMES.RUBY_CRUBY.DISPLAY;
  }
};

export default useFetchEntities;
