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

  // One case per string operator FilterBar offers (OPERATORS.string in
  // @newrelic/nr-labs-components).
  test.each([
    ['=', {}, 'checkout-api', "name = 'checkout-api'"],
    ['!=', {}, 'checkout-api', "name != 'checkout-api'"],
    ['LIKE', { partialMatches: true }, 'check', "name LIKE '%check%'"],
    ['NOT LIKE', { partialMatches: true }, 'check', "name NOT LIKE '%check%'"],
    ['STARTS WITH', {}, 'check', "name LIKE 'check%'"],
    ['ENDS WITH', {}, 'api', "name LIKE '%api'"]
  ])('builds %s', (operator, extra, value, expected) => {
    expect(toNrql([stringFilter('name', operator, value, extra)])).toBe(
      expected
    );
  });

  test.each([
    ['IN', "`tags.env` IN ('production', 'staging')"],
    ['NOT IN', "`tags.env` NOT IN ('production', 'staging')"]
  ])('builds %s as a parenthesized list', (operator, expected) => {
    const filter = {
      key: { value: 'env' },
      operator: { value: operator, multiValue: true },
      values: [{ value: 'production' }, { value: 'staging' }]
    };

    expect(toNrql([filter])).toBe(expected);
  });

  test.each(['IS NULL', 'IS NOT NULL'])('builds %s with no value', operator => {
    const filter = {
      key: { value: 'env' },
      operator: { value: operator, noValueNeeded: true },
      values: { value: '' }
    };

    expect(toNrql([filter])).toBe(`\`tags.env\` ${operator}`);
  });

  test('escapes quotes and backslashes in values', () => {
    expect(toNrql([stringFilter('name', '=', "Bob's app")])).toBe(
      "name = 'Bob\\'s app'"
    );
    expect(toNrql([stringFilter('name', '=', 'C:\\apps')])).toBe(
      "name = 'C:\\\\apps'"
    );
    expect(
      toNrql([
        stringFilter('name', 'LIKE', "o'brien", { partialMatches: true })
      ])
    ).toBe("name LIKE '%o\\'brien%'");
  });

  test('escapes quotes in IN lists', () => {
    const filter = {
      key: { value: 'team' },
      operator: { value: 'IN', multiValue: true },
      values: [{ value: "Bob's team" }, { value: 'platform' }]
    };

    expect(toNrql([filter])).toBe(
      "`tags.team` IN ('Bob\\'s team', 'platform')"
    );
  });

  test('a quote in a value cannot end the string early', () => {
    expect(toNrql([stringFilter('name', '=', "x' OR name LIKE '%")])).toBe(
      "name = 'x\\' OR name LIKE \\'%'"
    );
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
