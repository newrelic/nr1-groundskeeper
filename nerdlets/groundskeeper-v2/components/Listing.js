import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { Button, Checkbox, EmptyState, Icon, Tooltip } from 'nr1';

import useFetchEntitiesDetails from '../hooks/useFetchEntitiesDetails';
import { exposures } from '../cve';
import { recommend } from '../recommendations';
import ListingTable from './ListingTable';
import ProgressBar from './ProgressBar';
import { download } from '../csv';

const Listing = ({
  entitiesDetails = {},
  setEntitiesDetails,
  agentReleases = {},
  latestReleases = {},
  filtered = {},
  entitiesLookup = {},
  setShowFilters,
  onOpenDTIE
}) => {
  const [entities, setEntities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [guidsToFetch, setGuidsToFetch] = useState([]);
  const [guidsFetched, setGuidsFetched] = useState(0);
  const [showNonReporting, setShowNonReporting] = useState(false);
  const { details } = useFetchEntitiesDetails({ guidsToFetch });

  useEffect(() => {
    if (!filtered.guids.length) return;
    const fetchGuids = filtered.guids.filter(
      guid => !(guid in entitiesDetails)
    );
    if (fetchGuids.length) {
      setIsLoading(true);
      setGuidsFetched(0);
      setGuidsToFetch(fetchGuids);
    }
    setEntities(filtered.guids.map(guid => entitiesLookup[guid]));
  }, [filtered.id]);

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
    setGuidsFetched(filtered.guids.filter(guid => guid in details).length);
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
                  guid,
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

  const entitiesNoDT = useMemo(
    () => displayedEntities.filter(e => !e.features?.dtEnabled),
    [displayedEntities]
  );

  const downloadHandler = useCallback(() => download(displayedEntities), [
    displayedEntities
  ]);

  return (
    <div className="listing">
      <div className="header">
        <div className="col">
          <Button
            type={Button.TYPE.PLAIN}
            onClick={() => setShowFilters(true)}
            sizeType={Button.SIZE_TYPE.SMALL}
            iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__FILTER}
          >
            Filters
          </Button>
        </div>
        {entities.length ? (
          <>
            <div className="col right">
              <Checkbox
                checked={showNonReporting}
                onChange={checkHandler}
                label="Show non-reporting"
                info="Checking this option displays applications that are not currently reporting. Non-reporting applications cannot show upgrade recommendations."
              />
            </div>
            <div className="col with-info">
              <Button
                type={Button.TYPE.TERTIARY}
                disabled={isLoading || !entitiesNoDT.length}
                onClick={() => onOpenDTIE(entitiesNoDT)}
              >
                DT ingest estimator
              </Button>
              <Tooltip text="For apps that don't have Distributed Tracing enabled, use the Distributed Tracing Ingest Estimator to get projected ingest when Distributed Tracing is turned on.">
                <Icon type={Icon.TYPE.INTERFACE__INFO__INFO} />
              </Tooltip>
            </div>
            <div className="col">
              <Button
                loading={isLoading}
                type={Button.TYPE.SECONDARY}
                onClick={downloadHandler}
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
          </>
        ) : null}
      </div>
      <div className="content">
        {entities.length ? (
          <ListingTable displayedEntities={displayedEntities} />
        ) : (
          <EmptyState
            fullWidth
            fullHeight
            iconType={
              EmptyState.ICON_TYPE.INTERFACE__SIGN__EXCLAMATION__V_ALTERNATE
            }
            title="No apps to display"
            description="Either no apps were found or there are more apps than the limit. Use the filters to narrow down the list of apps."
            action={{
              label: 'Filters',
              onClick: () => setShowFilters(true)
            }}
          />
        )}
      </div>
    </div>
  );
};

Listing.propTypes = {
  entitiesDetails: PropTypes.object,
  setEntitiesDetails: PropTypes.func,
  agentReleases: PropTypes.object,
  latestReleases: PropTypes.object,
  filtered: PropTypes.object,
  entitiesLookup: PropTypes.object,
  setShowFilters: PropTypes.func,
  onOpenDTIE: PropTypes.func
};

export default Listing;
