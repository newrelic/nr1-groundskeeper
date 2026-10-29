import { useCallback, useMemo, useRef, useState } from 'react';
import { useUserStorageMutation, useUserStorageQuery } from 'nr1';

import { USER_PREFS_STORE } from '../constants';

const NO_FAVORITES = {};

// The user's favorite views and default view, from user storage.
//
// Changes show straight away: they're kept locally and written in the
// background, and put back if the write fails. Every write sends the whole
// preferences document, built from the latest local copy (a ref, so two quick
// changes in a row don't overwrite each other).
const useUserPrefs = () => {
  const { data, loading } = useUserStorageQuery(USER_PREFS_STORE);
  const [write] = useUserStorageMutation({
    actionType: useUserStorageMutation.ACTION_TYPE.WRITE_DOCUMENT
  });
  const [local, setLocal] = useState(null);
  const prefs = local || data || {};
  const latest = useRef(prefs);
  latest.current = prefs;

  const update = useCallback(
    async changes => {
      const before = latest.current;
      const next = { ...before, ...changes };
      latest.current = next;
      setLocal(next);
      const { error } = await write({ ...USER_PREFS_STORE, document: next });
      // Put it back, unless something else has changed it since (the next
      // render then resets `latest` from `local`).
      if (error) setLocal(current => (current === next ? before : current));
      return { error };
    },
    [write]
  );

  const favorites = useMemo(() => prefs.favoriteViews || NO_FAVORITES, [
    prefs.favoriteViews
  ]);
  const defaultViewId = prefs.defaultViewId || null;

  const toggleFavorite = useCallback(
    id => {
      const next = { ...(latest.current.favoriteViews || {}) };
      if (next[id]) delete next[id];
      else next[id] = true;
      return update({ favoriteViews: next });
    },
    [update]
  );

  // `id` null clears the default.
  const setDefaultViewId = useCallback(
    id => update({ defaultViewId: id || null }),
    [update]
  );

  return {
    favorites,
    defaultViewId,
    loading,
    toggleFavorite,
    setDefaultViewId
  };
};

export default useUserPrefs;
