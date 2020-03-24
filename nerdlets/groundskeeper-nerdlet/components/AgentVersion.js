import React from 'react';
import PropTypes from 'prop-types';
import BootstrapTable from 'react-bootstrap-table-next';
import { format } from 'date-fns';

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
        sort: true,
      },
      {
        dataField: 'version',
        text: 'Version',
        sort: true,
      },
      {
        dataField: 'releasedOn',
        text: 'Released On',
        sort: true,
      },
    ];

    const tableData = Object.keys(freshAgentVersions)
      .sort()
      .map((lng, index) => ({
        id: index,
        language: lng,
        version: freshAgentVersions[lng][0],
        releasedOn: format(
          agentVersions[lng].find(v => v.version === freshAgentVersions[lng][0])
            .date,
          'MMM do yyyy'
        ),
      }));

    return (
      <div className="agent-versions">
        <h3>Latest APM agent versions</h3>
        <BootstrapTable keyField="id" columns={columns} data={tableData} />
      </div>
    );
  }
}
