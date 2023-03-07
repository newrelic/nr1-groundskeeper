import { useEffect, useRef, useState } from 'react';
import { useNerdGraphQuery } from 'nr1';

const QUERY_TIME_BUCKETS = [
  ['08', '14'],
  ['14', '20'],
  ['20', '02'],
  ['02', '08']
];

const USER_ID_QUERY = '{actor{user{id}}}';

const MAX_QUERIES_IN_BATCH = 99;

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
  const [nrqlQueriesBatches, setNrqlQueriesBatches] = useState([]);
  const [entityResults, setEntityResults] = useState({});
  const [query, setQuery] = useState(USER_ID_QUERY);
  const [skip, setSkip] = useState(true);
  const batchCursor = useRef(0);
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

    const queries = entities.reduce(
      (acc, entity, i) => {
        QUERY_TIME_BUCKETS.forEach((times, j) => {
          const d1 = j > 2 ? dates[1] : dates[0];
          const d2 = j > 1 ? dates[1] : dates[0];
          const qry = nrql(entity.guid, d1, times[0], d2, times[1]);
          const ql = `(accounts: ${entity.account.id}, query: "${qry}")`;
          acc.queue.push(`q${i}_${j}: nrql${ql} {
          results
        }`);
          if (acc.queue.length === MAX_QUERIES_IN_BATCH) {
            acc.batches.push(acc.queue);
            acc.queue = [];
          }
        });
        return acc;
      },
      { batches: [], queue: [] }
    );
    if (queries.queue.length) queries.batches.push(queries.queue);
    setNrqlQueriesBatches(queries.batches);
    setEntityResults({});
  }, [entities, selectedDate]);

  useEffect(() => {
    if (!nrqlQueriesBatches.length) return;
    setQuery(
      `{ actor { ${nrqlQueriesBatches[batchCursor.current].join('\n')} } }`
    );
    batchCursor.current = batchCursor.current + 1;
  }, [nrqlQueriesBatches]);

  useEffect(() => {
    if (query === USER_ID_QUERY) return;
    setSkip(false);
  }, [query]);

  useEffect(() => {
    if (loading || !data || !data.actor || !Object.keys(data.actor).length)
      return;
    setSkip(true);

    setEntityResults(
      Object.keys(data.actor).reduce(
        (acc, cur) => {
          const results = data.actor[cur]?.results;
          if (!results || !results.length) return acc;
          const [entityIndex] = cur
            .slice(1)
            .split('_')
            .map(Number);
          const { guid, language } = entities[entityIndex];
          if (!(guid in acc)) acc[guid] = { language };
          results.forEach(({ WebTransaction, beginTimeSeconds, facet }) => {
            if (!(beginTimeSeconds in acc[guid]))
              acc[guid][beginTimeSeconds] = [];
            acc[guid][beginTimeSeconds][
              +(facet === 'WebTransactionTotalTime')
            ] = WebTransaction;
          });
          return acc;
        },
        { ...entityResults }
      )
    );
  }, [data, loading]);

  useEffect(() => {
    if (!entityResults || !Object.keys(entityResults)) return;
    if (batchCursor.current < nrqlQueriesBatches.length) {
      setQuery(
        `{ actor { ${nrqlQueriesBatches[batchCursor.current].join('\n')} } }`
      );
      batchCursor.current = batchCursor.current + 1;
    } else {
      setIngestEstimatesBytes(
        Object.keys(entityResults).reduce((acc, entity) => {
          const { language = 'go', ...times } = entityResults[entity];
          const timesKeys = Object.keys(times);
          if (timesKeys.length === 1440) {
            acc[entity] = timesKeys.reduce(
              ([t1, t2, t3], key) => {
                const [instances, transactions] = times[key];
                const [p1, p2, p3] = estimatedBytesByPercentile(
                  transactions,
                  instances,
                  language
                );
                return [t1 + p1, t2 + p2, t3 + p3];
              },
              [0, 0, 0]
            );
          } else {
            acc[entity] = [0, 0, 0];
          }
          return acc;
        }, {})
      );
      setNrqlQueriesBatches([]);
      batchCursor.current = 0;
    }
  }, [entityResults]);

  useEffect(() => {
    if (!error) return;
    console.log('ERROR', error); // eslint-disable-line no-console
  }, [error]);

  return { ingestEstimatesBytes, loading, error };
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
