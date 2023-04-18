import { useEffect, useState } from 'react';
import { ngql, useNerdGraphQuery } from 'nr1';
import semver from 'semver';
import {
  AGENTS,
  AGENTS_REGEX_STRING,
  RUNTIMES
} from '../../groundskeeper-v2/constants';

const featuresList = {
  dtEnabled: 'newrelic.distributed_tracing.enabled',
  infTraceHost: 'newrelic.infinite_tracing.trace_observer_host',
  logEnabled: 'newrelic.application_logging.enabled'
};

const APPS_DETAIL = ngql`
query AppsDetail($guids: [EntityGuid]) {
  actor {
    entities(guids: $guids) {
      ... on ApmApplicationEntity {
        account {
          id
          name
        }
        applicationInstances {
          agentSettingsAttributes {
            attribute
            value
          }
          environmentAttributes {
            attribute
            value
          }
        }
        guid
        language
        name
        runningAgentVersions {
          maxVersion
          minVersion
        }
      }
    }
  }
}
`;

const useFetchEntity = ({ guid, skip = true }) => {
  const [entity, setEntity] = useState({});
  const { data, error, loading } = useNerdGraphQuery({
    query: APPS_DETAIL,
    variables: { guids: [guid] },
    skip
  });

  useEffect(() => {
    if (!data?.actor?.entities?.length) return;

    const [
      {
        account: { __typename, ...account } = {},
        applicationInstances: instances,
        guid,
        language,
        name,
        runningAgentVersions
      } = {}
    ] = data.actor.entities;

    const { maxVersion: max, minVersion: min } = runningAgentVersions || {};

    setEntity({
      account,
      agentVersions: { max, min },
      applicationInstances: {
        details: instanceDetails(instances, language),
        length: instances.length
      },
      guid,
      language,
      name
    });
  }, [data]);

  return { entity, error, loading };
};

const instanceDetails = (instances = [], language) => {
  const versionRegexString = AGENTS_REGEX_STRING[language];
  return instances.map(inst => {
    const { agentSettingsAttributes, environmentAttributes } = inst;
    const runtime = {};
    const features = Object.keys(featuresList).reduce((acc, feat) => {
      const foundASAttr = agentSettingsAttributes.find(
        ({ attribute }) => attribute && attribute === featuresList[feat]
      );
      if (foundASAttr) {
        acc[feat] = foundASAttr.value;
      } else {
        const foundEnvAttr = environmentAttributes.find(
          ({ attribute }) => attribute && attribute === featuresList[feat]
        );
        if (foundEnvAttr) {
          acc[feat] = foundEnvAttr.value;
        }
      }
      return acc;
    }, {});

    if (environmentAttributes && versionRegexString) {
      const foundVersion = environmentAttributes.find(({ attribute }) =>
        versionRegexString.test(attribute)
      );
      runtime.version = foundVersion
        ? semver.valid(semver.coerce(foundVersion.value))
        : '';
      runtime.type = parseRuntimeType(language, foundVersion.value);

      if (language === AGENTS.PHP) {
        runtime.zts = /z/i.test(foundVersion.value);
        runtime.osVersion = (
          environmentAttributes.find(({ attribute }) =>
            /OS version/.test(attribute)
          ) || {}
        ).value;
      } else if (language === AGENTS.RUBY) {
        runtime.railsVersion = (
          environmentAttributes.find(({ attribute }) =>
            /Rails version/.test(attribute)
          ) || {}
        ).value;
      }
    }
    return { features, runtime };
  });
};

const parseRuntimeType = (language, value) => {
  if (language === AGENTS.DOTNET) {
    return value.match(RUNTIMES.DOTNET_CORE.MATCH)
      ? RUNTIMES.DOTNET_CORE.DISPLAY
      : RUNTIMES.DOTNET_FRAMEWORK.DISPLAY;
  }
};

export default useFetchEntity;
