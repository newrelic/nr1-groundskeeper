import React from 'react';
import { startCase } from 'lodash';
import BootstrapTable from 'react-bootstrap-table-next';
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit';
import {
  parseISO,
  differenceInMilliseconds,
  differenceInWeeks
} from 'date-fns';
import {
  NerdGraphQuery,
  Spinner,
  Stack,
  StackItem,
  Dropdown,
  Select,
  SelectItem,
  DropdownItem,
  Grid,
  GridItem
} from 'nr1';
import AgentVersion from './components/AgentVersion';
import SLAReport from './components/SLAReport';

import {
  linkedAppId,
  agentAge,
  cleanAgentVersion,
  agentVersionInList,
  agentSloOptions,
  defaultAgentSloOption
} from './helpers';

import { ACCOUNT_NG_QUERY, ENTITY_NG_QUERY } from './queries';

export default class Groundskeeper extends React.Component {
  constructor(props) {
    super(props);

    this.setTableState = this.setTableState.bind(this);
    this.getTableStateCount = this.getTableStateCount.bind(this);
  }

  state = {
    loadingInitialState: true,
    loadError: false,

    agentSLO: defaultAgentSloOption,

    agentData: [],
    tags: {},
    presentationData: {},
    accounts: {},
    agentVersions: {},
    freshAgentVersions: {},
    scanIsRunning: true,
    tableState: 'outOfDate',

    filterKey: undefined,
    filterValue: undefined,

    slaReportKey: undefined
  };

  componentDidMount() {
    this.loadInitialData();
  }

  loaders = undefined;
  initialEntityDataSet = false;

  setFilterKey = key => {
    this.setState(
      { filterKey: key || undefined, filterValue: undefined },
      () => {
        this.recomputePresentation(this.state.agentData);
      }
    );
  };

  setFilterValue = val => {
    this.setState({ filterValue: val || undefined }, () => {
      this.recomputePresentation(this.state.agentData);
    });
  };

  setSLAReportKey = val => {
    this.setState({ slaReportKey: val || undefined });
  };

  updateAgentSLO = (event, value) => {
    if (value === this.state.agentSLO) {
      return;
    }

    const newState =
    value >= 0 && value < agentSloOptions.length
        ? { agentSLO: value }
        : { agentSLO: defaultAgentSloOption };

    this.setState(newState, () => {
      this.recomputeFreshAgentVersions(this.state.agentVersions);
    });
  };

  setTableState(tableState) {
    this.setState({
      tableState: tableState
    });
  }

  getTableStateCount(tableState) {
    if (tableState === 'upToDate') {
      return this.state.presentationData.currentTable.data.length;
    } else if (tableState === 'multipleVersions') {
      return this.state.presentationData.multiversionTable.data.length;
    } else if (tableState === 'outOfDate') {
      return this.state.presentationData.outdatedTable.data.length;
    } else if (tableState === 'noVersionReported') {
      return this.state.presentationData.noVersionsTable.data.length;
    }
  }

