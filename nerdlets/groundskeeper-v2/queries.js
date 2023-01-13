import { ngql } from 'nr1';
import { AGENTS } from './constants';

const AGENT_RELEASES = ngql`
{
  docs {
    ${Object.keys(AGENTS).map(
      key => `
      ${AGENTS[key]}: agentReleases(agentName: ${key}) {
        date
        version
      }
    `
    )}
  }
}
`;

const APPS_LIST = ngql`
query AppsList($cursor: String) {
  actor {
    entitySearch(queryBuilder: {domain: APM, type: APPLICATION}) {
      results(cursor: $cursor) {
        nextCursor
        entities {
          ... on ApmApplicationEntityOutline {
            guid
            name
          }
        }
      }
    }
  }
}
`;

const APPS_DETAILS = ngql`
query AppsDetails($guids: [EntityGuid]) {
  actor {
    entities(guids: $guids) {
      ... on ApmApplicationEntity {
        guid
        language
        applicationInstances {
          agentSettingsAttributes(filter: {contains: "newrelic."}) {
            attribute
            value
          }
          environmentAttributes {
            attribute
            value
          }
        }
      }
    }
  }
}
`;

export { AGENT_RELEASES, APPS_LIST, APPS_DETAILS };
