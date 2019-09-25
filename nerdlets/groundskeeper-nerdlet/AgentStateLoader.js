import React from 'react';
import PropTypes from 'prop-types';

import { NerdGraphQuery } from 'nr1';

const AGENT_NG_QUERY_DAY = `query($id: Int!) {
    actor {
        account(id: $id) {
            nrql(query: "FROM NrDailyUsage select uniques(apmAgentVersion), latest(apmLanguage) as 'language', latest(apmAppName) as 'appName' since 1 day ago facet apmAppId limit 2000") {
                results
            }
        }
    }
}`;
const AGENT_NG_QUERY_WEEK = `query($id: Int!) {
    actor {
        account(id: $id) {
            nrql(query: "FROM NrDailyUsage select uniques(apmAgentVersion), latest(apmLanguage) as 'language', latest(apmAppName) as 'appName' since 1 week ago facet apmAppId limit 2000") {
                results
            }
        }
    }
}`;

export default class AgentStateLoader extends React.Component {
  static propTypes = {
    accountId: PropTypes.number.isRequired,
    dataLoaded: PropTypes.func.isRequired,
    weekly: PropTypes.bool,
  };

  state = {
    resultsSent: false,
  };

  sendResults = (agentData, error) => {
    const that = this;
    const { accountId, dataLoaded } = this.props;
    const { resultsSent } = this.state;

    if (!resultsSent) {
      dataLoaded(accountId, agentData, error);
      setTimeout(() => {
        that.setState({ resultsSent: true });
      }, 100);
    }
  };

  render() {
    const { accountId, weekly } = this.props;
    const {
      sendResults,
      state: { resultsSent },
    } = this;

    return (
      <NerdGraphQuery
        query={weekly ? AGENT_NG_QUERY_WEEK : AGENT_NG_QUERY_DAY}
        variables={{ id: accountId }}
      >
        {({ loading, error, data }) => {
          if (loading) {
            return (
              <span
                className="loader-active"
                title={`Loading data from account ${accountId}`}
              >
                -
              </span>
            );
          } else if (error || !data) {
            sendResults(undefined, error);
            return (
              <span
                className="loader-error"
                title={`Error loading data from account ${accountId}\nThis is a known limit in accounts with many applications`}
              >
                X
              </span>
            );
          } else {
            if (!resultsSent) {
              // avoid computation if we've already sent our results
              const appInfo = data.actor.account.nrql.results.map(result => {
                return {
                  accountId,
                  appId: result.apmAppId,
                  agentVersions: result.members,
                  language: result.language,
                  appName: result.appName,
                };
              });
              sendResults(appInfo);
            }
            return (
              <span
                className="loader-success"
                title={`Loaded data from account ${accountId}`}
              >
                ✓
              </span>
            );
          }
        }}
      </NerdGraphQuery>
    );
  }
}
