import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import {
  Icon,
  List,
  ListItem,
  navigation,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  Tooltip
} from 'nr1';

import FeatureIcon from './FeatureIcon';
import { AGENTS, defaultReleaseNotes, STATUS } from '../constants';
import releaseNotes from '../release-notes.json';

const colors = {
  [STATUS.OK]: '#01a76a',
  [STATUS.WARNING]: '#ffd23d',
  [STATUS.CRITICAL]: '#f5554b'
};

const ListingTable = ({ displayedEntities = [] }) => {
  const [sortingTypes, setSortingTypes] = useState([
    TableHeaderCell.SORTING_TYPE.NONE,
    TableHeaderCell.SORTING_TYPE.NONE,
    TableHeaderCell.SORTING_TYPE.NONE,
    TableHeaderCell.SORTING_TYPE.NONE,
    TableHeaderCell.SORTING_TYPE.NONE
  ]);

  const headerClickHandler = useCallback(
    (_, { nextSortingType, sortingOrder }) =>
      setSortingTypes(st =>
        st.map((t, i) =>
          i === sortingOrder
            ? nextSortingType
            : TableHeaderCell.SORTING_TYPE.NONE
        )
      )
  );

  const openLogger = useCallback(guid =>
    navigation.openStackedNerdlet({
      id: 'groundskeeper-logger',
      urlState: { guid }
    })
  );

  return (
    <Table className="recommendations" items={displayedEntities} multivalue>
      <TableHeader>
        <TableHeaderCell
          value={({ item }) => item.account.name}
          sortable
          sortingType={sortingTypes[1]}
          sortingOrder={1}
          onClick={headerClickHandler}
        >
          Account
        </TableHeaderCell>
        <TableHeaderCell
          value={({ item }) => item.name}
          sortable
          sortingType={sortingTypes[0]}
          sortingOrder={0}
          onClick={headerClickHandler}
        >
          App
        </TableHeaderCell>
        <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
          Agent version(s)
        </TableHeaderCell>
        <TableHeaderCell
          value={({ item }) => item.recommend?.age?.days}
          sortable
          sortingType={sortingTypes[3]}
          sortingOrder={3}
          onClick={headerClickHandler}
        >
          How old?
        </TableHeaderCell>
        <TableHeaderCell
          value={({ item }) => item.language}
          sortable
          sortingType={sortingTypes[2]}
          sortingOrder={2}
          onClick={headerClickHandler}
        >
          Language
        </TableHeaderCell>
        <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
          Runtime version(s)
        </TableHeaderCell>
        <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
          Features enabled
        </TableHeaderCell>
        <TableHeaderCell
          value={({ item }) => item.exposures?.list?.length || 0}
          sortable
          sortingType={sortingTypes[4]}
          sortingOrder={4}
          onClick={headerClickHandler}
        >
          Exposures
        </TableHeaderCell>
        <TableHeaderCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
          Recommended version
        </TableHeaderCell>
      </TableHeader>
      {({ item }) => (
        <TableRow>
          <TableRowCell additionalValue={item.account.name}>
            {item.account.id}
          </TableRowCell>
          <TableRowCell onClick={() => openLogger(item.guid)}>
            {item.name}
          </TableRowCell>
          <TableRowCell alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}>
            {item.agentVersions?.display || ''}
          </TableRowCell>
          <TableRowCell>{item.recommend?.age?.display}</TableRowCell>
          <TableRowCell>{item.language}</TableRowCell>
          <TableRowCell
            alignmentType={TableRowCell.ALIGNMENT_TYPE.CENTER}
            additionalValue={runtimeDetails(
              item.language,
              item.runtimeVersions
            )}
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
            {statusCell(item.recommend, item.language)}
          </TableRowCell>
        </TableRow>
      )}
    </Table>
  );
};

const statusCell = ({ version = '', statuses = [] } = {}, language) => (
  <>
    <a
      className="u-unstyledLink cell-link"
      target="_blank"
      rel="noreferrer"
      href={
        version && language && version in releaseNotes[language]
          ? releaseNotes[language][version]
          : defaultReleaseNotes[language]
      }
    >
      {version}
    </a>
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

const runtimeDetails = (language, runtimeVersions = {}) => {
  if (language === AGENTS.DOTNET) return runtimeVersions.type || '';
  if (language === AGENTS.PHP) return runtimeVersions.zts ? 'ZTS' : '';
  if (language === AGENTS.RUBY)
    return runtimeVersions.rails?.display
      ? `Rails ${runtimeVersions.rails.display}`
      : '';
  return '';
};

ListingTable.propTypes = {
  displayedEntities: PropTypes.array
};

export default ListingTable;
