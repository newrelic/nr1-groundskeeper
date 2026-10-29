import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccountStorageMutation, useAccountStorageQuery } from 'nr1';

import {
  DELETED_VIEWS_STORE,
  DELETED_VIEWS_TTL_MS,
  VIEWS_STORE
} from '../constants';
import { generateId, normalizeDeletedViews, normalizeViews } from '../utils';

// The saved views in `accountId`'s storage, and the writes that change them.
//
// Each successful write is also kept in `local` (id -> document, or null once
// deleted) and laid over what the query returned, so the listing and the open
// view show a change straight away -- whether or not the storage query has
// refetched yet -- and a deleted view never flashes back. It's per account, and
// dropped when the account changes.
const useViews = accountId => {
  const skip = !accountId;
  const { data, loading, error } = useAccountStorageQuery({
    accountId,
    ...VIEWS_STORE,
    skip
  });
  const {
    data: deletedData,
    loading: deletedLoading
  } = useAccountStorageQuery({ accountId, ...DELETED_VIEWS_STORE, skip });
  const [write] = useAccountStorageMutation({
    actionType: useAccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT
  });
  const [remove] = useAccountStorageMutation({
    actionType: useAccountStorageMutation.ACTION_TYPE.DELETE_DOCUMENT
  });

  const [local, setLocal] = useState({});
  useEffect(() => setLocal({}), [accountId]);
  const setLocalDoc = useCallback(
    (id, doc) => setLocal(prev => ({ ...prev, [id]: doc })),
    []
  );

  const views = useMemo(() => {
    const stored = normalizeViews(data).filter(({ id }) => !(id in local));
    const written = Object.values(local).filter(Boolean);
    return [...stored, ...written];
  }, [data, local]);

  const writeView = useCallback(
    async view => {
      const { error: writeError } = await write({
        accountId,
        ...VIEWS_STORE,
        documentId: view.id,
        document: view
      });
      if (!writeError) setLocalDoc(view.id, view);
      return { error: writeError };
    },
    [accountId, write, setLocalDoc]
  );

  // `fields` is everything but the id and timestamps.
  const createView = useCallback(
    async fields => {
      const now = new Date().toISOString();
      const view = {
        ...fields,
        id: generateId(),
        createdAt: now,
        updatedAt: now
      };
      const { error: writeError } = await writeView(view);
      return { view: writeError ? null : view, error: writeError };
    },
    [writeView]
  );

  const updateView = useCallback(
    (view, changes) =>
      writeView({ ...view, ...changes, updatedAt: new Date().toISOString() }),
    [writeView]
  );

  // Archive first and delete second, so a failure part-way never loses the
  // view: if the delete fails, the archive copy is removed again.
  const deleteView = useCallback(
    async (view, deletedBy = null) => {
      const { error: archiveError } = await write({
        accountId,
        ...DELETED_VIEWS_STORE,
        documentId: view.id,
        document: { view, deletedAt: new Date().toISOString(), deletedBy }
      });
      if (archiveError) return { error: archiveError };
      const { error: deleteError } = await remove({
        accountId,
        ...VIEWS_STORE,
        documentId: view.id
      });
      if (deleteError) {
        await remove({
          accountId,
          ...DELETED_VIEWS_STORE,
          documentId: view.id
        });
        return { error: deleteError };
      }
      setLocalDoc(view.id, null);
      return {};
    },
    [accountId, write, remove, setLocalDoc]
  );

  // Write the view back first, then drop its archive copy (best effort: the
  // view is already back, and the purge below would clear a leftover anyway).
  const restoreView = useCallback(
    async view => {
      const { error: restoreError } = await writeView(view);
      if (restoreError) return { error: restoreError };
      await remove({ accountId, ...DELETED_VIEWS_STORE, documentId: view.id });
      return {};
    },
    [accountId, writeView, remove]
  );

  // Once per account, after both collections have loaded: permanently remove
  // views deleted more than DELETED_VIEWS_TTL_MS ago.
  const purged = useRef(new Set());
  useEffect(() => {
    if (!accountId || loading || deletedLoading) return;
    if (purged.current.has(accountId)) return;
    purged.current.add(accountId);
    const cutoff = Date.now() - DELETED_VIEWS_TTL_MS;
    const stale = normalizeDeletedViews(deletedData).filter(({ deletedAt }) => {
      const when = Date.parse(deletedAt);
      return Number.isFinite(when) && when < cutoff;
    });
    stale.forEach(async ({ id }) => {
      const { error: purgeError } = await remove({
        accountId,
        ...DELETED_VIEWS_STORE,
        documentId: id
      });
      if (purgeError) {
        // eslint-disable-next-line no-console
        console.error(
          '[groundskeeper] failed to purge a deleted view',
          id,
          purgeError
        );
        purged.current.delete(accountId); // try again on a later render
      }
    });
  }, [accountId, loading, deletedLoading, deletedData, remove]);

  return {
    views,
    loading: !skip && loading,
    error,
    createView,
    updateView,
    deleteView,
    restoreView
  };
};

export default useViews;
