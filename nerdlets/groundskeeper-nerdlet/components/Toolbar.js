import React from 'react';
import PropTypes from 'prop-types';
import { startCase } from 'lodash';

import { Spinner, Stack, StackItem, Dropdown, DropdownItem } from 'nr1';

export default class Toolbar extends React.PureComponent {
  static propTypes = {
    entityTypes: PropTypes.object,
    entityCount: PropTypes.number,
    entityTypeFilter: PropTypes.string,
    setEntityTypeFilter: PropTypes.func,
    agentSloOptions: PropTypes.array,
    agentSLO: PropTypes.number,
    setAgentSLO: PropTypes.func,
    filterKey: PropTypes.string,
    setFilterKey: PropTypes.func,
    tags: PropTypes.object,
    filterValue: PropTypes.string,
    setFilterValue: PropTypes.func,
    tableState: PropTypes.string,
    setTableState: PropTypes.func,
    getTableStateCount: PropTypes.func,
    slaReportKey: PropTypes.string,
    setSLAReportKey: PropTypes.func,
    scanIsRunning: PropTypes.bool,
    presentationData: PropTypes.object
  };

  render() {
    const {
      entityTypes,
      entityCount,
      entityTypeFilter,
      setEntityTypeFilter,
      agentSloOptions,
      agentSLO,
      setAgentSLO,
      filterKey,
      setFilterKey,
      tags,
      filterValue,
      setFilterValue,
      tableState,
      setTableState,
      getTableStateCount,
      slaReportKey,
      setSLAReportKey,
      scanIsRunning,
      presentationData
    } = this.props;

    return (
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
            <StackItem
              className={`toolbar-item ${
                entityTypeFilter ? '' : 'has-separator'
              }`}
            >
              <Dropdown
                label="Show"
                title={
                  entityTypeFilter === undefined ? 'All' : entityTypeFilter
                }
              >
                {Object.keys(entityTypes)
                  .sort()
                  .map(eType => (
                    <DropdownItem
                      key={`entity-type-${eType}`}
                      onClick={() => setEntityTypeFilter(eType)}
                    >
                      {eType}
                    </DropdownItem>
                  ))}
              </Dropdown>
            </StackItem>
            <StackItem className="toolbar-item has-separator">
              <Dropdown
                label="My Upgrade SLO is"
                title={agentSloOptions[agentSLO].label}
              >
                {agentSloOptions.map((slo, index) => (
                  <DropdownItem
                    value={slo.label}
                    key={`slo-opt-${index}`}
                    onClick={() => setAgentSLO(index)}
                  >
                    {slo.label}
                  </DropdownItem>
                ))}
              </Dropdown>
            </StackItem>
            <StackItem
              className={`toolbar-item ${filterKey ? '' : 'has-separator'}`}
            >
              <Dropdown
                label="Filter by tag"
                title={filterKey === undefined ? '--' : filterKey}
              >
                <DropdownItem onClick={() => setFilterKey('')}>--</DropdownItem>
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
                <DropdownItem onClick={() => setTableState('multipleVersions')}>
                  Multiple versions (
                  {presentationData.multiversionTable.data.length})
                </DropdownItem>
                <DropdownItem onClick={() => setTableState('outOfDate')}>
                  Out of date ({presentationData.outdatedTable.data.length})
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
              {scanIsRunning ? <Spinner inline /> : undefined}
              <small>Loaded {entityCount} entities</small>
            </StackItem>
          </Stack>
        </StackItem>
      </Stack>
    );
  }
}
