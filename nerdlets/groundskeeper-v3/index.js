import React, { useCallback, useContext, useEffect, useRef } from 'react';

import {
  EmptyState,
  PlatformStateContext,
  Toast,
  useNerdletState,
  useUserQuery
} from 'nr1';

import {
  ErrorBoundary,
  ViewNotFound,
  ViewScreen,
  ViewsList
} from './components';
import { showListingChrome, useUserPrefs, useViews } from './hooks';
import { findView, userStamp } from './utils';

const quoted = view => `"${view?.title || 'Untitled view'}"`;

const showError = (title, error, retry) =>
  Toast.showToast({
    title,
    description: error?.message || 'Please try again.',
    actions: retry ? [{ label: 'Retry', onClick: retry }] : undefined,
    type: Toast.TYPE.CRITICAL
  });

// Everything with real logic lives in this inner component (not the default export
// below) so that ErrorBoundary -- which can only catch errors thrown by its children,
// not by itself -- actually sits *above* the hooks that can throw (e.g. a bad
// GraphQL/NRQL response) instead of alongside them.
//
// This part decides what's on screen: `viewId` in the nerdlet's URL state picks
// a view, and without one it's the listing. It also owns everything that isn't
// about one view's table: the account's saved views, the user's favorites and
// default view, and the toasts for writes.
const GroundskeeperV3Content = () => {
  const [nerdletState, setNerdletState] = useNerdletState();
  const viewId = nerdletState?.viewId || null;
  // null, not just missing, when the user went back to the listing (see
  // hooks/useViewChrome.js), even from a fresh load of that link.
  const choseListing = nerdletState?.viewId === null;
  const { accountId } = useContext(PlatformStateContext);
  const { data: user } = useUserQuery();

  const {
    views,
    loading: viewsLoading,
    error: viewsError,
    createView,
    updateView,
    deleteView,
    restoreView
  } = useViews(accountId);
  const {
    favorites,
    defaultViewId,
    loading: prefsLoading,
    toggleFavorite,
    setDefaultViewId
  } = useUserPrefs();

  const openView = useCallback(id => setNerdletState({ viewId: id }), [
    setNerdletState
  ]);
  const backToList = useCallback(() => setNerdletState({ viewId: null }), [
    setNerdletState
  ]);

  // Once per mount, when the URL doesn't name a view and the user hasn't just
  // chosen the listing: open the user's default. The default is a per-user
  // preference while saved views are per account, so it's only used if it
  // exists here -- otherwise the listing, not a "View not found" page. Later
  // trips back to the listing don't redirect again.
  const appliedDefault = useRef(false);
  useEffect(() => {
    if (appliedDefault.current || prefsLoading) return;
    const defaultView = findView(views, defaultViewId);
    // A saved default may just not have loaded yet.
    if (defaultViewId && !defaultView && viewsLoading) return;
    appliedDefault.current = true;
    if (!viewId && !choseListing && defaultView) openView(defaultView.id);
  }, [
    prefsLoading,
    viewsLoading,
    views,
    defaultViewId,
    viewId,
    choseListing,
    openView
  ]);

  // A saved view belongs to one account, so if the account picker changes while
  // one is open, go back to that account's listing instead of "View not found".
  // Built-in views exist everywhere and stay open. (The first run, with no
  // previous account, isn't a switch.)
  const prevAccountId = useRef(accountId);
  const openViewRef = useRef(null);
  openViewRef.current = findView(views, viewId);
  useEffect(() => {
    const prev = prevAccountId.current;
    prevAccountId.current = accountId;
    if (prev !== accountId && viewId && !openViewRef.current?.builtIn) {
      backToList();
    }
  }, [accountId, viewId, backToList]);

  // `makeDefault` false clears the default (if it's this view).
  const setDefault = useCallback(
    async (view, makeDefault) => {
      const replacing =
        defaultViewId && defaultViewId !== view.id
          ? findView(views, defaultViewId)
          : null;
      const { error } = await setDefaultViewId(makeDefault ? view.id : null);
      if (error) {
        showError("Couldn't update your default view", error);
        return { error };
      }
      let description = 'The app will open on the views listing.';
      if (makeDefault) {
        description = replacing
          ? `The app will open on ${quoted(view)} instead of ${quoted(
              replacing
            )}.`
          : `The app will open on ${quoted(view)}.`;
      }
      Toast.showToast({
        title: makeDefault ? 'Default view set' : 'Default view removed',
        description,
        type: Toast.TYPE.NORMAL
      });
      return {};
    },
    [defaultViewId, views, setDefaultViewId]
  );

  const toggleFavoriteWithToast = useCallback(
    async id => {
      const { error } = await toggleFavorite(id);
      if (error) showError("Couldn't update your favorites", error);
    },
    [toggleFavorite]
  );

  // `fields` is everything a view saves, from the open view it was saved from
  // (see ViewScreen's Save as new view).
  const createAndOpen = useCallback(
    async (fields, { makeDefault = false } = {}) => {
      const { view, error } = await createView({
        ...fields,
        createdBy: userStamp(user)
      });
      if (error) return { error };
      openView(view.id);
      Toast.showToast({
        title: 'View saved',
        description: `${quoted(view)} is shared with everyone in this account.`,
        type: Toast.TYPE.NORMAL
      });
      // The view is saved either way; setDefault says if this part failed.
      if (makeDefault) await setDefault(view, true);
      return {};
    },
    [createView, user, openView, setDefault]
  );

  const saveView = useCallback(
    async (view, settings) => {
      const { error } = await updateView(view, settings);
      if (error) showError("Couldn't save the view", error);
      return { error };
    },
    [updateView]
  );

  const editView = useCallback((view, meta) => updateView(view, meta), [
    updateView
  ]);

  // Refs, so a toast's Undo or Retry calls the current handler without the
  // two callbacks below depending on each other.
  const deleteRef = useRef(null);
  const restoreRef = useRef(null);

  const restore = useCallback(
    async view => {
      const { error } = await restoreView(view);
      if (error) {
        showError("Couldn't restore the view", error, () =>
          restoreRef.current(view)
        );
        return;
      }
      Toast.showToast({
        title: 'View restored',
        description: `${quoted(view)} is back.`,
        type: Toast.TYPE.NORMAL
      });
    },
    [restoreView]
  );
  restoreRef.current = restore;

  // Back to the listing first, so the deleted view never shows as "not found".
  const remove = useCallback(
    async view => {
      backToList();
      const { error } = await deleteView(view, userStamp(user));
      if (error) {
        showError("Couldn't delete the view", error, () =>
          deleteRef.current(view)
        );
        return;
      }
      Toast.showToast({
        title: 'View deleted',
        description: `${quoted(view)} was deleted.`,
        actions: [{ label: 'Undo', onClick: () => restoreRef.current(view) }],
        type: Toast.TYPE.NORMAL
      });
    },
    [backToList, deleteView, user]
  );
  deleteRef.current = remove;

  const view = findView(views, viewId);
  const defaultView = findView(views, defaultViewId);

  // An open view sets the platform header itself (ViewScreen's useViewChrome);
  // everything else -- the listing, loading, "View not found" -- gets the app's.
  // A child's effects run first, so this doesn't undo a view's header.
  const hasOpenView = Boolean(view);
  useEffect(() => {
    if (!hasOpenView) showListingChrome();
  }, [hasOpenView]);

  if (!viewId) {
    return (
      <div className="groundskeeper-v3">
        <ViewsList
          views={views}
          loading={viewsLoading}
          error={viewsError}
          favorites={favorites}
          defaultViewId={defaultViewId}
          onOpenView={openView}
          onToggleFavorite={toggleFavoriteWithToast}
          onSetDefault={id => setDefault(findView(views, id), true)}
        />
      </div>
    );
  }

  if (!view) {
    return viewsLoading ? (
      <EmptyState fullHeight fullWidth type={EmptyState.TYPE.LOADING} />
    ) : (
      <ViewNotFound onBack={backToList} />
    );
  }

  return (
    <ViewScreen
      key={view.id}
      view={view}
      isFavorite={Boolean(favorites[view.id])}
      isDefault={defaultViewId === view.id}
      otherDefaultTitle={
        defaultView && defaultView.id !== view.id ? defaultView.title : null
      }
      onToggleFavorite={() => toggleFavoriteWithToast(view.id)}
      onSetDefault={setDefault}
      onSaveView={saveView}
      onCreateView={createAndOpen}
      onEditView={editView}
      onDeleteView={remove}
    />
  );
};

const GroundskeeperV3Nerdlet = () => (
  <ErrorBoundary label="Agent Groundskeeper v3">
    <GroundskeeperV3Content />
  </ErrorBoundary>
);

export default GroundskeeperV3Nerdlet;
