import React from 'react';
import PropTypes from 'prop-types';
import BootstrapTable from 'react-bootstrap-table-next';

export default class AgentVersion extends React.PureComponent {
  static propTypes = {
    agentVersions: PropTypes.object.isRequired,
    freshAgentVersions: PropTypes.object.isRequired,
  };

  render() {
    const { agentVersions, freshAgentVersions } = this.props;
    const columns = [
      {
        dataField: 'language',
        text: 'Language',
      },
      {
        dataField: 'version',
        text: 'Version',
      },
      {
        dataField: 'releasedOn',
        text: 'Released On',
      },
    ];

    const tableData = Object.keys(freshAgentVersions)
      .sort()
      .map((lng, index) => ({
        id: index,
        language: lng,
        version: freshAgentVersions[lng][0],
        releasedOn: agentVersions[lng]
          .find(v => v.version === freshAgentVersions[lng][0])
          .date.format('MMM Do YYYY'),
      }));

    return (
      <div className="agent-versions">
        <h3>Latest APM agent versions</h3>
        <BootstrapTable keyField="id" columns={columns} data={tableData} />
      </div>
    );
  }
}
