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
import { exposures } from '../cve';

const colors = {
  ok: '#01a76a',
  warning: '#ffd23d',
  critical: '#f5554b',
};

const ListingTable = ({ displayedEntities = [] }) => {
  return (
    <Table className="recommendations" items={displayedEntities} multivalue>
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
            additionalValue={item.recommend?.age?.display}
          >
            {item.agentVersions?.display || ''}
          </TableRowCell>
          <TableRowCell
            alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}
            additionalValue={item.runtimeVersions?.type}
          >
            {item.runtimeVersions?.display || ''}
          </TableRowCell>
          <TableRowCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
            <FeatureIcon
              feature="distributedTracing"
              enabled={item.features?.dtEnabled}
            />{' '}
            <FeatureIcon feature="logs" enabled={item.features?.logEnabled} />{' '}
            <FeatureIcon
              feature="infiniteTracing"
              enabled={item.features?.infTraceHost}
            />
          </TableRowCell>
          <TableRowCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
            {statusCell(item.recommend)}
          </TableRowCell>
          <TableRowCell>
            <List rowHeight={16}>
              {(item.exposures?.list || []).map(exposuresCell)}
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

const exposuresCell = (exposure, index) => (
  <ListItem key={index}>
    <a
      className="u-unstyledLink cell-link"
      target="_blank"
      href={exposure.releaseNotes}
    >
      {exposure.display}
    </a>
  </ListItem>
);

export default ListingTable;
