
const download = (entities = [], entitiesDetails = {}) => {
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

  const data = [
    heading,
    ...entities.map(entity => [
      entity.account.id || '',
      entity.account.name || '',
      entity.name || '',
      entity.language || '',
      entity.agentVersions.min || '',
      entity.agentVersions.max || '',
      entity.agentVersions.default || '',
      entitiesDetails[entity.guid]?.recommend?.age?.days || '',
      entitiesDetails[entity.guid]?.runtimeVersions?.display || '',
      entitiesDetails[entity.guid]?.runtimeVersions?.type || '',
      entitiesDetails[entity.guid]?.features?.dtEnabled || '',
      entitiesDetails[entity.guid]?.features?.logEnabled || '',
      entitiesDetails[entity.guid]?.features?.infTraceHost || '',
      entitiesDetails[entity.guid]?.recommend?.version || '',
      (entitiesDetails[entity.guid]?.exposures?.list || []).join('|'),
    ].join(',')),
  ].join('\n');

  if (data) window.open(encodeURI(`${header}${data}`));
}

export default { download };
