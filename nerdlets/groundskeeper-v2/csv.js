const download = (displayedEntities = []) => {
  const header = 'data:text/csv;charset=utf-8,';
  const heading = [
    'AccountId',
    'AccountName',
    'App Name',
    'Language',
    'Agent Version Min',
    'Agent Version Max',
    'Agent Version Default',
    'Age (in days of default version)',
    'Runtime Version',
    'Runtime Type',
    'DT Enabled',
    'Loging Enabled',
    'Infinte Tracing Enabled',
    'Recommended Version',
    'Exposures',
  ].join(',');

  const body = [
    heading,
    ...displayedEntities.map(entity =>
      [
        entity.account.id || '',
        entity.account.name || '',
        entity.name || '',
        entity.language || '',
        entity.agentVersions.min || '',
        entity.agentVersions.max || '',
        entity.agentVersions.default || '',
        entity.recommend?.age?.days || '',
        entity.runtimeVersions?.display || '',
        entity.runtimeVersions?.type || '',
        entity.features?.dtEnabled || '',
        entity.features?.logEnabled || '',
        entity.features?.infTraceHost || '',
        entity.recommend?.version || '',
        (entity.exposures?.list || []).join('|'),
      ].join(',')
    ),
  ].join('\n');

  if (body) window.open(encodeURI(`${header}${body}`));
};

export default { download };
