import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { Button, Checkbox, EmptyState } from 'nr1';

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
  selectedIndex = -1
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [guidsToFetch, setGuidsToFetch] = useState([]);
  const [guidsFetched, setGuidsFetched] = useState(0);
  const [showNonReporting, setShowNonReporting] = useState(false);
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
                [entity]: details[entity]
              },
        deets
      )
    );
    setGuidsFetched(guids.filter(guid => guid in details).length);
  }, [details]);

  const transitionHandler = () => setIsLoading(false);

  const checkHandler = ({ target: { checked } = {} } = {}) =>
    setShowNonReporting(checked);

  const displayedEntities = useMemo(
    () =>
      entities.reduce(
        (acc, { guid, reporting, ...entity }) =>
          showNonReporting || reporting
            ? [
                ...acc,
                {
                  ...entity,
                  runtimeVersions: entitiesDetails[guid]?.runtimeVersions,
                  recommend: recommend(
                    entitiesDetails[guid],
                    entity,
                    latestReleases,
                    agentReleases
                  ),
                  features: entitiesDetails[guid]?.features,
                  exposures: exposures(entity)
                }
              ]
            : acc,
        []
      ),
    [entities, entitiesDetails]
  );

  return !entities || !entities.length ? (
    <EmptyState
      fullWidth
      fullHeight
      iconType={
        EmptyState.ICON_TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__ALL_ENTITIES
      }
      title="Select a filter on the left to display entities"
    />
  ) : (
    <>
      <div className="head">
        <div className="col">
          <Checkbox
            checked={showNonReporting}
            onChange={checkHandler}
            label="Show non-reporting"
            info="Checking this option displays applications that are not currently reporting. Non-reporting applications cannot show upgrade recommendations."
          />
        </div>
        <div className="col">
          <Button
            loading={isLoading}
            type={Button.TYPE.TERTIARY}
            onClick={() => csv.download(displayedEntities)}
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
        <ListingTable displayedEntities={displayedEntities} />
      </div>
    </>
  );
};

Listing.propTypes = {
  entities: PropTypes.array,
  guids: PropTypes.array,
  entitiesDetails: PropTypes.object,
  setEntitiesDetails: PropTypes.func,
  agentReleases: PropTypes.object,
  latestReleases: PropTypes.object,
  selectedIndex: PropTypes.number
};

export default Listing;
