import React from 'react';
import PropTypes from 'prop-types';

import ReactTable from 'react-table';
import { TableChart } from 'nr1';

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

  renderHTMLTable() {
    const {
      tableData: { columns, data },
    } = this.props;
    const headers = columns.map(colName => (
      <th key={`table-header-${colName}`}>{colName}</th>
    ));
    const rows = data.map((row, index) => {
      return (
        <tr key={`table-row-${index}`}>
          {row.map((cell, cIndex) => (
            <td key={`table-row-${index}-col-${cIndex}`}>{cell}</td>
          ))}
        </tr>
      );
    });

    return (
      <table>
        <thead>
          <tr>{headers}</tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    );
  }

  renderNRTableChart() {
    const {
      tableData: { columns, data },
    } = this.props;

    const chartData = [
      {
        // series 1
        metadata: {
          columns,
        },
        // an array of row objects
        // each object has keys matching the column headers w/ cell data in the value
        data: data.map(row => {
          const xRow = {};
          columns.forEach((col, index) => {
            xRow[col] = row[index];
          });
          return xRow;
        }),
      },
    ];

    return <TableChart data={chartData} height={400} />;
  }

  renderReactTable() {
    const {
      tableData: { columns, data },
    } = this.props;

    const tableColumns = columns.map(col => {
      return {
        Header: col,
        accessor: col,
      };
    });
    const tableData = data.map(row => {
      const r = {};
      columns.forEach((col, index) => {
        r[col] = row[index];
      });
      return r;
    });

    return <ReactTable data={tableData} columns={tableColumns} filterable />;
  }

  render() {
    return this.renderReactTable();
  }
}
