import './styles.scss';

import React from 'react';

import { NerdGraphQuery, Spinner, Tabs, TabsItem } from 'nr1';

import TableWrapper from './components/TableWrapper';
import AgentVersion from './components/AgentVersion';

import {
  linkedAppId,
  agentAge,
  cleanAgentVersion,
  agentVersionInList,
} from './helpers';
import { ACCOUNT_NG_QUERY, ENTITY_NG_QUERY } from './queries';

const moment = require('moment');

const AGENT_SLO = {
  MOST_RECENT: 0,
  TWO_WEEKS: 14,
  ONE_MONTH: 30,
  SIX_MONTHS: 182,
  ONE_YEAR: 365,
};

const AGENT_SLO_LABELS = {
  0: 'the latest agents',
  14: 'agents < 2 weeks old',
  30: 'agents < 1 month old',
  182: 'agents < 6 months old',
  365: 'agents < 1 year old (Support cutoff)',
};

export default class Groundskeeper extends React.Component {
  state = {
    loadingInitialState: true,
    loadError: false,

    agentSLO: AGENT_SLO.TWO_WEEKS,

    agentData: [],
    tags: {},
    presentationData: {},
    accounts: {},
    agentVersions: {},
    freshAgentVersions: {},
    scanIsRunning: true,

    filterKey: undefined,
    filterValue: undefined,
  };

  componentDidMount() {
    this.loadInitialData();
  }

  loaders = undefined;
  initialEntityDataSet = false;

  setFilterKey = event => {
    const key = event.target.value;
    this.setState(
      { filterKey: key || undefined, filterValue: undefined },
      () => {
        this.recomputePresentation(this.state.agentData);
      }
    );
  };

  setFilterValue = event => {
    const val = event.target.value;
    this.setState({ filterValue: val || undefined }, () => {
      this.recomputePresentation(this.state.agentData);
    });
  };

  updateAgentSLO = event => {
    const newSlo = parseInt(event.target.value);
    if (newSlo === this.state.agentSLO) {
      return;
    }

    const newState =
      Object.values(AGENT_SLO).indexOf(newSlo) >= 0
        ? { agentSLO: newSlo }
        : { agentSLO: AGENT_SLO.MOST_RECENT };

    this.setState(newState, () => {
      this.recomputeFreshAgentVersions(this.state.agentVersions);
    });
  };

  loadInitialData = () => {
    const that = this;
    NerdGraphQuery.query({
      query: ACCOUNT_NG_QUERY,
    })
      .then(res => {
        const { loading, data, errors } = res;
        if (loading) {
          that.setState({ loadingInitialState: true });
          return;
        }
        if (errors) {
          /* eslint-disable no-console */
          console.log('account query error', errors);
          /* eslint-enable no-console */
          that.setState({ loadingInitialState: false, loadError: true });
          return;
        }
        if (data) {
          that.setAccountList(data.actor.accounts);
          that.setAgentVersions(data.docs);

          const entities = data.actor.entitySearch.results.entities;
          const cursor = data.actor.entitySearch.results.nextCursor;
          that.setEntityData(entities, undefined);
          if (cursor) {
            that.setState({ scanIsRunning: true });
            that.getMoreEntityData(cursor);
          } else {
            that.setState({ scanIsRunning: false });
          }
        }
        that.setState({ loadingInitialState: false, loadError: false });
      })
      .catch(err => {
        /* eslint-disable no-console */
        console.log('account query error', err);
        /* eslint-enable no-console */
        that.setState({ loading: false, loadError: true });
      });
  };

  getMoreEntityData = cursor => {
    const that = this;
    NerdGraphQuery.query({
      query: ENTITY_NG_QUERY,
      variables: { queryCursor: cursor },
    })
      .then(res => {
        const { loading, data, errors } = res;
        if (loading) return;
        if (errors) {
          /* eslint-disable no-console */
          console.log('entity query error', errors);
          /* eslint-enable no-console */
          return;
        }
        if (data) {
          const entities = data.actor.entitySearch.results.entities;
          const cursor = data.actor.entitySearch.results.nextCursor;
          that.setEntityData(entities, undefined);
          if (cursor) {
            that.setState({ scanIsRunning: true });
            that.getMoreEntityData(cursor);
          } else {
            that.setState({ scanIsRunning: false });
          }
        }
      })
      .catch(err => {
        /* eslint-disable no-console */
        console.log('cursored query error', err);
        /* eslint-enable no-console */
      });
  };

  setAccountList = accountList => {
    const accts = {};
    accountList.forEach(acct => {
      accts[acct.id] = acct.name;
    });
    this.setState({ accounts: accts });
  };

