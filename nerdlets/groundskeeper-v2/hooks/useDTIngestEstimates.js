import { useEffect, useState } from 'react';
import { useNerdGraphQuery } from 'nr1';

const QUERY_TIME_BUCKETS = [
  ['08', '14'],
  ['14', '20'],
  ['20', '02'],
  ['02', '08']
];

const USER_ID_QUERY = '{actor{user{id}}}';

const BYTES_PER_SPAN = {
  dotnet: [867, 1023, 1392],
  go: [882, 1035, 1443],
  java: [876, 993, 1213],
  nodejs: [881, 1012, 1269],
  php: [1824, 2268, 3474],
  python: [947, 1062, 1289],
  ruby: [779, 907, 1224]
};

const SPANS_PER_TRAN = {
  dotnet: [3, 5, 13],
  go: [7, 15, 38],
  java: [15, 20, 41],
  nodejs: [5, 9, 17],
  php: [59, 162, 628],
  python: [9, 15, 31],
  ruby: [23, 33, 70]
};

const SPAN_EVENT_LIMIT = 2000;

const PERCENTILES = [50, 70, 90];

const useDTIngestEstimates = ({ entities = [], selectedDate }) => {
  const [ingestEstimatesBytes, setIngestEstimatesBytes] = useState({});
  const [query, setQuery] = useState(USER_ID_QUERY);
  const [skip, setSkip] = useState(true);
  const { data, error, loading } = useNerdGraphQuery({ query, skip });

  useEffect(() => {
    if (
      !entities ||
      !entities.length ||
      !selectedDate ||
      !(selectedDate instanceof Date)
    )
      return;
    const dates = [
      dateStamp(selectedDate),
      dateStamp(new Date(selectedDate.getTime() + 86400000))
    ];
    const queries = entities.reduce((acc, entity, i) => {
      QUERY_TIME_BUCKETS.forEach((times, j) => {
        const d1 = j > 2 ? dates[1] : dates[0];
        const d2 = j > 1 ? dates[1] : dates[0];
        const qry = nrql(entity.guid, d1, times[0], d2, times[1]);
        const ql = `(accounts: ${entity.account.id}, query: "${qry}")`;
        acc.push(`q${i}_${j}: nrql${ql} {
          results
        }`);
      });
      return acc;
    }, []);
    setQuery(`{ actor { ${queries.join('\n')} } }`);
  }, [entities, selectedDate]);

  useEffect(() => {
    if (query === USER_ID_QUERY) return;
    setSkip(false);
  }, [query]);

  useEffect(() => {
    if (!data || loading) return;
    const actor = data.actor;
    if (!actor || !Object.keys(actor).length) return;
    const dataTable = entities.reduce((acc, { guid, language }, i) => {
      if (!(guid in acc)) acc[guid] = { rows: [], lookup: {}, language };
      const { rows, lookup } = acc[guid];
      ['0', '1', '2', '3'].forEach(j => {
        const results = actor[`q${i}_${j}`]?.results;
        if (results && results.length) {
          results.forEach(({ WebTransaction, beginTimeSeconds, facet }) => {
            const timeExistsInLookup = beginTimeSeconds in lookup;
            let row;
            if (timeExistsInLookup) {
              row = lookup[beginTimeSeconds];
            } else {
              row = rows.length;
              lookup[beginTimeSeconds] = row;
              rows[row] = [beginTimeSeconds];
            }
            rows[row][
              facet === 'WebTransactionTotalTime' ? 1 : 2
            ] = WebTransaction;
          });
        }
      });
      acc[guid] = { rows, lookup, language };
      return acc;
    }, {});

    setIngestEstimatesBytes(
      Object.keys(dataTable).reduce((acc, guid) => {
        if (!(guid in acc)) acc[guid] = [];
        const { rows, language } = dataTable[guid];
        if (rows.length === 1440) {
          acc[guid] = rows.reduce(
            ([s1, s2, s3], row) => {
              const [p1, p2, p3] = estimatedBytesByPercentile(
                row[1] || 0,
                row[2] || 0,
                language
              );
              return [s1 + p1, s2 + p2, s3 + p3];
            },
            [0, 0, 0]
          );
        }
        return acc;
      }, {})
    );
  }, [data, loading]);

  useEffect(() => {
    if (!error) return;
    console.log('ERROR', error); // eslint-disable-line no-console
  }, [error]);

  return { ingestEstimatesBytes, loading };
};

const estimatedBytesByPercentile = (transactions, instances, lang) =>
  transactions && instances && lang
    ? PERCENTILES.map((_, p) => {
        const transPerInst = Math.ceil(transactions / instances);
        const spansPerInst = Math.min(
          SPANS_PER_TRAN[lang][p] * transPerInst,
          SPAN_EVENT_LIMIT
        );
        const bytesPerInst = spansPerInst * BYTES_PER_SPAN[lang][p];
        return bytesPerInst * instances;
      })
    : [0, 0, 0];

const nrql = (guid, d1, t1, d2, t2) =>
  `
  SELECT count(newrelic.timeslice.value) AS WebTransaction
  FROM Metric
  WHERE metricTimesliceName IN ('WebTransactionTotalTime', 'Application/Instance/count')
  AND entity.guid = '${guid}'
  SINCE '${d1} ${t1}:00:00' UNTIL '${d2} ${t2}:00:00'
  TIMESERIES 1 minute
  FACET metricTimesliceName
`.replace(/\s/g, ' ');

const dateStamp = d =>
  d
    .toISOString()
    .split('T')
    .shift();

export default useDTIngestEstimates;
