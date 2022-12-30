import React from 'react';

import {
  Icon,
  List,
  ListItem,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  Tooltip,
} from 'nr1';

import FeatureIcon from './FeatureIcon';

const colors = {
  ok: '#01a76a',
  warning: '#ffd23d',
  critical: '#f5554b',
};

const ListingTable = ({ entities = [], entitiesDetails = {} }) => {
  return (
    <Table className="recommendations" items={entities} multivalue>
      <TableHeader>
        <TableHeaderCell>Account</TableHeaderCell>
        <TableHeaderCell>App</TableHeaderCell>
        <TableHeaderCell>Agent Version(s)</TableHeaderCell>
        <TableHeaderCell>Runtime Version(s)</TableHeaderCell>
        <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
          Features
        </TableHeaderCell>
        <TableHeaderCell>Recommended Version</TableHeaderCell>
        <TableHeaderCell>Exposures</TableHeaderCell>
      </TableHeader>
      {({ item }) => (
        <TableRow>
          <TableRowCell additionalValue={item.account.name}>
            {item.account.id}
          </TableRowCell>
          <TableRowCell additionalValue={item.language}>
            {item.name}
          </TableRowCell>
          <TableRowCell
            alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}
            additionalValue={entitiesDetails[item.guid]?.recommend?.age?.display}
          >
            {item.agentVersions?.display || ''}
          </TableRowCell>
          <TableRowCell
            alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}
            additionalValue={entitiesDetails[item.guid]?.runtimeVersions?.type}
          >
            {entitiesDetails[item.guid]?.runtimeVersions?.display || ''}
          </TableRowCell>
          <TableRowCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
            <FeatureIcon
              feature="distributedTracing"
              enabled={entitiesDetails[item.guid]?.features?.dtEnabled}
            />{' '}
            <FeatureIcon
              feature="logs"
              enabled={entitiesDetails[item.guid]?.features?.logEnabled}
            />{' '}
            <FeatureIcon
              feature="infinteTracing"
              enabled={entitiesDetails[item.guid]?.features?.infTraceHost}
            />
          </TableRowCell>
          <TableRowCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
            {statusCell(entitiesDetails[item.guid]?.recommend)}
          </TableRowCell>
          <TableRowCell>
            <List>
              {(entitiesDetails[item.guid]?.exposures?.list || []).map(
                exposure => (
                  <ListItem>{exposure}</ListItem>
                )
              )}
            </List>
          </TableRowCell>
        </TableRow>
      )}
    </Table>
  );
};

const statusCell = ({ message, status, version = '' } = {}) => (
  <>
    {version}{' '}
    {message ? (
      <Tooltip text={message}>
        <Icon
          type={
            status && status === 'ok'
              ? Icon.TYPE.INTERFACE__SIGN__CHECKMARK__V_ALTERNATE__WEIGHT_BOLD
              : Icon.TYPE.INTERFACE__INFO__INFO__WEIGHT_BOLD
          }
          color={status ? colors[status] : null}
        />
      </Tooltip>
    ) : null}
  </>
);

export default ListingTable;