  setAgentVersions = agentList => {
    const agentVersions = {};

    Object.keys(agentList).forEach(language => {
      const al = agentList[language];
      if (al && al.map && al.length > 0) {
        agentVersions[language] = al
          .map(ver => {
            return {
              version: cleanAgentVersion(ver.version),
              date: moment(ver.date),
            };
          })
          .sort((a, b) => {
            if (a.date > b.date) return -1;
            if (b.date < a.date) return 1;
            return 0;
          });
      }
    });

    this.setState({ agentVersions, presentationData: {} }, () => {
      this.recomputeFreshAgentVersions(agentVersions);
    });
  };

  setEntityData = (data, error) => {
    const { tags, agentData } = this.state;
    if (data) {
      const newData = data
        .filter(ent => {
          if (!ent.runningAgentVersions) return false;
          const isPresent = agentData.find(
            a => a.accountId === ent.account.id && a.appId === ent.applicationId
          );
          return !isPresent;
        })
        .map(ent => {
          ent.tags.forEach(({ key, values }) => {
            if (!tags[key]) {
              tags[key] = [];
            }
            values.forEach(val => {
              if (tags[key].indexOf(val) < 0) {
                tags[key].push(val);
              }
            });
          });

          const versions =
            ent.runningAgentVersions.minVersion ===
            ent.runningAgentVersions.maxVersion
              ? [ent.runningAgentVersions.maxVersion]
              : [
                  ent.runningAgentVersions.maxVersion,
                  ent.runningAgentVersions.minVersion,
                ];

          return {
            accountId: ent.account.id,
            accountName: ent.account.name,
            appId: ent.applicationId,
            guid: ent.guid,
            appName: ent.name,
            language: ent.language,
            agentVersions: versions,
            tags: ent.tags,
          };
        });
      if (newData.length > 0) {
        this.setState({ tags });
        const agentData = this.state.agentData.concat(newData);
        this.recomputePresentation(agentData);
      }
    } else if (error) {
      /* eslint-disable no-console */
      console.log(`Error fetching entity status`, error);
      /* eslint-enable no-console */
      this.setState({ loadError: true });
    }
  };

  recomputeFreshAgentVersions = agentVersions => {
    const { agentSLO } = this.state;
    const freshCutoff = agentSLO ? moment().subtract(agentSLO, 'days') : null;
    const freshAgentVersions = {};

    Object.keys(agentVersions).forEach(language => {
      const al = agentVersions[language];

      if (al && al.map && al.length > 0) {
        freshAgentVersions[language] = al
          .filter((ver, index) => {
            if (index === 0) return true;
            return freshCutoff && freshCutoff.isSameOrBefore(ver.date);
          })
          .map(ver => ver.version);
      }
    });

    this.setState({ freshAgentVersions }, () => {
      this.recomputePresentation(this.state.agentData);
    });
  };

  recomputePresentation = agentData => {
    const presentationData = this.analyze(agentData);
    this.setState({ agentData, presentationData });
  };

  analyze = agentData => {
    const {
      accounts,
      agentVersions,
      freshAgentVersions,
      filterKey,
      filterValue,
    } = this.state;

    const analysis = {
      current: [],
      old: [],
      multipleVersions: [],
    };

    agentData.forEach(info => {
      const freshVersions = freshAgentVersions[info.language];
      if (!freshVersions || freshVersions.length < 1) {
        return;
      }
      if (filterKey && filterValue) {
        const tag = info.tags.find(t => t.key === filterKey);
        if (!tag || tag.values.indexOf(filterValue) < 0) return;
      }

      if (info.agentVersions.length > 1) {
        analysis.multipleVersions.push(info);
      } else if (agentVersionInList(info.agentVersions[0], freshVersions)) {
        analysis.current.push(info);
      } else {
        analysis.old.push(info);
      }
    });

    analysis.currentTable = {
      columns: ['Account', 'AppId', 'App name', 'Language', 'Agent Version'],
      data: analysis.current.map(info => {
        return [
          accounts[info.accountId] || info.accountId,
          linkedAppId(info.accountId, info.appId),
          info.appName,
          info.language,
          info.agentVersions.join(', '),
        ];
      }),
    };
    const now = moment();
    analysis.outdatedTable = {
      columns: [
        'Agent age',
        'Account',
        'AppId',
        'App name',
        'Language',
        'Agent Version',
      ],
      data: analysis.old
        .sort((a, b) => {
          const ageA = agentAge(a, agentVersions);
          const ageB = agentAge(b, agentVersions);
          if (!ageA && !ageB) return 0;
          if (!ageA) return 1;
          if (!ageB) return -1;
          const d = ageA.diff(ageB);
          if (d < 0) return -1;
          if (d > 0) return 1;
          return 0;
        })
        .map(info => {
          const age = agentAge(info, agentVersions);
          const ageText = age ? `${now.diff(age, 'weeks')} weeks old` : '?';
          return [
            ageText,
            accounts[info.accountId] || info.accountId,
            linkedAppId(info.accountId, info.appId),
            info.appName,
            info.language,
            info.agentVersions.join(', '),
          ];
        }),
    };
    analysis.multiversionTable = {
      columns: ['Account', 'AppId', 'App name', 'Language', 'Agent Versions'],
      data: analysis.multipleVersions.map(info => {
        return [
          accounts[info.accountId] || info.accountId,
          linkedAppId(info.accountId, info.appId),
          info.appName,
          info.language,
          info.agentVersions.join(', '),
        ];
      }),
    };

    return analysis;
  };

