import { useEffect, useState } from 'react';
import { ngql, useEntitiesByDomainTypeQuery, useNerdGraphQuery } from 'nr1';
import { AGENT_RELEASES } from '../queries';
import { LANGUAGES } from '../constants';

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
  const [entities, setEntities] = useState([]);
  const [agentReleases, setAgentReleases] = useState({});
  const [latestReleases, setLatestReleases] = useState({});
  const { data: releaseData, error: releaseError } = useNerdGraphQuery({
    query: AGENT_RELEASES
  });
  const {
    data: { count, entities: listingEntities } = {},
    error: listingError,
    loading,
    fetchMore: listingFetchMore
  } = useEntitiesByDomainTypeQuery({
    entityDomain: 'APM',
    entityType: 'APPLICATION',
    includeTags: true,
    limit: 200,
    entityFragmentExtension
  });

  useEffect(() => {
    if (listingEntities.length) {
      const sanitizedEntities = sanitize(listingEntities);
      setEntities(ents => [...ents, ...sanitizedEntities]);
    }
  }, [listingEntities]);

  useEffect(() => {
    if (listingFetchMore) listingFetchMore();
  }, [listingFetchMore]);

  useEffect(() => {
    /* eslint-disable no-console */
    if (listingError)
      console.error('Error fetching entities list', listingError);
    if (releaseError) console.error('Error fetching releases', releaseError);
    /* eslint-enable no-console */
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

  return {
    count,
    entities,
    loading,
    agentReleases,
    latestReleases
  };
};

const sanitize = entities =>
  entities.map(
    ({
      account: { id, name } = {},
      guid,
      name: appName,
      language,
      reporting,
      runningAgentVersions,
      tags = []
    } = {}) => ({
      account: { id, name },
      guid,
      name: appName,
      language,
      reporting,
      tags: tags.reduce(
        (acc, { key, values }) => ({
          ...acc,
          [key]: values.length === 1 ? values[0] : values
        }),
        {}
      ),
      agentVersions: agentVersions(runningAgentVersions)
    })
  );

const agentVersions = runningAgentVersions => {
  let max;
  let min;
  let defaultVersion;
  let display;
  if (runningAgentVersions) {
    ({ maxVersion: max, minVersion: min } = runningAgentVersions);
    defaultVersion = !min ? max : min;
    display = max && min && max !== min ? `${min} - ${max}` : defaultVersion;
  }
  return { max, min, default: defaultVersion, display };
};

export default useFetchEntities;
