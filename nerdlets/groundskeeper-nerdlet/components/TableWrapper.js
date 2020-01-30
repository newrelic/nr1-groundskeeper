import React from 'react';
import PropTypes from 'prop-types';

import BootstrapTable from 'react-bootstrap-table-next';

/**
 * const tableData = {
 *     columns: ['name', 'count', 'cost'],
 *     data: [
 *         ['tree', 2, '$4.99'],
 *         ['flower', 7, '$1.99'],
 *     ]
 * }
 * <TableWrapper tableData={tableData} />
 */
export default class TableWrapper extends React.PureComponent {
  static propTypes = {
    tableData: PropTypes.object.isRequired,
  };

  render() {
    const { tableData } = this.props;

    return (
      <BootstrapTable
        keyField="appId"
        data={tableData.data}
        columns={tableData.columns}
      />
    );
  }
}
