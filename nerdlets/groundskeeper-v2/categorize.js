import { LANGUAGES } from './constants';

const categorizeEntities = entities => {
  const initObj = {
    byAccount: {},
    byLanguage: {},
    byTag: {},
    all: { entities: [], guids: [] }
  };
  const { byAccount, byLanguage, byTag, all } = entities.reduce(
    categorizeFn,
    initObj
  );
  return {
    entitiesByAccount: flattenAccounts(byAccount),
    accountsCount: Object.keys(byAccount).length,
    entitiesByLanguage: flattenLanguages(byLanguage),
    languagesCount: Object.keys(byLanguage).length,
    entitiesByTag: flattenTags(byTag),
    tagsCount: Object.keys(byTag).length,
    allEntities: all
  };
};

const categorizeFn = (acc, entity) => {
  const {
    account: { id, name },
    guid,
    language,
    tags,
    reporting
  } = entity;
  if (!LANGUAGES.some(lang => lang === language)) return acc;
  if (reporting) acc.all.guids.push(guid);
  acc.all.entities.push(entity);
  if (id && name) {
    acc.byAccount =
      id in acc.byAccount
        ? {
            ...acc.byAccount,
            [id]: {
              ...acc.byAccount[id],
              count: acc.byAccount[id].count + 1,
              guids: reporting
                ? [...acc.byAccount[id].guids, guid]
                : acc.byAccount[id].guids,
              entities: [...acc.byAccount[id].entities, entity]
            }
          }
        : {
            ...acc.byAccount,
            [id]: {
              name,
              count: 1,
              guids: reporting ? [guid] : [],
              entities: [entity]
            }
          };
  }
  if (language) {
    acc.byLanguage =
      language in acc.byLanguage
        ? {
            ...acc.byLanguage,
            [language]: {
              count: acc.byLanguage[language].count + 1,
              guids: reporting
                ? [...acc.byLanguage[language].guids, guid]
                : acc.byLanguage[language].guids,
              entities: [...acc.byLanguage[language].entities, entity]
            }
          }
        : {
            ...acc.byLanguage,
            [language]: {
              count: 1,
              guids: reporting ? [guid] : [],
              entities: [entity]
            }
          };
  }
  if (tags) {
    Object.keys(tags).forEach(tag => {
      if (!(tag in acc.byTag)) acc.byTag[tag] = {};
      const values = tags[tag];
      const valuesArray = Array.isArray(values) ? values : [values];
      valuesArray.forEach(val => {
        if (!(val in acc.byTag[tag]))
          acc.byTag[tag][val] = {
            count: 0,
            guids: [],
            entities: []
          };
        acc.byTag[tag][val] = {
          count: acc.byTag[tag][val].count + 1,
          guids: reporting
            ? [...acc.byTag[tag][val].guids, guid]
            : acc.byTag[tag][val].guids,
          entities: [...acc.byTag[tag][val].entities, entity]
        };
      });
    });
  }
  return acc;
};

const flattenAccounts = byAccount =>
  Object.keys(byAccount).reduce((acc, acct) => {
    const account = byAccount[acct];
    let idx = 0;
    while (idx < acc.length && account.count < acc[idx].count) idx++;
    acc.splice(idx, 0, {
      text: `${acct} - ${account.name}`,
      count: account.count,
      type: 'button',
      guids: account.guids,
      entities: account.entities,
      account: acct
    });
    return acc;
  }, []);

const flattenLanguages = byLanguage =>
  Object.keys(byLanguage).reduce((acc, lang) => {
    const language = byLanguage[lang];
    let idx = 0;
    while (idx < acc.length && language.count < acc[idx].count) idx++;
    acc.splice(idx, 0, {
      text: lang,
      count: language.count,
      type: 'button',
      guids: language.guids,
      entities: language.entities
    });
    return acc;
  }, []);

const flattenTags = tagsObject =>
  Object.keys(tagsObject).reduce((acc, tag, tagIndex) => {
    const tagObject = tagsObject[tag];
    const values = Object.keys(tagObject);
    const { tagArr, entitiesCount } = values.reduce(
      (tacc, val) => {
        const value = tagObject[val];
        const { count, guids, entities } = value;
        tacc.entitiesCount += count;
        let idx = 1;
        while (idx < tacc.tagArr.length && count < tacc.tagArr[idx].count)
          idx++;
        tacc.tagArr.splice(idx, 0, {
          text: val,
          count,
          type: 'button',
          guids,
          entities,
          tagIndex
        });
        return tacc;
      },
      {
        tagArr: [
          {
            text: tag,
            type: 'tag',
            tagIndex,
            valuesCount: values.length
          }
        ],
        entitiesCount: 0
      }
    );
    tagArr[0] = { ...tagArr[0], entitiesCount };
    let idx = 0;
    while (
      idx < acc.length &&
      (acc[idx].type !== 'tag' || entitiesCount < acc[idx].entitiesCount)
    )
      idx++;
    acc.splice(idx, 0, ...tagArr);
    return acc;
  }, []);

export default categorizeEntities;
