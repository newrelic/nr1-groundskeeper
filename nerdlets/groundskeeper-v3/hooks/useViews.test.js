import { act } from 'react-dom/test-utils';
import { useAccountStorageMutation, useAccountStorageQuery } from 'nr1';

import useViews from './useViews';
import { renderHook } from './testUtils';
import {
  DELETED_VIEWS_STORE,
  DELETED_VIEWS_TTL_MS,
  VIEWS_STORE
} from '../constants';

const { write, remove } = useAccountStorageMutation;

const stored = { id: 'v1', document: { id: 'v1', title: 'Payments' } };

// The views query and the deleted-views query, told apart by collection.
const mockStorage = ({ views = [], deleted = [], loading = false } = {}) =>
  useAccountStorageQuery.mockImplementation(({ collection }) => ({
    data: collection === VIEWS_STORE.collection ? views : deleted,
    loading
  }));

const failOnce = (fn, message = 'nope') =>
  fn.mockImplementationOnce(async () => ({ error: new Error(message) }));

beforeEach(() => {
  jest.clearAllMocks();
  mockStorage({ views: [stored] });
});

describe('useViews', () => {
  test("lists the account's saved views", () => {
    const { result } = renderHook(() => useViews(1));

    expect(result.current.views).toEqual([{ id: 'v1', title: 'Payments' }]);
    expect(useAccountStorageQuery).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: 1, ...VIEWS_STORE, skip: false })
    );
  });

  test('skips the queries, and is not loading, without an account', () => {
    useAccountStorageQuery.mockImplementation(() => ({
      data: undefined,
      loading: true
    }));
    const { result } = renderHook(() => useViews(undefined));

    expect(result.current.loading).toBe(false);
    expect(useAccountStorageQuery).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true })
    );
  });

  test('creates a view with an id and timestamps, and lists it straight away', async () => {
    const { result } = renderHook(() => useViews(1));

    let created;
    await act(async () => {
      created = await result.current.createView({ title: 'New' });
    });

    const { view } = created;
    expect(view).toEqual(
      expect.objectContaining({ title: 'New', id: expect.any(String) })
    );
    expect(view.createdAt).toBe(view.updatedAt);
    expect(write).toHaveBeenCalledWith({
      accountId: 1,
      ...VIEWS_STORE,
      documentId: view.id,
      document: view
    });
    expect(result.current.views.map(v => v.title)).toEqual(['Payments', 'New']);
  });

  test("doesn't list a view whose write failed", async () => {
    failOnce(write);
    const { result } = renderHook(() => useViews(1));

    let created;
    await act(async () => {
      created = await result.current.createView({ title: 'New' });
    });

    expect(created.view).toBeNull();
    expect(created.error.message).toBe('nope');
    expect(result.current.views).toHaveLength(1);
  });

  test('shows an update before the query refetches', async () => {
    const { result } = renderHook(() => useViews(1));

    await act(async () => {
      await result.current.updateView(result.current.views[0], {
        title: 'Renamed'
      });
    });

    expect(result.current.views).toEqual([
      expect.objectContaining({ id: 'v1', title: 'Renamed' })
    ]);
  });

  test('archives a view before deleting it, and stops listing it', async () => {
    const { result } = renderHook(() => useViews(1));
    const view = result.current.views[0];

    await act(async () => {
      await result.current.deleteView(view, { name: 'Pat' });
    });

    expect(write).toHaveBeenCalledWith({
      accountId: 1,
      ...DELETED_VIEWS_STORE,
      documentId: 'v1',
      document: {
        view,
        deletedAt: expect.any(String),
        deletedBy: { name: 'Pat' }
      }
    });
    expect(remove).toHaveBeenCalledWith({
      accountId: 1,
      ...VIEWS_STORE,
      documentId: 'v1'
    });
    expect(write.mock.invocationCallOrder[0]).toBeLessThan(
      remove.mock.invocationCallOrder[0]
    );
    expect(result.current.views).toEqual([]);
  });

  test("doesn't delete a view it couldn't archive", async () => {
    failOnce(write);
    const { result } = renderHook(() => useViews(1));

    let outcome;
    await act(async () => {
      outcome = await result.current.deleteView(result.current.views[0]);
    });

    expect(outcome.error.message).toBe('nope');
    expect(remove).not.toHaveBeenCalled();
    expect(result.current.views).toHaveLength(1);
  });

  test('removes the archive copy again if the delete fails', async () => {
    failOnce(remove);
    const { result } = renderHook(() => useViews(1));

    let outcome;
    await act(async () => {
      outcome = await result.current.deleteView(result.current.views[0]);
    });

    expect(outcome.error.message).toBe('nope');
    expect(remove).toHaveBeenLastCalledWith({
      accountId: 1,
      ...DELETED_VIEWS_STORE,
      documentId: 'v1'
    });
    expect(result.current.views).toHaveLength(1);
  });

  test('restores a deleted view and clears its archive copy', async () => {
    const { result } = renderHook(() => useViews(1));
    const view = result.current.views[0];
    await act(async () => {
      await result.current.deleteView(view);
    });
    jest.clearAllMocks();

    await act(async () => {
      await result.current.restoreView(view);
    });

    expect(write).toHaveBeenCalledWith(
      expect.objectContaining({ ...VIEWS_STORE, documentId: 'v1' })
    );
    expect(remove).toHaveBeenCalledWith({
      accountId: 1,
      ...DELETED_VIEWS_STORE,
      documentId: 'v1'
    });
    expect(result.current.views).toEqual([view]);
  });

  test('purges views deleted longer ago than the retention window, once', () => {
    const old = new Date(Date.now() - DELETED_VIEWS_TTL_MS - 1000);
    const recent = new Date();
    mockStorage({
      views: [],
      deleted: [
        { id: 'old', document: { view: { id: 'old' }, deletedAt: old } },
        { id: 'new', document: { view: { id: 'new' }, deletedAt: recent } }
      ]
    });

    const { rerender } = renderHook(() => useViews(1));
    rerender();

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith({
      accountId: 1,
      ...DELETED_VIEWS_STORE,
      documentId: 'old'
    });
  });

  test("doesn't purge until both collections have loaded", () => {
    mockStorage({
      loading: true,
      deleted: [
        {
          id: 'old',
          document: { view: { id: 'old' }, deletedAt: new Date(0) }
        }
      ]
    });

    renderHook(() => useViews(1));

    expect(remove).not.toHaveBeenCalled();
  });

  test('forgets local changes when the account changes', async () => {
    const { result, rerender } = renderHook(id => useViews(id), 1);
    await act(async () => {
      await result.current.createView({ title: 'Only in account 1' });
    });

    rerender(2);

    expect(result.current.views.map(v => v.title)).toEqual(['Payments']);
  });
});
