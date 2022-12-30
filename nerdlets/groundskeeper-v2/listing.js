import React, { useEffect, useState } from 'react';

import { Button, Card, CardHeader, CardBody, EmptyState } from 'nr1';

import useFetchEntitiesDetails from './useFetchEntitiesDetails';
import { exposures } from './cve';
import { recommend } from './recommendations';
import ListingTable from './listing-table';
import ProgressBar from './progress-bar';
import csv from './csv';

const Listing = ({
  entities = [],
  guids = [],
  entitiesDetails = {},
  setEntitiesDetails,
  agentReleases = {},
  latestReleases = {},
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [guidsToFetch, setGuidsToFetch] = useState([]);
  const { details } = useFetchEntitiesDetails({ guidsToFetch });

  useEffect(() => {
    if (!guids?.length) return;
    setGuidsToFetch(guids);
  }, [guids]);

  useEffect(() => {
    const entitiesReturned = Object.keys(details);
    if (!entitiesReturned.length) return;
    const newEntities = entitiesReturned.filter(
      entity => !(entity in entitiesDetails)
    );
    if (!newEntities.length) return;
    console.log('newEntities', newEntities.length);
    setEntitiesDetails(deets =>
      newEntities.reduce((acc, entity) => {
        const entityObject = entities.find(e => e.guid === entity);
        return {
          ...acc,
          [entity]: {
            ...details[entity],
            recommend: recommend(
              details[entity],
              entityObject,
              latestReleases,
              agentReleases
            ),
            exposures: exposures(entityObject),
          },
        };
      }, deets)
    );
  }, [details]);

  if (!entities || !entities.length)
    return (
      <EmptyState
        fullWidth
        fullHeight
        iconType={
          EmptyState.ICON_TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__ALL_ENTITIES
        }
        title="No entities to display"
        description="Select a filter on the left to display entities"
      />
    );

  const transitionHandler = () => setIsLoading(false);

  return (
    <>
      <div className="head">
        <div className="col">
          <Button loading={isLoading} type={Button.TYPE.TERTIARY} onClick={() => csv.download(entities, entitiesDetails)}>
            Download
          </Button>
          {isLoading ? <ProgressBar
            max={guidsToFetch.length}
            value={Object.keys(details).length}
            onEnd={transitionHandler}
          /> : <span />}
        </div>
      </div>
      <div className="body">
        <ListingTable entities={entities} entitiesDetails={entitiesDetails} />
      </div>
    </>
  );
};

export default Listing;
