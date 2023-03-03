import { formatNum } from './formatter';

const header = 'data:text/csv;charset=utf-8,';

const response = data => window.open(encodeURI(`${header}${data}`));

const download = (displayedEntities = []) => {
  const heading = [
    'Account id',
    'Account name',
    'App name',
    'Language',
    'Agent version',
    'How old (in days)',
    'Runtime version',
    'Distributed tracing enabled',
    'Logging enabled',
    'Infinite tracing enabled',
    'Exposures',
    'Recommended version',
    'Notes'
  ].join(',');

  const body = [
    heading,
    ...displayedEntities.map(entity =>
      [
        entity.account?.id || '',
        entity.account?.name || '',
        entity.name || '',
        entity.language || '',
        entity.agentVersions?.default || '',
        entity.recommend?.age?.days || '',
        runtimeStr(entity.runtimeVersions),
        entity.features?.dtEnabled || '',
        entity.features?.logEnabled || '',
        entity.features?.infTraceHost || '',
        pipeSeparated(entity.exposures?.list, 'display'),
        entity.recommend?.version || '',
        pipeSeparated(entity.recommend?.statuses, 'message')
      ].join(',')
    )
  ].join('\n');

  if (body) response(body);
};

const downloadDTIE = (entityEstimates = []) => {
  const heading = [
    'Account id',
    'Account name',
    'App name',
    'Language',
    'Moderate (50th Percentile) GB/day',
    'Moderate (50th Percentile) GB/month',
    'High (70th Percentile) GB/day',
    'High (70th Percentile) GB/month',
    'Very High (90th Percentile) GB/day',
    'Very High (90th Percentile) GB/month'
  ].join(',');

  const body = [
    heading,
    ...entityEstimates.map(entity =>
      [
        entity.account?.id || '',
        entity.account?.name || '',
        entity.name || '',
        entity.language || '',
        ...allEntityEstimatesDayAndMonth(entity.estimatesGigabytes)
      ].join(',')
    )
  ].join('\n');

  if (body) response(body);
};

const allEntityEstimatesDayAndMonth = (estimatesGB = []) =>
  estimatesGB.reduce(
    (acc, cur) => [
      ...acc,
      formatNum(cur).replaceAll(',', ''),
      formatNum(cur * 30).replaceAll(',', '')
    ],
    []
  );

const pipeSeparated = (arr = [], key) =>
  arr
    .reduce(
      (acc, cur) => (cur[key] ? [...acc, cur[key].replace(/,/g, '')] : acc),
      []
    )
    .join(' | ');

const runtimeStr = runtimeVersions => {
  if (!runtimeVersions) return '';
  const { display, type } = runtimeVersions;
  const typeStr = type ? ` (${type})` : '';
  return display ? `${display}${typeStr}` : '';
};

export { download, downloadDTIE };
