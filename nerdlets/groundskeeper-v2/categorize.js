import { LANGUAGES } from './constants';

const categorizeEntities = (entities) => {
  const initObj = {
    byAccount: {}, byLanguage: {}, byTag: {}, all: {entities:[], guids: []}
  };
  const {byAccount, byLanguage, byTag, all} = entities.reduce(categorizeFn, initObj);
  return {
    entitiesByAccount: flattenAccounts(byAccount),
    entitiesByLanguage: flattenLanguages(byLanguage),
    entitiesByTag: flattenTags(byTag),
    allEntities: all,
  }; 
}

const categorizeFn = (acc, entity) => {
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
};

const flattenAccounts = byAccount => Object.keys(byAccount).map(acct => {
  const account = byAccount[acct];
  return {
    text: `${acct} - ${account.name}`,
    count: account.count,
    type: 'button',
    guids: account.guids,
    entities: account.entities,
  };
});

const flattenLanguages = byLanguage => Object.keys(byLanguage).map(lang => {
  const language = byLanguage[lang];
  return {
    text: lang,
    count: language.count,
    type: 'button',
    guids: language.guids,
    entities: language.entities,
  };
});

const flattenTags = tagsObject => Object.keys(tagsObject).reduce((acc, tag, idx) => {
  const tagObject = tagsObject[tag];
  const values = Object.keys(tagObject);
  acc.push({text: tag, type: 'tag', tagIndex: idx, valuesCount: values.length});
  values.forEach(val => {
    const value = tagObject[val];
    acc.push({
    text: val,
    count: value.count,
    type: 'button',
    guids: value.guids,
    entities: value.entities,
    tagIndex: idx,
  });
  });
  return acc;
}, []);

export default categorizeEntities;
