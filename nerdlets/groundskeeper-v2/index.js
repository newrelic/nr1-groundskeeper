import React, { useEffect, useState } from 'react';

import useFetchEntities from './hooks/useFetchEntities';
import categorizeEntities from './categorize';
import Listing from './components/Listing';
import Sidebar from './components/Sidebar';
import Loader from './components/Loader';

const GroundskeeperV2Nerdlet = () => {
  const [guids, setGuids] = useState([]);
  const [shownEntities, setShownEntities] = useState([]);
  const [entitiesDetails, setEntitiesDetails] = useState({});
  const [sidebarItems, setSidebarItems] = useState([]);
  const [loaderIsDone, setLoaderIsDone] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { count, entities, agentReleases, latestReleases } = useFetchEntities();

  // console.log(`Summarized ${entities.length} of ${count} entities`)

  useEffect(() => {
    if (!loaderIsDone) return;

    const {
      entitiesByAccount,
      entitiesByLanguage,
      entitiesByTag,
      allEntities,
    } = categorizeEntities(entities);

    setSidebarItems([
      {
        text: 'All entities',
        count: allEntities.guids.length || 0,
        type: 'button',
        action: 'all',
        guids: allEntities.guids,
        entities: allEntities.entities,
      },
      { text: 'Accounts', type: 'section' },
      ...entitiesByAccount,
      { text: 'Languages', type: 'section' },
      ...entitiesByLanguage,
      { text: 'Tags', type: 'section' },
      ...entitiesByTag,
    ]);
  }, [entities.length, loaderIsDone]);

  const changeSelection = (selection, index) => {
    // setShownEntities((selection.guids || []).map(sel => entities.find(({guid}) => sel === guid)));
    setShownEntities(selection.entities);
    setGuids(
      selection.guids.filter(
        guid =>
          !(
            guid in entitiesDetails && Object.keys(entitiesDetails[guid]).length
          )
      )
    );
    setSelectedIndex(index);
  };

  const loaderEndHandler = () => setLoaderIsDone(true);

  return loaderIsDone ? (
    <div className="container">
      <aside className="sidebar-aside">
        <Sidebar sidebarItems={sidebarItems} onChange={changeSelection} />
      </aside>
      <section className="listing-section">
        {count === entities.length ? (
          <Listing
            entities={shownEntities}
            guids={guids}
            entitiesDetails={entitiesDetails}
            setEntitiesDetails={setEntitiesDetails}
            agentReleases={agentReleases}
            latestReleases={latestReleases}
            selectedIndex={selectedIndex}
          />
        ) : null}
      </section>
    </div>
  ) : (
    <Loader count={count} loaded={entities.length} onEnd={loaderEndHandler} />
  );
};

export default GroundskeeperV2Nerdlet;
