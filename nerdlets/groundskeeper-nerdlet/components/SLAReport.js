import React from 'react';
import PropTypes from 'prop-types';

import BootstrapTable from 'react-bootstrap-table-next';
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit';

import { Spinner } from 'nr1';

import { agentVersionInList } from '../helpers';

export default class SLAReport extends React.Component {
  static propTypes = {
    slaReportKey: PropTypes.string.isRequired,
    agentData: PropTypes.array.isRequired,
    freshAgentVersions: PropTypes.object.isRequired
  };

  state = {
    tableContent: undefined
  };

  componentDidMount() {
    this.computeSLAReport();
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.slaReportKey !== prevProps.slaReportKey ||
      this.props.agentData.length !== prevProps.agentData.length
    ) {
      this.computeSLAReport();
    }
  }

  computeSLAReport = () => {
    const { freshAgentVersions, slaReportKey, agentData } = this.props;

    if (!slaReportKey || !agentData.length) {
      this.setState({ tableContent: undefined });
      return;
    }

    const slaReportData = {
      '(undefined)': {
        inSLA: 0,
        outdated: 0,
        multiple: 0,
        unknown: 0
      }
    };

    agentData.forEach(info => {
      if (typeof info !== 'undefined') {
        let bucketValues = ['(undefined)'];
        if (info.tags && info.tags.find) {
          const bucketTag = info.tags.find(t => t.key === slaReportKey) || {};
          bucketValues = bucketTag.values || bucketValues;
        }

        const freshVersions = freshAgentVersions[info.language];
        if (!freshVersions || freshVersions.length < 1) {
          return;
        }

        const versions = (info.agentVersions || []).filter(
          v => typeof v === 'string' && v.length > 0
        );

        bucketValues.forEach(bucket => {
          if (!slaReportData[bucket]) {
            slaReportData[bucket] = {
              inSLA: 0,
              outdated: 0,
              multiple: 0,
              unknown: 0
            };
          }
          if (versions.length < 1) {
            slaReportData[bucket].unknown += 1;
          } else if (info.agentVersions.length > 1) {
            slaReportData[bucket].multiple += 1;
          } else if (agentVersionInList(versions[0], freshVersions)) {
            slaReportData[bucket].inSLA += 1;
          } else {
            slaReportData[bucket].outdated += 1;
          }
        });
      }
    });

    const data = Object.keys(slaReportData)
      .map(key => {
        const val = slaReportData[key];
        const total = val.inSLA + val.outdated + val.multiple + val.unknown;
        if (total < 1) {
          return undefined;
        }
        const pct = Math.floor((val.inSLA * 100) / total);
        return {
          key: key,
          percentInSLA: pct,
          inSLA: val.inSLA,
          outdated: val.outdated,
          multiple: val.multiple,
          unknown: val.unknown
        };
      })
      .filter(d => d)
      .sort((a, b) => {
        if (a.percentInSLA > b.percentInSLA) {
          return -1;
        } else if (a.percentInSLA === b.percentInSLA) {
          return 0;
        }
        return 1;
      });

    const tableContent = {
      columns: [
        {
          dataField: 'key',
          text: slaReportKey,
          sort: true
        },
        {
          dataField: 'percentInSLA',
          text: '% within SLA',
          sort: true
        },
        {
          dataField: 'inSLA',
          text: '# within SLA',
          sort: true
        },
        {
          dataField: 'outdated',
          text: '# outdated',
          sort: true
        },
        {
          dataField: 'multiple',
          text: '# w/ multiple versions',
          sort: true
        },
        {
          dataField: 'unknown',
          text: '# w/out reported version',
          sort: true
        }
      ],
      data: data
    };

    this.setState({ tableContent });
  };

  render() {
    const { tableContent } = this.state;

    if (!tableContent) {
      return (
        <div className="sla-report">
          <Spinner />
        </div>
      );
    }

    const { SearchBar } = Search;

    return (
      <ToolkitProvider
        wrapperClasses="table-responsive"
        keyField="key"
        data={tableContent.data}
        columns={tableContent.columns}
        search
      >
        {props => (
          <>
            <SearchBar {...props.searchProps} />
            <BootstrapTable {...props.baseProps} />
          </>
        )}
      </ToolkitProvider>
    );
  }
}
