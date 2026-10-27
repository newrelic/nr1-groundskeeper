import { act } from 'react-dom/test-utils';
import { useUserStorageMutation, useUserStorageQuery } from 'nr1';

import useUserPrefs from './useUserPrefs';
import { renderHook } from './testUtils';
import { USER_PREFS_STORE } from '../constants';

const { write } = useUserStorageMutation;

beforeEach(() => {
  jest.clearAllMocks();
  useUserStorageQuery.mockReturnValue({
    data: { favoriteViews: { v1: true }, defaultViewId: 'v1', other: 'kept' },
    loading: false
  });
});

describe('useUserPrefs', () => {
  test('reads favorites and the default view from user storage', () => {
    const { result } = renderHook(() => useUserPrefs());

    expect(useUserStorageQuery).toHaveBeenCalledWith(USER_PREFS_STORE);
    expect(result.current.favorites).toEqual({ v1: true });
    expect(result.current.defaultViewId).toBe('v1');
  });

  test('has no favorites or default before anything is saved', () => {
    useUserStorageQuery.mockReturnValue({ data: undefined, loading: false });
    const { result } = renderHook(() => useUserPrefs());

    expect(result.current.favorites).toEqual({});
    expect(result.current.defaultViewId).toBeNull();
  });

  test('toggles a favorite, writing the whole document', async () => {
    const { result } = renderHook(() => useUserPrefs());

    await act(async () => {
      await result.current.toggleFavorite('v2');
    });

    expect(result.current.favorites).toEqual({ v1: true, v2: true });
    expect(write).toHaveBeenCalledWith({
      ...USER_PREFS_STORE,
      document: {
        favoriteViews: { v1: true, v2: true },
        defaultViewId: 'v1',
        other: 'kept'
      }
    });

    await act(async () => {
      await result.current.toggleFavorite('v1');
    });

    expect(result.current.favorites).toEqual({ v2: true });
  });

  test("doesn't lose a change made before the previous write finished", async () => {
    const { result } = renderHook(() => useUserPrefs());

    await act(async () => {
      await Promise.all([
        result.current.toggleFavorite('v2'),
        result.current.setDefaultViewId('v2')
      ]);
    });

    expect(write).toHaveBeenLastCalledWith({
      ...USER_PREFS_STORE,
      document: expect.objectContaining({
        favoriteViews: { v1: true, v2: true },
        defaultViewId: 'v2'
      })
    });
  });

  test('sets and clears the default view', async () => {
    const { result } = renderHook(() => useUserPrefs());

    await act(async () => {
      await result.current.setDefaultViewId('v9');
    });
    expect(result.current.defaultViewId).toBe('v9');

    await act(async () => {
      await result.current.setDefaultViewId(null);
    });
    expect(result.current.defaultViewId).toBeNull();
  });

  test('puts a change back if the write fails', async () => {
    write.mockImplementationOnce(async () => ({ error: new Error('nope') }));
    const { result } = renderHook(() => useUserPrefs());

    let outcome;
    await act(async () => {
      outcome = await result.current.toggleFavorite('v2');
    });

    expect(outcome.error.message).toBe('nope');
    expect(result.current.favorites).toEqual({ v1: true });
  });
});
