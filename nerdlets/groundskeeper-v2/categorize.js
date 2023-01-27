import { LANGUAGES } from './constants';

const categorizedEntities = entities => {
  const categorized = entities.reduce(
    (acc, entity) => {
      const {
        account: { id: acctId, name: acctName },
        guid,
        language,
        tags,
        reporting
      } = entity;
      if (
        reporting &&
        acctId &&
        language &&
        !LANGUAGES.some(lang => lang === language)
      )
        return acc;
      acc.all.push(guid);
      acc.lookup[guid] = entity;

      acc.accounts =
        acctId in acc.accounts
          ? {
              ...acc.accounts,
              [acctId]: {
                ...acc.accounts[acctId],
                // count: acc.accounts[acctId].count + 1,
                guids: [...acc.accounts[acctId].guids, guid]
              }
            }
          : {
              ...acc.accounts,
              [acctId]: {
                name: acctName,
                text: `${acctId} - ${acctName}`,
                // count: 1,
                guids: [guid]
              }
            };

      acc.languages =
        language in acc.languages
          ? {
              ...acc.languages,
              [language]: {
                ...acc.languages[language],
                // count: acc.languages[language].count + 1,
                guids: [...acc.languages[language].guids, guid]
              }
            }
          : {
              ...acc.languages,
              [language]: {
                text: language,
                // count: 1,
                guids: [guid]
              }
            };

      if (tags && Object.keys(tags).length) {
        Object.keys(tags).forEach(tag => {
          if (!(tag in acc.tags)) acc.tags[tag] = { count: 0, text: tag };
          const values = tags[tag];
          const valuesArray = Array.isArray(values) ? values : [values];
          valuesArray.forEach(value => {
            // if (!(value in acc.tags[tag]))
            acc.tags = {
              ...acc.tags,
              [tag]: {
                ...acc.tags[tag],
                count: acc.tags[tag].count + 1,
                [value]:
                  values in acc.tags[tag]
                    ? {
                        ...acc.tags[tag][value],
                        guids: [...acc.tags[tag][value].guids, guid]
                      }
                    : {
                        text: value,
                        guids: [guid]
                      }
              }
            };
          });
        });
      }

      return acc;
    },
    { all: [], accounts: {}, languages: {}, tags: {}, lookup: {} }
  );

  const tags = Object.keys(categorized.tags)
    .map(tag => {
      const { count, text, ...values } = categorized.tags[tag];
      return {
        count,
        text,
        values: Object.keys(values)
          .map(value => values[value])
          .sort(reverseSortByGuidsCount)
      };
    })
    .sort(({ count: countA }, { count: countB }) => countB - countA);

  return {
    all: categorized.all,
    lookup: categorized.lookup,
    accounts: Object.keys(categorized.accounts)
      .map(acct => categorized.accounts[acct])
      .sort(reverseSortByGuidsCount),
    languages: Object.keys(categorized.languages)
      .map(lang => categorized.languages[lang])
      .sort(reverseSortByGuidsCount),
    tags
  };
};

const reverseSortByGuidsCount = (
  { guids: guidsA = [] } = {},
  { guids: guidsB = [] } = {}
) => guidsB.length - guidsA.length;

export default categorizedEntities;
