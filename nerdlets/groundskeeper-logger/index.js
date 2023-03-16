import React, { useContext, useEffect, useState } from 'react';

import {
  BlockText,
  HeadingText,
  JsonChart,
  NerdletStateContext,
  Spinner,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  Toast
} from 'nr1';
import useFetchEntity from './hooks/useFetchEntity';

const GroundskeeperLogger = () => {
  const nerdletState = useContext(NerdletStateContext);
  const [guid, setGuid] = useState();
  const [skip, setSkip] = useState(true);
  const { entity, error, loading } = useFetchEntity({ guid, skip });

  useEffect(() => {
    if (nerdletState.guid) setGuid(nerdletState.guid);
  }, [nerdletState]);

  useEffect(() => {
    if (guid) setSkip(false);
  }, [guid]);

  useEffect(() => {
    if (entity && Object.keys(entity)) setSkip(true);
  }, [entity]);

  useEffect(() => {
    if (error)
      Toast.showToast({
        title: 'Error fetching entity',
        description: error.message,
        type: Toast.TYPE.CRITICAL
      });
  }, [error]);

  return (
    <div className="container logger">
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="header">
            <div className="col">
              <BlockText>{entity.language}</BlockText>
              <HeadingText>{entity.name}</HeadingText>
            </div>
            <div className="col">
              <BlockText>{entity.account?.id}</BlockText>
              <HeadingText>{entity.account?.name}</HeadingText>
            </div>
            <div className="col">
              <BlockText>agent ver min</BlockText>
              <HeadingText>{entity.agentVersions?.min}</HeadingText>
            </div>
            <div className="col">
              <BlockText>agent ver max</BlockText>
              <HeadingText>{entity.agentVersions?.max}</HeadingText>
            </div>
          </div>
          <div className="instances">
            <Table
              className="details"
              items={entity?.applicationInstances?.details || []}
            >
              <TableHeader>
                <TableHeaderCell width="1%">#</TableHeaderCell>
                <TableHeaderCell>Runtime version</TableHeaderCell>
                <TableHeaderCell>Runtime type</TableHeaderCell>
                <TableHeaderCell>Rails version</TableHeaderCell>
                <TableHeaderCell>OS version</TableHeaderCell>
                <TableHeaderCell>ZTS</TableHeaderCell>
                <TableHeaderCell>DT</TableHeaderCell>
                <TableHeaderCell>Inf</TableHeaderCell>
                <TableHeaderCell>Log</TableHeaderCell>
              </TableHeader>
              {({ item, index }) => (
                <TableRow key={index}>
                  <TableRowCell width="1%">{index + 1}</TableRowCell>
                  <TableRowCell>{item.runtime?.version}</TableRowCell>
                  <TableRowCell>{item.runtime?.type}</TableRowCell>
                  <TableRowCell>{item.runtime?.railsVersion}</TableRowCell>
                  <TableRowCell>{item.runtime?.osVersion}</TableRowCell>
                  <TableRowCell>
                    {item.runtime?.zts ? 'yes' : 'no'}
                  </TableRowCell>
                  <TableRowCell>{item.features?.dtEnabled}</TableRowCell>
                  <TableRowCell>{item.features?.infTraceHost}</TableRowCell>
                  <TableRowCell>{item.features?.logEnabled}</TableRowCell>
                </TableRow>
              )}
            </Table>
          </div>
          <div className="raw">
            <JsonChart data={entity} fullWidth fullHeight />
          </div>
        </>
      )}
    </div>
  );
};

export default GroundskeeperLogger;
