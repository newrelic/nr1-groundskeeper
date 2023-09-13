import { useEffect, useRef, useState } from 'react';
import { NerdGraphQuery } from 'nr1';
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
  const [loading, setLoading] = useState(false);
  const indexMarker = useRef(0);
  const lastPropsGuids = useRef([]);

  useEffect(() => {
    const guidsDiff = guidsToFetch.filter(
      gu => !lastPropsGuids.current.some(lpg => lpg === gu)
    );
    // eslint-disable-next-line no-console
    console.log(
      `fetch details for ${guidsToFetch?.length} apps (${guidsDiff.length} uniques)`
    );
    if (guidsDiff.length) {
      setGuidsQueue(gq => [...gq, ...guidsDiff]);
      lastPropsGuids.current = guidsToFetch;
    }
  }, [guidsToFetch]);

  useEffect(() => {
    if (!loading) fetchSet();
  }, [guidsQueue]);

  useEffect(async () => {
    if (!guids || !guids.length) return;
    (async () => {
      setLoading(true);
      performance.mark('fetch-details-query:start');
      const {
        data,
        error,
        loading: isQueryLoading
      } = await NerdGraphQuery.query({
        query: APPS_DETAILS,
        variables: { guids }
      });
      performance.mark('fetch-details-query:end');
      const { duration } = performance.measure(
        'fetch-details-query:measure',
        'fetch-details-query:start',
        'fetch-details-query:end'
      );
      if (error) console.error('Error fetching entity details', error, guids); // eslint-disable-line no-console
      setLoading(isQueryLoading);
      if (!isQueryLoading && data) {
        const { entities: entitiesDetails = [] } = data?.actor || {};
        const detailsObject = entitiesDetails.reduce(
          (acc, { guid, language, applicationInstances }) => ({
            ...acc,
            [guid]: applicationInstances
              ? entityDetails(applicationInstances, language)
              : {}
          }),
          {}
        );
        // eslint-disable-next-line no-console
        console.log(
          `details query results: ${entitiesDetails?.length} entities in ${duration}`
        );
        setDetails(deets => ({ ...deets, ...detailsObject }));
        fetchSet();
      } else {
        console.log(`details query with no data in ${duration}`); // eslint-disable-line no-console
      }
    })();
  }, [guids]);

  const fetchSet = () => {
    const curIndex = indexMarker.current;
    if (curIndex < guidsQueue.length) {
      const guidsList = guidsQueue.slice(
        curIndex,
        curIndex + MAX_ENTITIES_IN_SET
      );
      const nextSetMarker = curIndex + guidsList.length;
      indexMarker.current = nextSetMarker;
      console.log(`fetch details batch ${curIndex} - ${nextSetMarker}`); // eslint-disable-line no-console
      setGuids([...guidsList]);
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
        agentSettingsAttributes = [],
        environmentAttributes = []
      } = applicationInstance;
      acc.features = Object.keys(featuresList).reduce((feats, feat) => {
        if (acc.features[feat]) return feats;
        const agAttr = agentSettingsAttributes.find(attr =>
          featuresCheck(attr, feat)
        );
        if (agAttr) return { ...feats, [feat]: true };
        const envAttr = environmentAttributes.find(attr =>
          featuresCheck(attr, feat)
        );
        if (envAttr) return { ...feats, [feat]: true };
        return feats;
      }, acc.features);
      if (!environmentAttributes.length || !(language in AGENTS_REGEX_STRING))
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

const featuresCheck = ({ attribute = '', value = '' }, feature = '') => {
  if (attribute !== featuresList[feature] || !value) return false;
  const val = value.toLowerCase();
  return val !== 'false' && val !== 'none' && value !== '0';
};

export default useFetchEntitiesDetails;
