import {
  findView,
  formatCreatedMeta,
  generateId,
  normalizeDeletedViews,
  normalizeViews,
  sameSettings,
  storableFilters,
  userStamp,
  viewSettings
} from './views';
import { ALL_APM_VIEW_ID } from '../constants';

const condition = {
  id: 'c1',
  key: {
    option: 'language',
    type: 'string',
    index: 1,
    values: [{ value: 'java' }, { value: 'go' }]
  },
  operator: { value: '=', label: '=' },
  values: { value: 'java' },
  conjunction: null
};

describe('generateId', () => {
  test('returns a distinct uuid-shaped id each time', () => {
    const a = generateId();
    const b = generateId();

    expect(a).toMatch(/^[0-9a-f-]{36}$/);
    expect(a).not.toBe(b);
  });
});

describe('normalizeViews', () => {
  test('turns { id, document } entries into views with their id', () => {
    expect(
      normalizeViews([{ id: 'v1', document: { title: 'Payments' } }])
    ).toEqual([{ id: 'v1', title: 'Payments' }]);
  });

  test('accepts bare documents and skips entries without an id', () => {
    expect(
      normalizeViews([{ id: 'v2', title: 'Bare' }, { title: 'x' }])
    ).toEqual([{ id: 'v2', title: 'Bare' }]);
  });

  test('returns [] for anything but an array', () => {
    expect(normalizeViews(undefined)).toEqual([]);
    expect(normalizeViews({})).toEqual([]);
  });
});

describe('normalizeDeletedViews', () => {
  test('unwraps archived views and skips entries without one', () => {
    expect(
      normalizeDeletedViews([
        {
          id: 'v1',
          document: {
            view: { id: 'v1', title: 'Old' },
            deletedAt: '2026-01-01T00:00:00.000Z'
          }
        },
        { id: 'v2', document: {} }
      ])
    ).toEqual([
      {
        id: 'v1',
        view: { id: 'v1', title: 'Old' },
        deletedAt: '2026-01-01T00:00:00.000Z',
        deletedBy: null
      }
    ]);
  });
});

describe('storableFilters', () => {
  test("drops the option's value list from each condition's key", () => {
    const [stored] = storableFilters([condition]);

    expect(stored.key).toEqual({
      option: 'language',
      type: 'string',
      index: 1
    });
    expect(stored.values).toEqual({ value: 'java' });
    expect(stored.operator).toEqual(condition.operator);
  });

  test('leaves conditions without a key alone', () => {
    expect(storableFilters([{ id: 'c2', key: null }])).toEqual([
      { id: 'c2', key: null }
    ]);
  });
});

describe('viewSettings', () => {
  test('fills in the defaults for a view with nothing saved', () => {
    expect(viewSettings({ id: ALL_APM_VIEW_ID, builtIn: true })).toEqual({
      filters: [],
      hideCurrent: false,
      showAccountName: false,
      sorting: { name: 'status', direction: 'asc' }
    });
  });

  test("keeps a saved view's settings", () => {
    expect(
      viewSettings({
        filters: [condition],
        hideCurrent: true,
        showAccountName: true,
        sorting: { name: 'name', direction: 'desc' },
        title: 'not a setting'
      })
    ).toEqual({
      filters: storableFilters([condition]),
      hideCurrent: true,
      showAccountName: true,
      sorting: { name: 'name', direction: 'desc' }
    });
  });
});

describe('sameSettings', () => {
  test('treats a live condition and its saved copy as the same', () => {
    const live = { filters: [condition] };
    const stored = JSON.parse(
      JSON.stringify({ filters: storableFilters([condition]) })
    );

    expect(sameSettings(live, stored)).toBe(true);
  });

  test('ignores key order', () => {
    expect(
      sameSettings(
        { sorting: { name: 'name', direction: 'desc' } },
        { sorting: { direction: 'desc', name: 'name' } }
      )
    ).toBe(true);
  });

  test('notices a changed setting', () => {
    expect(sameSettings({}, { hideCurrent: true })).toBe(false);
    expect(sameSettings({}, { filters: [condition] })).toBe(false);
    expect(
      sameSettings({}, { sorting: { name: 'version', direction: 'asc' } })
    ).toBe(false);
  });
});

describe('formatCreatedMeta', () => {
  test('names the creator and the date', () => {
    const meta = formatCreatedMeta(
      { name: 'Pat Example' },
      '2026-08-27T12:00:00.000Z'
    );

    expect(meta).toMatch(/^Created by Pat Example · /);
    expect(meta).toContain('2026');
  });

  test('falls back to the email, then to just "Created"', () => {
    expect(formatCreatedMeta({ email: 'pat@example.com' })).toBe(
      'Created by pat@example.com'
    );
    expect(formatCreatedMeta(null, 'not a date')).toBe('Created');
  });
});

describe('findView', () => {
  test('finds built-in and saved views by id', () => {
    const saved = { id: 'v1', title: 'Payments' };

    expect(findView([saved], 'v1')).toBe(saved);
    expect(findView([saved], ALL_APM_VIEW_ID).builtIn).toBe(true);
    expect(findView([saved], 'missing')).toBeNull();
    expect(findView([saved], null)).toBeNull();
  });
});

describe('userStamp', () => {
  test('keeps only the id, name and email', () => {
    expect(
      userStamp({ id: 7, name: 'Pat', email: 'p@x.com', extra: 1 })
    ).toEqual({ id: 7, name: 'Pat', email: 'p@x.com' });
    expect(userStamp(undefined)).toBeNull();
  });
});
