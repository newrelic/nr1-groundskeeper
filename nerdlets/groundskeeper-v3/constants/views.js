// Saved views live in account storage (under the platform account picker), one
// document per view keyed by a uuid, so they're shared with that account's
// users. NerdStorage collections are scoped to the whole nerdpack, so these are
// prefixed to stay clear of the router's `agent-groundskeeper` collection.
const VIEWS_STORE = { collection: 'v3-views' };

// Deleting a view moves its document here, wrapped in { view, deletedAt,
// deletedBy } and keyed by the same id, so the delete can be undone. Entries
// older than DELETED_VIEWS_TTL_MS are purged once the app has loaded.
const DELETED_VIEWS_STORE = { collection: 'v3-views-deleted' };
const DELETED_VIEWS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Per-user preferences (favorite views, the default view), in *user* storage,
// so they follow the user across accounts.
const USER_PREFS_STORE = {
  collection: 'v3-preferences',
  documentId: 'preferences'
};

const ALL_APM_VIEW_ID = 'all-apm-apps';

// Built-in views are defined here, not in storage: everyone has them, in every
// account, and they can't be edited, renamed or deleted -- only used as the
// starting point for a saved view. A built-in view has no saved settings, so it
// opens with the defaults (see utils/views.js viewSettings()).
const BUILT_IN_VIEWS = [
  {
    id: ALL_APM_VIEW_ID,
    title: 'All APM apps',
    description: 'Every APM app, with no filters.',
    domain: 'APM',
    builtIn: true
  }
];

export {
  VIEWS_STORE,
  DELETED_VIEWS_STORE,
  DELETED_VIEWS_TTL_MS,
  USER_PREFS_STORE,
  ALL_APM_VIEW_ID,
  BUILT_IN_VIEWS
};
