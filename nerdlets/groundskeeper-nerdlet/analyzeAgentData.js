import { differenceInMilliseconds, differenceInWeeks } from 'date-fns';
import { linkedAppId, agentAge, agentVersionInList } from './helpers';

export default function analyzeAgentData(agentData, entityTypes, state) {
  const {
    accounts,
    agentVersions,
    freshAgentVersions,
    filterKey,
    filterValue,
    entityTypeFilter
  } = state;

  const analysis = {
    current: [],
    old: [],
    multipleVersions: [],
    noVersions: []
  };
  agentData
    .filter(x => typeof x !== 'undefined')
    .forEach(info => {
      const freshVersions = freshAgentVersions[info.language];
      if (!freshVersions || freshVersions.length < 1) {
        return;
      }
      if (filterKey && filterValue) {
        const tag = info.tags.find(t => t.key === filterKey);
        if (!tag || tag.values.indexOf(filterValue) < 0) return;
      }

      if (entityTypeFilter && entityTypes[entityTypeFilter] !== undefined) {
        // by entityType
        if (info.entityType !== entityTypes[entityTypeFilter]) return;
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
        text: 'AppId/Entity Name',
        sort: true
      },
      {
        dataField: 'appName',
        text: 'App/Host name',
        sort: true
      },
      {
        dataField: 'language',
        text: 'Agent Type',
        sort: true
      }
    ],
    data: analysis.noVersions.map((info, index) => {
      return {
        key: index,
        account: accounts[info.accountId] || info.accountId,
        appId: linkedAppId(
          info.accountId,
          info.appId,
          info.guid,
          info.entityType
        ),
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
        text: 'AppId/Entity Name',
        sort: true
      },
      {
        dataField: 'appName',
        text: 'App/Host name',
        sort: true
      },
      {
        dataField: 'language',
        text: 'Agent Type',
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
        text: 'AppId/Entity Name',
        sort: true
      },
      {
        dataField: 'appName',
        text: 'App/Host name',
        sort: true
      },
      {
        dataField: 'language',
        text: 'Agent Type',
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
          appId: linkedAppId(
            info.accountId,
            info.appId,
            info.guid,
            info.entityType
          ),
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
        appId: linkedAppId(
          info.accountId,
          info.appId,
          info.guid,
          info.entityType
        ),
        appName: info.appName,
        language: info.language,
        agentVersions: info.agentVersions.join(', ')
      };
    })
  };

  return analysis;
}