  render() {
    const {
      updateAgentSLO,
      setFilterKey,
      setFilterValue,
      state: {
        agentData,
        agentSLO,
        presentationData,
        agentVersions,
        freshAgentVersions,
        loadingInitialState,
        loadError,
        scanIsRunning,
        tags,
        filterKey,
        filterValue,
      },
    } = this;

    if (loadingInitialState) {
      return (
        <div className="gk-content">
          <Spinner fillContainer />
          <div>Please enjoy the emptiness while I survey your estate...</div>
        </div>
      );
    }

    const upToDateLabel = AGENT_SLO_LABELS[agentSLO];
    const scanner = scanIsRunning ? <Spinner inline /> : undefined;

    return (
      <div className="gk-content">
        {loadError ? (
          <h3>
            An error occurred while loading data. Please check your browser
            console.
          </h3>
        ) : (
          undefined
        )}

        {agentData.length ? (
          <div className="report">
            <div className="agent-table">
              <div className="filter-bar">
                <div className="filter-block">
                  <label>My Upgrade SLO is</label>
                  <select value={agentSLO} onChange={updateAgentSLO}>
                    {Object.values(AGENT_SLO).map(slo => (
                      <option value={slo} key={`slo-opt-${slo}`}>
                        {AGENT_SLO_LABELS[slo]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-block">
                  <label>Filter applications by tag</label>
                  <select value={filterKey} onChange={setFilterKey}>
                    <option value="">--</option>
                    {Object.keys(tags)
                      .sort()
                      .map(key => (
                        <option key={`filter-tag-${key}`} value={key}>
                          {key}
                        </option>
                      ))}
                  </select>
                  {filterKey ? (
                    <div style={{ display: 'inline' }}>
                      <label>to value</label>
                      <select value={filterValue} onChange={setFilterValue}>
                        <option value="">--</option>
                        {tags[filterKey].sort().map(val => (
                          <option key={`filter-val-${val}`} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    undefined
                  )}
                </div>
                <div className="filter-block">
                  {scanner}
                  <label>Loaded {agentData.length} applications</label>
                </div>
              </div>

              <Tabs defaultValue="tab-2">
                <TabsItem
                  value="tab-1"
                  label={`Up to date (${presentationData.currentTable.data.length})`}
                >
                  {presentationData.currentTable.data.length > 0 ? (
                    <div>
                      <p>
                        {presentationData.currentTable.data.length} apps are up
                        to date with {upToDateLabel}
                      </p>
                      <TableWrapper tableData={presentationData.currentTable} />
                    </div>
                  ) : (
                    <p>No apps are running a recent agent version :(</p>
                  )}
                </TabsItem>

                <TabsItem
                  value="tab-3"
                  label={`Multiple versions (${presentationData.multiversionTable.data.length})`}
                >
                  {presentationData.multiversionTable.data.length > 0 ? (
                    <div>
                      <p>
                        {presentationData.multiversionTable.data.length} apps
                        are running multiple agent versions
                      </p>
                      <TableWrapper
                        tableData={presentationData.multiversionTable}
                      />
                    </div>
                  ) : (
                    <p>All apps are running a single agent version</p>
                  )}
                </TabsItem>

                <TabsItem
                  value="tab-2"
                  label={`Out of date (${presentationData.outdatedTable.data.length})`}
                >
                  {presentationData.outdatedTable.data.length > 0 ? (
                    <div>
                      <p>
                        {presentationData.outdatedTable.data.length} apps are
                        running outdated agents
                      </p>
                      <TableWrapper
                        tableData={presentationData.outdatedTable}
                      />
                    </div>
                  ) : (
                    <p>
                      All apps are up to date (or running multiple agent
                      versions)
                    </p>
                  )}
                </TabsItem>
              </Tabs>
            </div>

            <AgentVersion
              agentVersions={agentVersions}
              freshAgentVersions={freshAgentVersions}
            />
          </div>
        ) : (
          <Spinner />
        )}
      </div>
    );
  }
}
