const download = (displayedEntities = []) => {
  const header = 'data:text/csv;charset=utf-8,';
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

  if (body) window.open(encodeURI(`${header}${body}`));
};

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

export default { download };
