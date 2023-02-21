import React, { useCallback, useEffect, useRef, useState } from 'react';

import useFetchEntities from './hooks/useFetchEntities';
import Listing from './components/Listing';
import Loader from './components/Loader';
import Redirector from './components/Redirector';
import Filter from './components/Filter';
import categorizedEntities from './categorize';
import DTIngestEstimator from './components/DTIngestEstimator';

const MAX_ENTITIES_CAN_FETCH = 1000;

const GroundskeeperV2Nerdlet = () => {
  const [entitiesDetails, setEntitiesDetails] = useState({});
  const [loaderIsDone, setLoaderIsDone] = useState(false);
  const [filtered, setFiltered] = useState({
    guids: [],
    accounts: [],
    languages: [],
    tags: [],
    allGuids: [],
    maxEntities: MAX_ENTITIES_CAN_FETCH,
    id: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showDTIE, setShowDTIE] = useState(false);
  const [entitiesForDTIE, setEntitiesForDTIE] = useState([]);
  const [selections, setSelections] = useState({
    accounts: {
      selected: {},
      counter: 0
    },
    languages: {
      selected: {},
      counter: 0
    },
    tags: {
      selected: {},
      counter: 0
    }
  });
  const [isAndOperator, setIsAndOperator] = useState(true);
  const entitiesLookup = useRef({});
  const { count, entities, agentReleases, latestReleases } = useFetchEntities();

  useEffect(() => {
    if (!loaderIsDone) return;
    const { all, accounts, languages, tags, lookup } = categorizedEntities(
      entities
    );
    entitiesLookup.current = lookup;

    setFiltered(({ id }) => ({
      guids: all.length > MAX_ENTITIES_CAN_FETCH ? [] : all,
      accounts,
      languages,
      tags,
      allGuids: all,
      maxEntities: MAX_ENTITIES_CAN_FETCH,
      id: id + 1
    }));
  }, [entities.length, loaderIsDone]);

  useEffect(() => {
    if (!filtered.id) return;
    setShowFilters(
      !filtered.guids.length || filtered.guids.length > filtered.maxEntities
    );
  }, [filtered.id]);

  const updateFilteredGuids = filteredGuids =>
    setFiltered(fltrd => ({
      ...fltrd,
      guids: filteredGuids,
      id: fltrd.id + 1
    }));

  const loaderEndHandler = () => setLoaderIsDone(true);

  const openDTIEHandler = useCallback(forEntities => {
    setEntitiesForDTIE(forEntities);
    setShowDTIE(true);
  });

  const closeDTIEHandler = useCallback(() => {
    setShowDTIE(false);
  });

  if (showFilters)
    return (
      <div className="container">
        <Redirector />
        <Filter
          filtered={filtered}
          selections={selections}
          isAndOperator={isAndOperator}
          setSelections={setSelections}
          setIsAndOperator={setIsAndOperator}
          updateFilteredGuids={updateFilteredGuids}
          setShowFilters={setShowFilters}
        />
      </div>
    );

  if (showDTIE)
    return (
      <div className="container">
        <Redirector />
        <DTIngestEstimator
          entities={entitiesForDTIE}
          onClose={closeDTIEHandler}
        />
      </div>
    );

  return (
    <div className="container">
      <Redirector />
      {loaderIsDone ? (
        <Listing
          entitiesDetails={entitiesDetails}
          setEntitiesDetails={setEntitiesDetails}
          agentReleases={agentReleases}
          latestReleases={latestReleases}
          filtered={filtered}
          entitiesLookup={entitiesLookup.current}
          setShowFilters={setShowFilters}
          onOpenDTIE={openDTIEHandler}
        />
      ) : (
        <Loader
          count={count}
          loaded={entities.length}
          onEnd={loaderEndHandler}
        />
      )}
    </div>
  );
};

export default GroundskeeperV2Nerdlet;
