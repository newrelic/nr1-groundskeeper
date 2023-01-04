import React, { useEffect, useState } from 'react';

import { Button, EmptyState } from 'nr1';

import useFetchEntitiesDetails from '../hooks/useFetchEntitiesDetails';
import { exposures } from '../cve';
import { recommend } from '../recommendations';
import ListingTable from './ListingTable';
import ProgressBar from './ProgressBar';
import csv from '../csv';

const Listing = ({
  entities = [],
  guids = [],
  entitiesDetails = {},
  setEntitiesDetails,
  agentReleases = {},
  latestReleases = {},
  selectedIndex = -1,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [guidsToFetch, setGuidsToFetch] = useState([]);
  const [guidsFetched, setGuidsFetched] = useState(0);
  const { details } = useFetchEntitiesDetails({ guidsToFetch });

  useEffect(() => {
    if (!guids?.length) return;
    setIsLoading(true);
    setGuidsFetched(0);
    setGuidsToFetch(guids);
  }, [selectedIndex]);

  useEffect(() => {
    const entitiesReturned = Object.keys(details);
    if (!entitiesReturned.length) return;
    setEntitiesDetails(deets =>
      entitiesReturned.reduce(
        (acc, entity) =>
          entity in deets
            ? acc
            : {
                ...acc,
                [entity]: details[entity],
              },
        deets
      )
    );
    setGuidsFetched(guids.filter(guid => guid in details).length);
  }, [details]);

  const transitionHandler = () => setIsLoading(false);

  const displayedEntities = () =>
    entities.map(({ guid, ...entity }) => ({
      ...entity,
      runtimeVersions: entitiesDetails[guid]?.runtimeVersions,
      recommend: recommend(
        entitiesDetails[guid],
        entity,
        latestReleases,
        agentReleases
      ),
      features: entitiesDetails[guid]?.features,
      exposures: exposures(entity),
    }));

  return !entities || !entities.length ? (
    <EmptyState
      fullWidth
      fullHeight
      iconType={
        EmptyState.ICON_TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__ALL_ENTITIES
      }
      title="No entities to display"
      description="Select a filter on the left to display entities"
    />
  ) : (
    <>
      <div className="head">
        <div className="col">
          <Button
            loading={isLoading}
            type={Button.TYPE.TERTIARY}
            onClick={() => csv.download(displayedEntities())}
          >
            Download
          </Button>
          {isLoading ? (
            <ProgressBar
              max={guidsToFetch.length}
              value={guidsFetched}
              onEnd={transitionHandler}
            />
          ) : (
            <span />
          )}
        </div>
      </div>
      <div className="body">
        <ListingTable displayedEntities={displayedEntities()} />
      </div>
    </>
  );
};

export default Listing;
