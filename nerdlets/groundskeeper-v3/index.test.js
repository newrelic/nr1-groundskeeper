import React from 'react';
import { act } from 'react-dom/test-utils';
import {
  nerdlet,
  PlatformStateContext,
  setNerdletState,
  Toast,
  useAccountStorageMutation,
  useAccountStorageQuery,
  useEntitySearchQuery,
  useNerdletState,
  useUserStorageMutation,
  useUserStorageQuery
} from 'nr1';

import GroundskeeperV3Nerdlet from './index';
import { ALL_APM_VIEW_ID, VIEWS_STORE } from './constants';
import { renderComponent } from './components/testUtils';

const payments = {
  id: 'v-payments',
  title: 'Payments team',
  domain: 'APM',
  baseViewId: ALL_APM_VIEW_ID,
  filters: [],
  hideCurrent: false
};

const setUrl = state =>
  useNerdletState.mockReturnValue([state, setNerdletState]);
const setSavedViews = (views, loading = false) =>
  useAccountStorageQuery.mockImplementation(({ collection }) => ({
    data:
      collection === VIEWS_STORE.collection
        ? views.map(document => ({ id: document.id, document }))
        : [],
    loading
  }));
const setPrefs = prefs =>
  useUserStorageQuery.mockReturnValue({ data: prefs, loading: false });

const app = (accountId = 1) => (
  <PlatformStateContext.Provider value={{ accountId }}>
    <GroundskeeperV3Nerdlet />
  </PlatformStateContext.Provider>
);

const buttonByText = (container, text) =>
  Array.from(container.querySelectorAll('button')).find(
    el => el.textContent === text
  );

const click = el =>
  act(() => {
    el.click();
  });

const clickAsync = el =>
  act(async () => {
    el.click();
  });

const type = (input, value) => {
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(input),
    'value'
  ).set;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

const toggleHideCurrent = container =>
  click(
    Array.from(container.querySelectorAll('.mock-switch'))
      .find(el => el.textContent === 'Hide current')
      .querySelector('input')
  );

// What the app last asked the platform header to show, and one of its buttons.
const lastConfig = () =>
  nerdlet.setConfig.mock.calls[nerdlet.setConfig.mock.calls.length - 1][0];
const headerButton = label =>
  lastConfig().actionControlButtons.find(b => b.label === label);
const pressHeaderButton = label =>
  act(async () => {
    headerButton(label).onClick();
  });

const saveActions = container =>
  Array.from(
    container.querySelectorAll('.groundskeeper-v3__save-actions button')
  ).map(el => el.textContent);

const modalButton = (container, label) =>
  Array.from(container.querySelectorAll('.view-modal button')).find(
    el => el.textContent === label || el.getAttribute('aria-label') === label
  );

const lastToast = () =>
  Toast.showToast.mock.calls[Toast.showToast.mock.calls.length - 1][0];

// The real query hands back the same data until it changes; a new array every
// render would loop ViewScreen's filter-options effect forever.
const NO_ENTITIES = { data: { count: 0, entities: [] }, loading: false };

beforeEach(() => {
  jest.clearAllMocks();
  useEntitySearchQuery.mockReturnValue(NO_ENTITIES);
  setUrl({});
  setSavedViews([payments]);
  setPrefs(undefined);
});

