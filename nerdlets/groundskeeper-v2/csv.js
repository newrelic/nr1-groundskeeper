const download = (displayedEntities = []) => {
  const header = 'data:text/csv;charset=utf-8,';
  const heading = [
    'AccountId',
    'AccountName',
    'App Name',
    'Language',
    'Agent Version',
    'How old (in days)',
    'Runtime Version',
    'DT Enabled',
    'Logging Enabled',
    'Infinite Tracing Enabled',
    'Recommended Version',
    'Notes',
    'Exposures',
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
        entity.recommend?.version || '',
        entity.recommend?.message || '',
        (entity.exposures?.list || []).map(exp => exp.display).join(' | '),
      ].join(',')
    ),
  ].join('\n');

  if (body) window.open(encodeURI(`${header}${body}`));
};

const runtimeStr = runtimeVersions => {
  if (!runtimeVersions) return '';
  const { display, type } = runtimeVersions;
  const typeStr = type ? ` (${type})` : '';
  return display ? `${display}${typeStr}` : '';
};

export default { download };
