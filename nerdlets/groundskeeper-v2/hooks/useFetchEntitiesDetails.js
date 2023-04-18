import { useEffect, useRef, useState } from 'react';
import { useNerdGraphQuery } from 'nr1';
import semver from 'semver';
import { APPS_DETAILS } from '../queries';
import { AGENTS, AGENTS_REGEX_STRING, RUNTIMES } from '../constants';

const MAX_ENTITIES_IN_SET = 10;
const featuresList = {
  dtEnabled: 'newrelic.distributed_tracing.enabled',
  infTraceHost: 'newrelic.infinite_tracing.trace_observer_host',
  logEnabled: 'newrelic.application_logging.enabled'
};

const useFetchEntitiesDetails = ({ guidsToFetch = [] }) => {
  const [details, setDetails] = useState({});
  const [guidsQueue, setGuidsQueue] = useState([]);
  const [guids, setGuids] = useState([]);
  const [skip, setSkip] = useState(true);
  const indexMarker = useRef(0);
  const lastPropsGuids = useRef([]);
  const {
    data: detailsData,
    error: detailsError,
    loading: detailsLoading
  } = useNerdGraphQuery({
    query: APPS_DETAILS,
    variables: { guids },
    skip: skip
  });

  useEffect(() => {
    const guidsDiff = guidsToFetch.filter(
      gu => !lastPropsGuids.current.some(lpg => lpg === gu)
    );
    if (guidsDiff.length) {
      setGuidsQueue(gq => [...gq, ...guidsDiff]);
      lastPropsGuids.current = guidsToFetch;
    }
  }, [guidsToFetch]);

  useEffect(() => {
    if (!detailsLoading) fetchSet();
  }, [guidsQueue]);

  useEffect(() => {
    if (!guids || !guids.length) return;
    setSkip(false);
  }, [guids]);

  useEffect(() => {
    if (!details || !Object.keys(details).length) return;
    fetchSet();
  }, [details]);

  useEffect(() => {
    if (detailsError)
      console.error('Error fetching entity details', detailsError); // eslint-disable-line no-console
  }, [detailsError]);

  useEffect(() => {
    if (detailsLoading || !detailsData || !Object.keys(detailsData).length)
      return;
    setSkip(true);
    const { entities: entitiesDetails = [] } = detailsData.actor || {};
    const detailsObject = entitiesDetails.reduce(
      (acc, { guid, language, applicationInstances }) => ({
        ...acc,
        [guid]: applicationInstances
          ? entityDetails(applicationInstances, language)
          : {}
      }),
      {}
    );
    setDetails(deets => ({ ...deets, ...detailsObject }));
  }, [detailsData]);

  const fetchSet = () => {
    if (indexMarker.current < guidsQueue.length) {
      const index = indexMarker.current;
      const guidsList = guidsQueue.slice(index, index + MAX_ENTITIES_IN_SET);
      indexMarker.current = index + guidsList.length;
      setGuids(() => [...guidsList]);
    }
  };

  return { details };
};

const entityDetails = (applicationInstances = [], language) => {
  const {
    versions,
    runtimeTypes,
    osVersions,
    railsVersions,
    zts,
    features
  } = applicationInstances.reduce(
    (acc, applicationInstance) => {
      const {
        agentSettingsAttributes,
        environmentAttributes
      } = applicationInstance;
      acc.features = Object.keys(featuresList).reduce((feats, feat) => {
        if (acc.features[feat]) return feats;
        const agAttr = agentSettingsAttributes.find(
          ({ attribute }) => attribute && attribute === featuresList[feat]
        );
        if (agAttr) return { ...feats, [feat]: true };
        const envAttr = environmentAttributes.find(
          ({ attribute }) => attribute && attribute === featuresList[feat]
        );
        if (envAttr) return { ...feats, [feat]: true };
        return feats;
      }, acc.features);
      if (!environmentAttributes || !(language in AGENTS_REGEX_STRING))
        return acc;
      const versionRegexString = AGENTS_REGEX_STRING[language];
      const foundVersion = environmentAttributes.find(({ attribute }) =>
        versionRegexString.test(attribute)
      );
      if (!foundVersion) return acc;
      const ver = semver.valid(semver.coerce(foundVersion.value));
      if (acc.versions.every(v => v !== ver)) acc.versions.push(ver);
      const runtimeType = parseRuntimeType(language, foundVersion.value);
      if (runtimeType && acc.runtimeTypes.every(r => r !== runtimeType))
        acc.runtimeTypes.push(runtimeType);

      if (language === AGENTS.PHP) {
        acc.zts = acc.zts || /z/i.test(foundVersion.value);
        const foundOSVersion = environmentAttributes.find(({ attribute }) =>
          /OS version/.test(attribute)
        );
        if (foundOSVersion) {
          const osVer = foundOSVersion.value;
          if (acc.osVersions.every(v => v !== osVer))
            acc.osVersions.push(osVer);
        }
      } else if (language === AGENTS.RUBY) {
        const foundRailsVersion = environmentAttributes.find(({ attribute }) =>
          /Rails version/.test(attribute)
        );
        if (foundRailsVersion) {
          const railsVer = foundRailsVersion.value;
          if (acc.railsVersions.every(v => v !== railsVer))
            acc.railsVersions.push(railsVer);
        }
      }

      return acc;
    },
    {
      versions: [],
      runtimeTypes: [],
      osVersions: [],
      railsVersions: [],
      zts: false,
      features: { dtEnabled: false, infTraceHost: false, logEnabled: false }
    }
  );

  const display = versions.length === 1 ? versions[0] : versions.join(', ');
  const type =
    runtimeTypes.length === 1 ? runtimeTypes[0] : runtimeTypes.join(', ');
  const rails = {
    versions: railsVersions,
    display:
      railsVersions.length === 1 ? railsVersions[0] : railsVersions.join(', ')
  };

  return {
    runtimeVersions: {
      versions,
      display,
      type,
      osVersions,
      rails,
      zts,
      default: versions.length === 1 ? versions[0] : null
    },
    features
  };
};

const parseRuntimeType = (language, value) => {
  if (language === AGENTS.DOTNET) {
    return value.match(RUNTIMES.DOTNET_CORE.MATCH)
      ? RUNTIMES.DOTNET_CORE.DISPLAY
      : RUNTIMES.DOTNET_FRAMEWORK.DISPLAY;
  }
};

export default useFetchEntitiesDetails;
