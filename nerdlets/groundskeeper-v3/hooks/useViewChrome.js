import { useEffect, useRef } from 'react';
import { Icon, navigation, nerdlet } from 'nr1';

import { APP_NAME, NERDLET_ID } from '../constants';

// Views are saved per account, so the platform's account picker chooses whose
// views you're looking at, on every screen.
const BASE_CONFIG = { accountPicker: true, timePicker: false };

// The listing (and "View not found"): just the app's name. setConfig merges, so
// what an open view set is cleared explicitly.
const showListingChrome = () =>
  nerdlet.setConfig({
    ...BASE_CONFIG,
    actionControls: false,
    actionControlButtons: [],
    headerTitle: APP_NAME,
    headerParentTitle: undefined,
    headerParentLocation: undefined
  });

// An open view: its name in the platform header under the app's, which links
// back to the listing, and Favorite and Settings as header buttons. The
// handlers are read through a ref, so the config is only set again when what
// it shows changes.
const useViewChrome = ({
  title,
  isFavorite,
  onToggleFavorite,
  onOpenSettings
}) => {
  const handlers = useRef({});
  handlers.current = { onToggleFavorite, onOpenSettings };

  useEffect(() => {
    nerdlet.setConfig({
      ...BASE_CONFIG,
      actionControls: true,
      actionControlButtons: [
        {
          label: isFavorite ? 'Favorited' : 'Favorite',
          hint: isFavorite ? 'Remove from favorites' : 'Add to favorites',
          iconType: isFavorite
            ? Icon.TYPE.PROFILES__EVENTS__FAVORITE__WEIGHT_BOLD
            : Icon.TYPE.PROFILES__EVENTS__FAVORITE,
          onClick: () => handlers.current.onToggleFavorite()
        },
        {
          label: 'Settings',
          hint: "Change this view's name, description, or make it your default",
          iconType: Icon.TYPE.INTERFACE__OPERATIONS__CONFIGURE,
          onClick: () => handlers.current.onOpenSettings()
        }
      ],
      headerTitle: title || 'Untitled view',
      headerParentTitle: APP_NAME,
      // A location to link to, not a navigation: openNerdlet() would navigate
      // straight away. viewId null (not just absent) also tells index.js the
      // user chose the listing, so the default view isn't opened again.
      headerParentLocation: navigation.getOpenNerdletLocation({
        id: NERDLET_ID,
        urlState: { viewId: null }
      })
    });
  }, [title, isFavorite]);
};

export { showListingChrome };
export default useViewChrome;
