import React, { useEffect, useState } from 'react';

import useFetchEntities from './useFetchEntities';
import Listing from './listing';
import Sidebar from './sidebar';
import Loader from './loader';
import { LANGUAGES } from './constants';

const GroundskeeperV2Nerdlet = () => {
  const [guids, setGuids] = useState([]);
  const [shownEntities, setShownEntities] = useState([]);
  const [entitiesDetails, setEntitiesDetails] = useState({});
  const [loaderIsDone, setLoaderIsDone] = useState(false);
  const {count, entities, agentReleases, latestReleases} = useFetchEntities();
  
  console.log(`Summarized ${entities.length} of ${count} entities`)

  const {byAccount, byLanguage, byTag, all} = entities.reduce((acc, entity) => {
    const {account: {id, name}, guid, language, tags} = entity;
    if (!LANGUAGES.some(lang => lang === language)) return acc
    acc.all.guids.push(guid);
    acc.all.entities.push(entity);
    if (id && name) {
      acc.byAccount = id in acc.byAccount
      ? {
          ...acc.byAccount, 
          [id]: {
            ...acc.byAccount[id], 
            count: acc.byAccount[id].count + 1,
            guids: [...acc.byAccount[id].guids, guid],
            entities: [...acc.byAccount[id].entities, entity],
          }
        } : {
          ...acc.byAccount, 
          [id]: {
            name, 
            count: 1,
            guids: [guid],
            entities: [entity],
          }
        };
    }
    if (language) {
      acc.byLanguage = language in acc.byLanguage
        ? {
          ...acc.byLanguage,
          [language]: {
            count: acc.byLanguage[language].count + 1,
            guids: [...acc.byLanguage[language].guids, guid],
            entities: [...acc.byLanguage[language].entities, entity],
          }
        } : {
          ...acc.byLanguage,
          [language]: {
            count: 1,
            guids: [guid],
            entities: [entity],
          }
        };
    }
    if (tags) {
      Object.keys(tags).forEach(tag => {
        if (!(tag in acc.byTag)) acc.byTag[tag] = {};
        const values = tags[tag];
        const valuesArray = (Array.isArray(values)) ? values : [values];
        valuesArray.forEach(val => {
          if (!(val in acc.byTag[tag])) acc.byTag[tag][val] = {
            count: 0,
            guids: [],
            entities: [],
          };
          acc.byTag[tag][val] = {
            count: acc.byTag[tag][val].count + 1,
            guids: [...acc.byTag[tag][val].guids, guid],
            entities: [...acc.byTag[tag][val].entities, entity],
          };
        });
      });
    }
    return acc;
  }, {
    byAccount: {}, byLanguage: {}, byTag: {}, all: {entities:[], guids: []}
  });
  
  const tagOptions = Object.keys(byTag).reduce((acc, tag, idx) => ([
    ...acc,
    {text: tag, type: 'tag', tagIndex: idx, valuesCount: Object.keys(byTag[tag]).length},
    ...Object.keys(byTag[tag]).map(val => ({
      text: val,
      count: byTag[tag][val].count,
      type: 'button',
      guids: byTag[tag][val].guids,
      entities: byTag[tag][val].entities,
      tagIndex: idx,
    }))
  ]), [{text: 'By tags', type: 'section'}]);

  const sidebarItems = [
    {text: 'All entities', count: all.guids.length || 0, type: 'button', action: 'all', guids: all.guids, entities: all.entities},
    {text: 'By account', type: 'section'},
    ...Object.keys(byAccount).map(acct => ({
      text: `${acct} - ${byAccount[acct].name}`,
      count: byAccount[acct].count,
      type: 'button',
      guids: byAccount[acct].guids,
      entities: byAccount[acct].entities,
    })),
    {text: 'By language', type: 'section'},
    ...Object.keys(byLanguage).map(lang => ({
      text: lang,
      count: byLanguage[lang].count,
      type: 'button',
      guids: byLanguage[lang].guids,
      entities: byLanguage[lang].entities,
    })),
    ...tagOptions,
  ];

  const changeSelection = selection => {
    console.log('selection changed', selection)
    // setShownEntities((selection.guids || []).map(sel => entities.find(({guid}) => sel === guid)));
    setShownEntities(selection.entities);
    setGuids(selection.guids.filter(guid => !(guid in entitiesDetails && Object.keys(entitiesDetails[guid]).length)));
  }

  const loaderEndHandler = () => setLoaderIsDone(true);

  if (loaderIsDone) 
    return <Loader count={count} loaded={entities.length} onEnd={loaderEndHandler} />;

  return (
    <div className="container">
      <aside className="sidebar-aside">
        <Sidebar sidebarItems={sidebarItems} onChange={changeSelection} />
      </aside>
      <section className="listing-section">
        {
          count === entities.length 
          ? <Listing 
              entities={shownEntities} 
              guids={guids} 
              entitiesDetails={entitiesDetails} 
              setEntitiesDetails={setEntitiesDetails}
              agentReleases={agentReleases}
              latestReleases={latestReleases} />
          : null
        }
      </section>
    </div>
  );
}

export default GroundskeeperV2Nerdlet;
