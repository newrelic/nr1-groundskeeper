import React from 'react';
import PropTypes from 'prop-types';
import BootstrapTable from 'react-bootstrap-table-next';
import { format } from 'date-fns';

export default class InfraAgentVersion extends React.PureComponent {
  static propTypes = {
    agentVersions: PropTypes.object.isRequired,
    freshAgentVersions: PropTypes.object.isRequired
  };

  render() {
    const { agentVersions, freshAgentVersions } = this.props;
    const columns = [
      {
        dataField: 'version',
        text: 'Version',
        sort: true
      },
      {
        dataField: 'releasedOn',
        text: 'Released On',
        sort: true
      }
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
        )
      }));

    const infraTableData = tableData.filter(it =>
      it.language.includes('infrastructure')
    );

    return (
      <div className="agent-versions">
        <h3>Latest Infra agent Version</h3>
        <BootstrapTable keyField="id" columns={columns} data={infraTableData} />
      </div>
    );
  }
}
