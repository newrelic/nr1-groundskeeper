import React from 'react';
import PropTypes from 'prop-types';

import BootstrapTable from 'react-bootstrap-table-next';
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit';

export default class MainTable extends React.PureComponent {
  static propTypes = {
    presentationData: PropTypes.object,
    tableState: PropTypes.string
  };

  upToDateTable(presentationData) {
    const { SearchBar } = Search;

    return presentationData.currentTable.data.length > 0 ? (
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
    );
  }

  multiVersionTable(presentationData) {
    const { SearchBar } = Search;

    return presentationData.multiversionTable.data.length > 0 ? (
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
    );
  }

  outOfDateTable(presentationData) {
    const { SearchBar } = Search;

    return presentationData.outdatedTable.data.length > 0 ? (
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
    );
  }

  noVersionTable(presentationData) {
    const { SearchBar } = Search;

    return presentationData.noVersionsTable.data.length > 0 ? (
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
    );
  }

  render() {
    const { presentationData, tableState } = this.props;

    let content = <></>;

    if (tableState === 'upToDate') {
      content = this.upToDateTable(presentationData, tableState);
    } else if (tableState === 'multipleVersions') {
      content = this.multiVersionTable(presentationData, tableState);
    } else if (tableState === 'outOfDate') {
      content = this.outOfDateTable(presentationData, tableState);
    } else if (tableState === 'noVersionReported') {
      content = this.noVersionTable(presentationData, tableState);
    }

    return <div className="table-state-container">{content}</div>;
  }
}