describe('GroundskeeperV3Nerdlet', () => {
  test("opens on the views listing, with the app's name in the header", () => {
    const { container } = renderComponent(app());

    expect(container.querySelector('.views-list')).not.toBeNull();
    expect(lastConfig()).toEqual(
      expect.objectContaining({
        accountPicker: true,
        actionControls: false,
        actionControlButtons: [],
        headerTitle: 'Agent Groundskeeper v3',
        headerParentTitle: undefined
      })
    );
  });

  test('opens the view named in the URL, with its name in the header', () => {
    setUrl({ viewId: payments.id });
    renderComponent(app());

    expect(lastConfig()).toEqual(
      expect.objectContaining({
        accountPicker: true,
        actionControls: true,
        headerTitle: 'Payments team',
        headerParentTitle: 'Agent Groundskeeper v3'
      })
    );
    expect(lastConfig().actionControlButtons.map(b => b.label)).toEqual([
      'Favorite',
      'Settings'
    ]);
  });

  test("links the header's app name back to the listing", () => {
    setUrl({ viewId: payments.id });
    renderComponent(app());

    expect(lastConfig().headerParentLocation).toEqual({
      mockLocation: { id: 'groundskeeper-v3', urlState: { viewId: null } }
    });
  });

  test("puts the app's header back on the way to the listing", () => {
    setUrl({ viewId: payments.id });
    const { rerender } = renderComponent(app());

    setUrl({ viewId: null });
    rerender(app());

    expect(lastConfig().headerTitle).toBe('Agent Groundskeeper v3');
    expect(lastConfig().actionControlButtons).toEqual([]);
  });

  test('opens a view from the listing', () => {
    const { container } = renderComponent(app());

    click(buttonByText(container, 'All APM apps'));

    expect(setNerdletState).toHaveBeenCalledWith({ viewId: ALL_APM_VIEW_ID });
  });

  test("says when the URL's view doesn't exist, once views have loaded", () => {
    setUrl({ viewId: 'gone' });
    setSavedViews([], true);
    const { container, rerender } = renderComponent(app());
    expect(container.querySelector('.mock-empty-state').dataset.type).toBe(
      'loading'
    );

    setSavedViews([]);
    rerender(app());
    expect(
      container.querySelector('.mock-empty-state__title').textContent
    ).toBe('View not found');
    expect(lastConfig().headerTitle).toBe('Agent Groundskeeper v3');
    click(buttonByText(container, 'Back to views'));
    expect(setNerdletState).toHaveBeenCalledWith({ viewId: null });
  });

  describe('the default view', () => {
    test('opens instead of the listing', () => {
      setPrefs({ defaultViewId: payments.id });
      renderComponent(app());

      expect(setNerdletState).toHaveBeenCalledWith({ viewId: payments.id });
    });

    test('waits for saved views to load, then opens', () => {
      setPrefs({ defaultViewId: payments.id });
      setSavedViews([], true);
      const { rerender } = renderComponent(app());
      expect(setNerdletState).not.toHaveBeenCalled();

      setSavedViews([payments]);
      rerender(app());
      expect(setNerdletState).toHaveBeenCalledWith({ viewId: payments.id });
    });

    test('only applies once, so the listing can still be reached', () => {
      setPrefs({ defaultViewId: ALL_APM_VIEW_ID });
      setUrl({ viewId: ALL_APM_VIEW_ID });
      const { rerender } = renderComponent(app());

      setUrl({});
      rerender(app());

      expect(setNerdletState).not.toHaveBeenCalled();
    });

    test("isn't used when the user went back to the listing", () => {
      setPrefs({ defaultViewId: payments.id });
      setUrl({ viewId: null });
      renderComponent(app());

      expect(setNerdletState).not.toHaveBeenCalled();
    });

    test("isn't used when the URL already names a view", () => {
      setPrefs({ defaultViewId: payments.id });
      setUrl({ viewId: ALL_APM_VIEW_ID });
      renderComponent(app());

      expect(setNerdletState).not.toHaveBeenCalled();
    });

    test("falls back to the listing if it isn't in this account", () => {
      setPrefs({ defaultViewId: 'from-another-account' });
      const { container } = renderComponent(app());

      expect(setNerdletState).not.toHaveBeenCalled();
      expect(container.querySelector('.views-list')).not.toBeNull();
    });
  });

  describe('switching accounts', () => {
    test('goes back to the listing from a saved view', () => {
      setUrl({ viewId: payments.id });
      const { rerender } = renderComponent(app(1));

      rerender(app(2));

      expect(setNerdletState).toHaveBeenCalledWith({ viewId: null });
    });

    test('keeps a built-in view open', () => {
      setUrl({ viewId: ALL_APM_VIEW_ID });
      const { rerender } = renderComponent(app(1));

      rerender(app(2));

      expect(setNerdletState).not.toHaveBeenCalled();
    });
  });

  test('shows the save buttons only once the view has changed', () => {
    setUrl({ viewId: payments.id });
    const { container } = renderComponent(app());
    expect(saveActions(container)).toEqual([]);

    toggleHideCurrent(container);
    expect(saveActions(container)).toEqual(['Save as new view', 'Save view']);

    toggleHideCurrent(container);
    expect(saveActions(container)).toEqual([]);
  });

  test('hides the save buttons when a saved view is changed back to its built-in view', () => {
    setSavedViews([{ ...payments, hideCurrent: true }]);
    setUrl({ viewId: payments.id });
    const { container } = renderComponent(app());

    // Unsaved, but now the same as "All APM apps": saving would only copy it.
    toggleHideCurrent(container);

    expect(saveActions(container)).toEqual([]);
  });

  test('offers only Save as new view on a changed built-in view', () => {
    setUrl({ viewId: ALL_APM_VIEW_ID });
    const { container } = renderComponent(app());

    toggleHideCurrent(container);

    expect(saveActions(container)).toEqual(['Save as new view']);
    expect(
      container.querySelector('.groundskeeper-v3__save-actions button').dataset
        .variant
    ).toBe('primary');
  });

  test('saves a built-in view, with its changes, as a new view and opens it', async () => {
    setUrl({ viewId: ALL_APM_VIEW_ID });
    const { container } = renderComponent(app());

    toggleHideCurrent(container);
    click(buttonByText(container, 'Save as new view'));
    type(container.querySelector('.view-modal input'), 'Behind only');
    await clickAsync(modalButton(container, 'Save view'));

    const [
      { documentId, document }
    ] = useAccountStorageMutation.write.mock.calls[0];
    expect(document).toEqual(
      expect.objectContaining({
        id: documentId,
        title: 'Behind only',
        hideCurrent: true,
        baseViewId: ALL_APM_VIEW_ID,
        domain: 'APM',
        createdBy: { id: 7, name: 'Pat Example', email: 'pat@example.com' }
      })
    );
    expect(setNerdletState).toHaveBeenCalledWith({ viewId: documentId });
    expect(lastToast().title).toBe('View saved');
    expect(useUserStorageMutation.write).not.toHaveBeenCalled();
  });

  test('can make a new view the default as it saves it', async () => {
    setUrl({ viewId: ALL_APM_VIEW_ID });
    const { container } = renderComponent(app());

    toggleHideCurrent(container);
    click(buttonByText(container, 'Save as new view'));
    type(container.querySelector('.view-modal input'), 'Behind only');
    click(container.querySelector('.view-modal__default input'));
    await clickAsync(modalButton(container, 'Save view'));

    const [{ documentId }] = useAccountStorageMutation.write.mock.calls[0];
    expect(useUserStorageMutation.write).toHaveBeenCalledWith(
      expect.objectContaining({
        document: expect.objectContaining({ defaultViewId: documentId })
      })
    );
  });

  test('saves changes to a saved view', async () => {
    setUrl({ viewId: payments.id });
    const { container } = renderComponent(app());

    toggleHideCurrent(container);
    await clickAsync(buttonByText(container, 'Save view'));

    expect(useAccountStorageMutation.write).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: payments.id,
        document: expect.objectContaining({
          id: payments.id,
          hideCurrent: true
        })
      })
    );
    expect(saveActions(container)).toEqual([]);
  });

  test('renames a saved view from Settings', async () => {
    setUrl({ viewId: payments.id });
    const { container } = renderComponent(app());

    await pressHeaderButton('Settings');
    type(container.querySelector('.view-modal input'), 'Payments');
    await clickAsync(modalButton(container, 'Save'));

    expect(lastConfig().headerTitle).toBe('Payments');
    // Only the name changed, so the default wasn't touched.
    expect(useUserStorageMutation.write).not.toHaveBeenCalled();
  });

  test('sets the default from Settings, saying which one it replaces', async () => {
    setPrefs({ defaultViewId: ALL_APM_VIEW_ID });
    setUrl({ viewId: payments.id });
    const { container } = renderComponent(app());

    await pressHeaderButton('Settings');
    expect(
      container.querySelector('.mock-switch__description').textContent
    ).toContain('instead of All APM apps');
    click(container.querySelector('.view-modal__default input'));
    await clickAsync(modalButton(container, 'Save'));

    expect(useUserStorageMutation.write).toHaveBeenCalledWith(
      expect.objectContaining({
        document: expect.objectContaining({ defaultViewId: payments.id })
      })
    );
    expect(useAccountStorageMutation.write).not.toHaveBeenCalled();
    expect(lastToast().description).toBe(
      'The app will open on "Payments team" instead of "All APM apps".'
    );
  });

  test('sets a built-in view as the default from Settings', async () => {
    setUrl({ viewId: ALL_APM_VIEW_ID });
    const { container } = renderComponent(app());

    await pressHeaderButton('Settings');
    expect(container.querySelector('.view-modal .mock-text-field')).toBeNull();
    click(container.querySelector('.view-modal__default input'));
    await clickAsync(modalButton(container, 'Save'));

    expect(useUserStorageMutation.write).toHaveBeenCalledWith(
      expect.objectContaining({
        document: expect.objectContaining({ defaultViewId: ALL_APM_VIEW_ID })
      })
    );
  });

  test('deletes a saved view from Settings, with undo', async () => {
    setUrl({ viewId: payments.id });
    const { container } = renderComponent(app());

    await pressHeaderButton('Settings');
    await clickAsync(modalButton(container, 'Delete view'));

    expect(setNerdletState).toHaveBeenCalledWith({ viewId: null });
    expect(useAccountStorageMutation.remove).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: payments.id, ...VIEWS_STORE })
    );
    const toast = lastToast();
    expect(toast.title).toBe('View deleted');

    useAccountStorageMutation.write.mockClear();
    await act(async () => {
      toast.actions.find(a => a.label === 'Undo').onClick();
    });
    expect(useAccountStorageMutation.write).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: payments.id, ...VIEWS_STORE })
    );
    expect(lastToast().title).toBe('View restored');
  });

  test('favorites the open view from the header', async () => {
    setUrl({ viewId: payments.id });
    renderComponent(app());

    await pressHeaderButton('Favorite');

    expect(useUserStorageMutation.write).toHaveBeenCalledWith(
      expect.objectContaining({
        document: { favoriteViews: { [payments.id]: true } }
      })
    );
    expect(headerButton('Favorited').iconType).toBe(
      'PROFILES__EVENTS__FAVORITE__WEIGHT_BOLD'
    );
  });

  test('shows a toast when a write fails', async () => {
    useUserStorageMutation.write.mockImplementationOnce(async () => ({
      error: new Error('quota')
    }));
    setUrl({ viewId: payments.id });
    renderComponent(app());

    await pressHeaderButton('Favorite');

    expect(lastToast()).toEqual(
      expect.objectContaining({
        title: "Couldn't update your favorites",
        description: 'quota',
        type: Toast.TYPE.CRITICAL
      })
    );
    expect(headerButton('Favorite')).toBeTruthy();
  });
});