  renderTableState() {
    const { presentationData, tableState } = this.state;
    const { SearchBar } = Search;

    if (tableState === 'upToDate') {
      return (
        <div className="table-state-container">
          {presentationData.currentTable.data.length > 0 ? (
            <>
              <ToolkitProvider
                wrapperClasses="table-responsive"
                keyField="key"
                data={presentationData.currentTable.data}
                columns={presentationData.currentTable.columns}
                search
              >
                {props => (
                  <>
                    <SearchBar {...props.searchProps} />
                    <BootstrapTable {...props.baseProps} />
                  </>
                )}
              </ToolkitProvider>
            </>
          ) : (
            <p>No apps are running a recent agent version :(</p>
          )}
        </div>
      );
    } else if (tableState === 'multipleVersions') {
      return (
        <div className="table-state-container">
          {presentationData.multiversionTable.data.length > 0 ? (
            <>
              <ToolkitProvider
                wrapperClasses="table-responsive"
                keyField="key"
                data={presentationData.multiversionTable.data}
                columns={presentationData.multiversionTable.columns}
                search
              >
                {props => (
                  <>
                    <SearchBar {...props.searchProps} />
                    <BootstrapTable {...props.baseProps} />
                  </>
                )}
              </ToolkitProvider>
            </>
          ) : (
            <p>All apps are running a single agent version</p>
          )}
        </div>
      );
    } else if (tableState === 'outOfDate') {
      return (
        <div className="table-state-container">
          {presentationData.outdatedTable.data.length > 0 ? (
            <>
              <ToolkitProvider
                wrapperClasses="table-responsive"
                keyField="key"
                data={presentationData.outdatedTable.data}
                columns={presentationData.outdatedTable.columns}
                search
              >
                {props => (
                  <>
                    <SearchBar {...props.searchProps} />
                    <BootstrapTable {...props.baseProps} />
                  </>
                )}
              </ToolkitProvider>
            </>
          ) : (
            <p>All apps are up to date (or running multiple agent versions)</p>
          )}
        </div>
      );
    } else if (tableState === 'noVersionReported') {
      return (
        <div className="table-state-container">
          {presentationData.noVersionsTable.data.length > 0 ? (
            <>
              <ToolkitProvider
                wrapperClasses="table-responsive"
                keyField="key"
                data={presentationData.noVersionsTable.data}
                columns={presentationData.noVersionsTable.columns}
                search
              >
                {props => (
                  <>
                    <SearchBar {...props.searchProps} />
                    <BootstrapTable {...props.baseProps} />
                  </>
                )}
              </ToolkitProvider>
            </>
          ) : (
            <p>All apps are reporting agent version data</p>
          )}
        </div>
      );
    }
  }

  loadInitialData = () => {
    const that = this;
    NerdGraphQuery.query({
      query: ACCOUNT_NG_QUERY
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
      variables: { queryCursor: cursor }
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
              date: parseISO(ver.date)
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
                  ent.runningAgentVersions.minVersion
                ];

          return {
            accountId: ent.account.id,
            accountName: ent.account.name,
            appId: ent.applicationId,
            guid: ent.guid,
            appName: ent.name,
            language: ent.language,
            agentVersions: versions,
            tags: ent.tags
          };
        });
      if (newData.length > 0) {
        this.setState({ tags });
        const agentData = this.state.agentData.concat(newData);
        this.recomputePresentation(agentData);
      }
    } else if (error) {
      console.log(`Error fetching entity status`, error); // eslint-disable-line no-console
      this.setState({ loadError: true });
    }
  };

  recomputeFreshAgentVersions = agentVersions => {
    const { agentSLO } = this.state;
    const { filterFunc } = agentSloOptions[agentSLO];
    const freshAgentVersions = {};

    Object.keys(agentVersions).forEach(language => {
      const al = agentVersions[language];

      if (al && al.map && al.length > 0) {
        freshAgentVersions[language] = filterFunc(al).map(ver => ver.version);
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
      filterValue
    } = this.state;

    const analysis = {
      current: [],
      old: [],
      multipleVersions: [],
      noVersions: []
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

      const originalVersions = info.agentVersions || [];
      info.agentVersions = originalVersions.filter(
        v => typeof v === 'string' && v.length > 0
      );
      if (info.agentVersions.length < 1) {
        console.log(`No valid versions found for ${info.appName} `, originalVersions) // eslint-disable-line prettier/prettier, no-console
        analysis.noVersions.push(info);
      } else if (info.agentVersions.length > 1) {
        analysis.multipleVersions.push(info);
      } else if (agentVersionInList(info.agentVersions[0], freshVersions)) {
        analysis.current.push(info);
      } else {
        analysis.old.push(info);
      }
    });

    analysis.noVersionsTable = {
      columns: [
        {
          dataField: 'account',
          text: 'Account',
          sort: true
        },
        {
          dataField: 'appId',
          text: 'AppId',
          sort: true
        },
        {
          dataField: 'appName',
          text: 'App name',
          sort: true
        },
        {
          dataField: 'language',
          text: 'Language',
          sort: true
        }
      ],
      data: analysis.noVersions.map((info, index) => {
        return {
          key: index,
          account: accounts[info.accountId] || info.accountId,
          appId: linkedAppId(info.accountId, info.appId),
          appName: info.appName,
          language: info.language
        };
      })
    };

    analysis.currentTable = {
      columns: [
        {
          dataField: 'account',
          text: 'Account',
          sort: true
        },
        {
          dataField: 'appId',
          text: 'AppId',
          sort: true
        },
        {
          dataField: 'appName',
          text: 'App name',
          sort: true
        },
        {
          dataField: 'language',
          text: 'Language',
          sort: true
        },
        {
          dataField: 'agentVersion',
          text: 'Agent Version',
          sort: true
        }
      ],
      data: analysis.current.map((info, index) => {
        return {
          key: index,
          account: accounts[info.accountId] || info.accountId,
          appId: info.appId,
          appName: info.appName,
          language: info.language,
          agentVersion: info.agentVersions.join(', ')
        };
      })
    };
    const now = new Date();
    analysis.outdatedTable = {
      columns: [
        {
          dataField: 'agentAge[1]',
          text: 'Agent age',
          sort: true,
          formatter: cell => {
            return cell >= 0 ? `${cell} weeks old` : 'Unknown';
          }
        },
        {
          dataField: 'account',
          text: 'Account',
          sort: true
        },
        {
          dataField: 'appId',
          text: 'AppId',
          sort: true
        },
        {
          dataField: 'appName',
          text: 'App name',
          sort: true
        },
        {
          dataField: 'language',
          text: 'Language',
          sort: true
        },
        {
          dataField: 'agentVersion',
          text: 'Agent Version',
          sort: true
        }
      ],
      data: analysis.old
        .sort((a, b) => {
          const ageA = agentAge(a, agentVersions);
          const ageB = agentAge(b, agentVersions);
          if (!ageA && !ageB) return 0;
          if (!ageA) return 1;
          if (!ageB) return -1;
          const d = differenceInMilliseconds(ageA, ageB);
          if (d < 0) return -1;
          if (d > 0) return 1;
          return 0;
        })
        .map((info, index) => {
          const age = agentAge(info, agentVersions);
          const ageInWeeks = age ? differenceInWeeks(now, age) : -1;
          return {
            key: index,
            agentAge: [age, ageInWeeks],
            account: accounts[info.accountId] || info.accountId,
            appId: linkedAppId(info.accountId, info.appId),
            appName: info.appName,
            language: info.language,
            agentVersion: info.agentVersions.join(', ')
          };
        })
    };
    analysis.multiversionTable = {
      columns: [
        {
          dataField: 'account',
          text: 'Account',
          sort: true
        },
        {
          dataField: 'appId',
          text: 'AppId',
          sort: true
        },
        {
          dataField: 'appName',
          text: 'App name',
          sort: true
        },
        {
          dataField: 'language',
          text: 'Language',
          sort: true
        },
        {
          dataField: 'agentVersions',
          text: 'Agent Versions',
          sort: true
        }
      ],
      data: analysis.multipleVersions.map((info, index) => {
        return {
          key: index,
          account: accounts[info.accountId] || info.accountId,
          appId: linkedAppId(info.accountId, info.appId),
          appName: info.appName,
          language: info.language,
          agentVersions: info.agentVersions.join(', ')
        };
      })
    };

    return analysis;
  };

  render() {
    const {
      updateAgentSLO,
      setFilterKey,
      setFilterValue,
      setSLAReportKey,
      setTableState,
      getTableStateCount,
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
        tableState,
        slaReportKey
      }
    } = this;

    if (loadingInitialState) {
      return (
        <div className="gk-content">
          <Spinner fillContainer />
          <div>Please enjoy the emptiness while I survey your estate...</div>
        </div>
      );
    }

    const upToDateLabel = agentSloOptions[agentSLO].label;
    const scanner = scanIsRunning ? <Spinner inline /> : undefined;

    let tableBannerText = '';
    if (slaReportKey) {
      tableBannerText = `SLA Report by ${slaReportKey}`;
    } else if (tableState === 'outOfDate') {
      tableBannerText += `${presentationData.outdatedTable.data.length} apps are running outdated agents`;
    } else if (tableState === 'multipleVersions') {
      tableBannerText += `${presentationData.multiversionTable.data.length} apps are running multiple agent versions`;
    } else if (tableState === 'upToDate') {
      tableBannerText += `${presentationData.currentTable.data.length} apps are up to date with ${upToDateLabel}`;
    } else if (tableState === 'noVersionReported') {
      tableBannerText += `${presentationData.noVersionsTable.data.length} apps are not reporting agent version data (they may be inactive)`;
    }

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
          <>
            <Stack
              className="toolbar-container"
              fullWidth
              gapType={Stack.GAP_TYPE.NONE}
              horizontalType={Stack.HORIZONTAL_TYPE.FILL_EVENLY}
              verticalType={Stack.VERTICAL_TYPE.FILL}
            >
              <StackItem className="toolbar-section1">
                <Stack
                  gapType={Stack.GAP_TYPE.NONE}
                  fullWidth
                  verticalType={Stack.VERTICAL_TYPE.FILL}
                >
                  <StackItem className="toolbar-item has-separator">
                    <Select
                      label="My Upgrade SLO is"
                      // TODO(rtyree): What we pass to this 'value' prop isn't updating the Select value. Must fix
                      value={agentSloOptions[this.state.agentSLO].label}
                      onChange={updateAgentSLO}
                    >
                      {agentSloOptions.map((slo, index) => (
                        <SelectItem
                          value={index}
                          key={`slo-opt-${index}`}
                        >
                          {slo.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </StackItem>
                  <StackItem
                    className={`toolbar-item ${
                      filterKey ? '' : 'has-separator'
                    }`}
                  >
                    <Dropdown
                      label="Filter applications by tag"
                      title={filterKey === undefined ? '--' : filterKey}
                    >
                      <DropdownItem onClick={() => setFilterKey('')}>
                        --
                      </DropdownItem>
                      {Object.keys(tags)
                        .sort()
                        .map(key => (
                          <DropdownItem
                            key={`filter-tag-${key}`}
                            value={key}
                            onClick={() => setFilterKey(key)}
                          >
                            {key}
                          </DropdownItem>
                        ))}
                    </Dropdown>
                  </StackItem>
                  {filterKey && (
                    <StackItem className="toolbar-item has-separator">
                      <Dropdown
                        label="to value"
                        title={filterValue !== undefined ? filterValue : '--'}
                      >
                        {tags[filterKey].sort().map(val => (
                          <DropdownItem
                            key={`filter-val-${val}`}
                            value={val}
                            onClick={() => setFilterValue(val)}
                          >
                            {val}
                          </DropdownItem>
                        ))}
                      </Dropdown>
                    </StackItem>
                  )}
                  <StackItem className="toolbar-item">
                    <Dropdown
                      label="Filter by state"
                      title={`${startCase(tableState)} (${getTableStateCount(
                        tableState
                      )})`}
                    >
                      <DropdownItem onClick={() => setTableState('upToDate')}>
                        Up to date ({presentationData.currentTable.data.length})
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => setTableState('multipleVersions')}
                      >
                        Multiple versions (
                        {presentationData.multiversionTable.data.length})
                      </DropdownItem>
                      <DropdownItem onClick={() => setTableState('outOfDate')}>
                        Out of date (
                        {presentationData.outdatedTable.data.length})
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => setTableState('noVersionReported')}
                      >
                        No version reported (
                        {presentationData.noVersionsTable.data.length})
                      </DropdownItem>
                    </Dropdown>
                  </StackItem>
                  <StackItem className="toolbar-item has-separator">
                    <Dropdown
                      label="Show SLA Report by"
                      title={slaReportKey === undefined ? '--' : slaReportKey}
                    >
                      <DropdownItem onClick={() => setSLAReportKey('')}>
                        --
                      </DropdownItem>
                      {Object.keys(tags)
                        .sort()
                        .map(key => (
                          <DropdownItem
                            key={`filter-tag-${key}`}
                            value={key}
                            onClick={() => setSLAReportKey(key)}
                          >
                            {key}
                          </DropdownItem>
                        ))}
                    </Dropdown>
                  </StackItem>
                </Stack>
              </StackItem>
              <StackItem className="toolbar-section2">
                <Stack
                  fullWidth
                  fullHeight
                  verticalType={Stack.VERTICAL_TYPE.CENTER}
                  horizontalType={Stack.HORIZONTAL_TYPE.RIGHT}
                >
                  <StackItem>
                    {scanner}
                    <small>Loaded {agentData.length} applications</small>
                  </StackItem>
                </Stack>
              </StackItem>
            </Stack>
            {tableBannerText ? (
              <p className="table-state-count">{tableBannerText}</p>
            ) : (
              undefined
            )}
            <Grid spacingType={[Grid.SPACING_TYPE.LARGE]}>
              <GridItem columnSpan={9} className="primary-table-grid-item">
                {slaReportKey ? (
                  <SLAReport
                    slaReportKey={slaReportKey}
                    agentData={agentData}
                    freshAgentVersions={freshAgentVersions}
                  />
                ) : (
                  this.renderTableState()
                )}
              </GridItem>
              <GridItem columnSpan={3} className="secondary-table-grid-item">
                <AgentVersion
                  agentVersions={agentVersions}
                  freshAgentVersions={freshAgentVersions}
                />
              </GridItem>
            </Grid>
          </>
        ) : (
          <Spinner />
        )}
      </div>
    );
  }
}
