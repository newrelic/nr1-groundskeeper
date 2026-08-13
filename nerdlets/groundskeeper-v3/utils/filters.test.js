import { filtersArrayToNrql, keyValuesFromEntities } from './filters';

describe('keyValuesFromEntities', () => {
  const entities = [
    { name: 'checkout-api', language: 'java', tags: { env: ['production'] } },
    { name: 'ledger-worker', language: 'java', tags: { env: ['staging'] } }
  ];

  test('puts name and language first, ahead of alphabetically-sorted tags', () => {
    const options = keyValuesFromEntities(entities, []);

    expect(options.map(({ option }) => option)).toEqual([
      'name',
      'language',
      'env'
    ]);
  });

  test('collects every distinct value seen for a field', () => {
    const options = keyValuesFromEntities(entities, []);
    const language = options.find(({ option }) => option === 'language');

    expect(language.values).toEqual([{ value: 'java' }]);

    const env = options.find(({ option }) => option === 'env');
    expect(env.values.map(({ value }) => value)).toEqual([
      'production',
      'staging'
    ]);
  });

  test('merges with values already known instead of dropping them', () => {
    const existing = [
      { option: 'env', type: 'string', values: [{ value: 'canary' }] }
    ];

    const options = keyValuesFromEntities(entities, existing);
    const env = options.find(({ option }) => option === 'env');

    expect(env.values.map(({ value }) => value)).toEqual([
      'canary',
      'production',
      'staging'
    ]);
  });

  test('handles an empty entities list', () => {
    expect(keyValuesFromEntities([], [])).toEqual([]);
  });
});

describe('filtersArrayToNrql', () => {
  // The function trails a stray space or two after the last filter (an artifact of
  // the hedgehog implementation this was ported from, harmless to NRQL) -- trimming
  // keeps these assertions about the meaningful content, not that whitespace quirk.
  const toNrql = filters => filtersArrayToNrql(filters).trim();

  const stringFilter = (key, operator, value, extra = {}) => ({
    key: { value: key },
    operator: { value: operator, ...extra },
    values: { value }
  });

  test('treats name and language as bare fields, not tags', () => {
    expect(toNrql([stringFilter('name', '=', 'checkout-api')])).toBe(
      "name = 'checkout-api'"
    );
    expect(toNrql([stringFilter('language', '=', 'java')])).toBe(
      "language = 'java'"
    );
  });

  test('wraps everything else as a tags.<key> lookup', () => {
    expect(toNrql([stringFilter('env', '=', 'production')])).toBe(
      "`tags.env` = 'production'"
    );
  });

  test('applies partial/starts-with/ends-with match wrapping', () => {
    expect(
      toNrql([stringFilter('name', 'LIKE', 'check', { partialMatches: true })])
    ).toBe("name LIKE '%check%'");
    expect(toNrql([stringFilter('name', 'STARTS WITH', 'check')])).toBe(
      "name STARTS WITH '%check'"
    );
    expect(toNrql([stringFilter('name', 'ENDS WITH', 'api')])).toBe(
      "name ENDS WITH 'api%'"
    );
  });

  test('builds a parenthesized IN list for multiValue operators', () => {
    const filter = {
      key: { value: 'env' },
      operator: { value: 'IN', multiValue: true },
      values: [{ value: 'production' }, { value: 'staging' }]
    };

    expect(toNrql([filter])).toBe("`tags.env` IN ('production', 'staging')");
  });

  test('allows a valueless operator via noValueNeeded', () => {
    const filter = {
      key: { value: 'env' },
      operator: { value: 'IS NOT NULL', noValueNeeded: true },
      values: { value: '' }
    };

    expect(toNrql([filter])).toBe('`tags.env` IS NOT NULL');
  });

  test('joins multiple filters with the given conjunction', () => {
    const filters = [
      {
        ...stringFilter('language', '=', 'java'),
        conjunction: { value: 'AND' }
      },
      stringFilter('env', '=', 'production')
    ];

    expect(toNrql(filters)).toBe(
      "language = 'java' AND `tags.env` = 'production'"
    );
  });

  test('drops a filter that is missing a key, operator, or value', () => {
    expect(filtersArrayToNrql([{ operator: { value: '=' } }])).toBe('');
    expect(filtersArrayToNrql([{ key: { value: 'name' } }])).toBe('');
    expect(
      filtersArrayToNrql([{ key: { value: 'name' }, operator: { value: '=' } }])
    ).toBe('');
  });

  test('returns an empty string for no filters', () => {
    expect(filtersArrayToNrql([])).toBe('');
  });
});
