import { normalizeEntity } from './entities';

test('prefers minVersion over maxVersion when both are present', () => {
  const entity = normalizeEntity({
    guid: 'guid-1',
    name: 'checkout-api',
    accountId: 123,
    language: 'java',
    reporting: true,
    runningAgentVersions: { minVersion: '7.4.0', maxVersion: '7.5.0' }
  });

  expect(entity.version).toBe('7.4.0');
});

test('falls back to maxVersion when there is no minVersion', () => {
  const entity = normalizeEntity({
    runningAgentVersions: { maxVersion: '8.4.2' }
  });

  expect(entity.version).toBe('8.4.2');
});

test('version is null when no agent versions are reported', () => {
  const entity = normalizeEntity({ runningAgentVersions: {} });

  expect(entity.version).toBeNull();
});

test('handles a completely missing runningAgentVersions', () => {
  const entity = normalizeEntity({ guid: 'guid-1' });

  expect(entity.version).toBeNull();
});

// Regression test: GraphQL returns an explicit `null` (not just omitting the key)
// for an app with no running agent versions. A `= {}` destructuring default only
// catches `undefined`, not `null`, and previously threw "Cannot read properties of
// null (reading 'maxVersion')" straight through this function.
test('handles an explicit null runningAgentVersions, not just a missing one', () => {
  expect(() =>
    normalizeEntity({ guid: 'guid-1', runningAgentVersions: null })
  ).not.toThrow();
  expect(normalizeEntity({ runningAgentVersions: null }).version).toBeNull();
});

// Same class of bug, same GraphQL entity fragment -- tags can also come back as an
// explicit null instead of an empty array.
test('handles an explicit null tags, not just a missing one', () => {
  expect(() => normalizeEntity({ tags: null })).not.toThrow();
  expect(normalizeEntity({ tags: null }).tags).toEqual({});
});

test('converts the tags array into a key -> values map', () => {
  const entity = normalizeEntity({
    tags: [
      { key: 'env', values: ['production'] },
      { key: 'team', values: ['payments', 'checkout'] }
    ]
  });

  expect(entity.tags).toEqual({
    env: ['production'],
    team: ['payments', 'checkout']
  });
});

test('skips tags with no key and defaults to an empty tags object', () => {
  expect(normalizeEntity({ tags: [{ values: ['orphaned'] }] }).tags).toEqual(
    {}
  );
  expect(normalizeEntity({}).tags).toEqual({});
});

test('passes through the plain identity fields untouched', () => {
  const entity = normalizeEntity({
    guid: 'guid-1',
    name: 'checkout-api',
    accountId: 123,
    language: 'java',
    reporting: false
  });

  expect(entity).toMatchObject({
    guid: 'guid-1',
    name: 'checkout-api',
    accountId: 123,
    language: 'java',
    reporting: false
  });
});
