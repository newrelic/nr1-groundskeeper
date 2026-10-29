import { BUILT_IN_VIEWS } from '../constants';
import { DEFAULT_SORTING } from './status';

// A uuid for a new view: the platform's crypto API where there is one, else an
// RFC 4122-style v4 string.
const generateId = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// A collection-only account-storage query returns [{ id, document }]; turn that
// into a list of views, each with its `id`. Bare documents are accepted too.
const normalizeViews = data => {
  if (!Array.isArray(data)) return [];
  return data
    .map(entry => {
      const doc = entry?.document ?? entry;
      const id = entry?.id ?? doc?.id;
      return id && doc ? { ...doc, id } : null;
    })
    .filter(Boolean);
};

// The deleted-views collection, as { id, view, deletedAt, deletedBy }. Entries
// without an archived view are skipped.
const normalizeDeletedViews = data => {
  if (!Array.isArray(data)) return [];
  return data
    .map(entry => {
      const doc = entry?.document ?? entry;
      const id = entry?.id ?? doc?.view?.id;
      if (!id || !doc?.view) return null;
      return {
        id,
        view: doc.view,
        deletedAt: doc.deletedAt ?? null,
        deletedBy: doc.deletedBy ?? null
      };
    })
    .filter(Boolean);
};

// FilterBar's conditions carry the whole option they were picked from in `key`,
// including every value it offers (all the app names, for `name`). FilterBar
// reads those from its `options` prop, not from the condition, so they're
// dropped before a view is saved -- they'd only bloat the document.
const storableFilters = (filters = []) =>
  filters.map(({ key, ...condition }) => {
    if (!key || typeof key !== 'object') return { ...condition, key };
    const { values, ...option } = key;
    return { ...condition, key: option };
  });

// What a view saves, with the defaults filled in: a built-in view (or an older
// document missing a field) opens the way the table does with nothing saved.
const viewSettings = (view = {}) => ({
  filters: storableFilters(Array.isArray(view.filters) ? view.filters : []),
  hideCurrent: Boolean(view.hideCurrent),
  showAccountName: Boolean(view.showAccountName),
  sorting: {
    name: view.sorting?.name || DEFAULT_SORTING.name,
    direction: view.sorting?.direction || DEFAULT_SORTING.direction
  }
});

// JSON with object keys sorted, so two settings compare equal however their
// keys happen to be ordered (a document read back from storage, say).
const stableStringify = value => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .filter(k => value[k] !== undefined)
      .sort()
      .map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
};

const sameSettings = (a, b) =>
  stableStringify(viewSettings(a)) === stableStringify(viewSettings(b));

// "Created by Jane Doe · Aug 27, 2026", leaving out whatever isn't known.
const formatCreatedMeta = (createdBy, createdAt) => {
  const who = createdBy?.name || createdBy?.email;
  const at = createdAt ? new Date(createdAt) : null;
  const when =
    at && !Number.isNaN(at.getTime())
      ? at.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : '';
  const by = who ? `Created by ${who}` : 'Created';
  return when ? `${by} · ${when}` : by;
};

const findView = (views = [], id) =>
  (id && [...BUILT_IN_VIEWS, ...views].find(view => view.id === id)) || null;

// `{ id, name, email }` from useUserQuery()'s user, for createdBy/deletedBy.
const userStamp = user =>
  user
    ? {
        id: user.id ?? null,
        name: user.name ?? null,
        email: user.email ?? null
      }
    : null;

export {
  generateId,
  normalizeViews,
  normalizeDeletedViews,
  storableFilters,
  viewSettings,
  sameSettings,
  formatCreatedMeta,
  findView,
  userStamp
};
