// Adapted from nr-labs-hedgehog's signal-selection/utils.js, with `language` treated
// as a native APM entity field instead of a tag.
const DEFAULT_COLLATOR = new Intl.Collator();
const NATIVE_FIELDS = ['name', 'language'];

// Builds the FilterBar `options` list (what shows up in its "+ add filter" picker)
// from whatever entities have loaded so far, folding in values already offered so
// options don't disappear if the matching entities scroll out of the loaded page.
const keyValuesFromEntities = (entities = [], existingOptions = []) => {
  const optsMaps = existingOptions.reduce((acc, { option, values }) => {
    acc[option] = new Map(values.map(v => [v.value, v]));
    return acc;
  }, {});

  entities.forEach(({ name, language, tags }) => {
    if (typeof name === 'string') {
      if (!optsMaps.name) optsMaps.name = new Map();
      if (!optsMaps.name.has(name)) optsMaps.name.set(name, { value: name });
    }
    if (typeof language === 'string') {
      if (!optsMaps.language) optsMaps.language = new Map();
      if (!optsMaps.language.has(language)) {
        optsMaps.language.set(language, { value: language });
      }
    }
    if (tags && typeof tags === 'object') {
      Object.keys(tags).forEach(key => {
        if (!optsMaps[key]) optsMaps[key] = new Map();
        const values = Array.isArray(tags[key]) ? tags[key] : [tags[key]];
        values.forEach(value => {
          if (value !== undefined && !optsMaps[key].has(value)) {
            optsMaps[key].set(value, { value });
          }
        });
      });
    }
  });

  const sortedKeys = [
    ...NATIVE_FIELDS.filter(key => optsMaps[key]),
    ...Object.keys(optsMaps)
      .filter(key => !NATIVE_FIELDS.includes(key))
      .sort(DEFAULT_COLLATOR.compare)
  ];

  return sortedKeys.map(option => ({
    option,
    type: 'string',
    values: Array.from(optsMaps[option]?.values() || [])
  }));
};

// FilterBar operators entity search doesn't support, sent as LIKE instead.
const LIKE_OPERATORS = ['STARTS WITH', 'ENDS WITH'];

// Wraps a filter value in single quotes for the entity-search query. Backslashes
// and quotes are escaped, so a value like "Bob's app" can't end the string early
// and break (or change) the query.
const quote = value =>
  `'${String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")}'`;

// Converts FilterBar's selected-filters array into the NRQL-like `filters` string
// useEntitySearchQuery expects. Ported from hedgehog's utils.js filtersArrayToNrql,
// with these changes: `name`/`language` are real APM entity fields, so they're
// used bare, while everything else is assumed to be a tag (`tags.<key>`). Values
// are escaped (see quote). Entity search rejects STARTS WITH and ENDS WITH as
// invalid, so they're sent as LIKE 'value%' and LIKE '%value' (hedgehog sent
// them as-is, with the wildcards reversed).
const filtersArrayToNrql = (filters = []) =>
  filters
    .map((filter, i) => {
      const lastIndex = filters.length - 1;
      const conjunction =
        i === lastIndex ? '' : filter.conjunction?.value || '';
      if (!conjunction && i < lastIndex) return '';
      const key = filter.key?.value;
      if (!key) return '';
      const { value: operator, multiValue, noValueNeeded, partialMatches } =
        filter.operator || {};
      if (!operator) return '';
      const nrqlOperator = LIKE_OPERATORS.includes(operator)
        ? 'LIKE'
        : operator;
      let valueStr = '';
      if (multiValue && Array.isArray(filter.values)) {
        const valuesArr = filter.values
          ?.map(({ value } = {}) => (value?.trim?.() ? quote(value) : ''))
          .filter(Boolean);
        valueStr = valuesArr.length ? `(${valuesArr.join(', ')})` : '';
      } else if (filter?.values?.value?.trim?.()) {
        const { value } = filter.values;
        if (partialMatches) {
          valueStr = quote(`%${value}%`);
        } else if (operator === 'STARTS WITH') {
          valueStr = quote(`${value}%`);
        } else if (operator === 'ENDS WITH') {
          valueStr = quote(`%${value}`);
        } else {
          valueStr = quote(value);
        }
      }
      if (!valueStr && !noValueNeeded) return '';
      const fieldKey = NATIVE_FIELDS.includes(key) ? key : `\`tags.${key}\``;
      return `${fieldKey} ${nrqlOperator} ${valueStr} ${conjunction}`;
    })
    .join(' ');

export { keyValuesFromEntities, filtersArrayToNrql };
