import { useContext, useEffect, useState } from 'react';

import {
  navigation,
  NerdletStateContext,
  useUserStorageQuery,
  useUserStorageMutation
} from 'nr1';

const userStorageLoc = {
  collection: 'agent-groundskeeper',
  documentId: 'user-pref'
};

const DEFAULT_NERDLET_ID = 'groundskeeper-nerdlet';

const GroundskeeperRouter = () => {
  const nerdletState = useContext(NerdletStateContext);
  const [skipQuerying, setSkipQuerying] = useState(true);
  const {
    data: queryData,
    error: queryError,
    loading: queryLoading
  } = useUserStorageQuery({
    ...userStorageLoc,
    skip: skipQuerying
  });
  const [
    mutateUserStorage,
    { data: mutationData, error: mutationError }
  ] = useUserStorageMutation({
    actionType: useUserStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
    ...userStorageLoc
  });

  useEffect(() => {
    const { toNerdletId } = nerdletState || {};
    if (toNerdletId) {
      saveDefaultNerdletId(toNerdletId);
    } else {
      setSkipQuerying(false);
    }
  }, [nerdletState]);

  useEffect(() => {
    if (!queryError) return;
    console.error('Error reading user preference', queryError); // eslint-disable-line no-console
  }, [queryError]);

  useEffect(() => {
    if (!skipQuerying && !queryLoading) {
      if (queryData?.defaultNerdletId) {
        redirectTo(queryData.defaultNerdletId);
      } else {
        saveDefaultNerdletId();
      }
    }
  }, [queryLoading]);

  useEffect(() => {
    if (!mutationData || !Object.keys(mutationData).length) return;
    const {
      nerdStorageWriteDocument: { defaultNerdletId } = {}
    } = mutationData;
    redirectTo(defaultNerdletId);
  }, [mutationData]);

  useEffect(() => {
    if (!mutationError) return;
    console.error('Error saving user preference', mutationError); // eslint-disable-line no-console
  }, [mutationError]);

  const saveDefaultNerdletId = nerdletId => {
    const defaultNerdletId = nerdletId || DEFAULT_NERDLET_ID;
    mutateUserStorage({ document: { defaultNerdletId } });
  };

  const redirectTo = id => (id ? navigation.replaceNerdlet({ id }) : null);

  return null;
};

export default GroundskeeperRouter;
