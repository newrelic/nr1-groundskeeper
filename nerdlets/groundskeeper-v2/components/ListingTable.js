import React from 'react';
import PropTypes from 'prop-types';

import {
  Icon,
  List,
  ListItem,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  Tooltip
} from 'nr1';

import FeatureIcon from './FeatureIcon';
import { STATUS } from '../constants';

const colors = {
  [STATUS.OK]: '#01a76a',
  [STATUS.WARNING]: '#ffd23d',
  [STATUS.CRITICAL]: '#f5554b'
};

const ListingTable = ({ displayedEntities = [] }) => {
  return (
    <Table className="recommendations" items={displayedEntities} multivalue>
      <TableHeader>
        <TableHeaderCell>Account</TableHeaderCell>
        <TableHeaderCell>App</TableHeaderCell>
        <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
          Agent version(s)
        </TableHeaderCell>
        <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
          Runtime version(s)
        </TableHeaderCell>
        <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
          Features enabled
        </TableHeaderCell>
        <TableHeaderCell>Exposures</TableHeaderCell>
        <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
          Recommended version
        </TableHeaderCell>
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
          <TableRowCell>
            <List rowHeight={16}>
              {(item.exposures?.list || []).map(exposuresCell)}
            </List>
          </TableRowCell>
          <TableRowCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
            {statusCell(item.recommend)}
          </TableRowCell>
        </TableRow>
      )}
    </Table>
  );
};

const statusCell = ({ version = '', statuses = [] } = {}) => (
  <>
    {version}
    {statuses.map(statusIcon)}
  </>
);

const statusIcon = ({ message, status } = {}, index) =>
  message ? (
    <Tooltip text={message} key={index}>
      <Icon
        className="status-icon"
        type={
          status && status === 'ok'
            ? Icon.TYPE.INTERFACE__SIGN__CHECKMARK__V_ALTERNATE__WEIGHT_BOLD
            : Icon.TYPE.INTERFACE__INFO__INFO__WEIGHT_BOLD
        }
        color={status ? colors[status] : ''}
      />
    </Tooltip>
  ) : null;

const exposuresCell = (exposure, index) => (
  <ListItem key={index}>
    <a
      className="u-unstyledLink cell-link"
      target="_blank"
      rel="noreferrer"
      href={exposure.releaseNotes}
    >
      {exposure.display}
    </a>
  </ListItem>
);

ListingTable.propTypes = {
  displayedEntities: PropTypes.array
};

export default ListingTable;
