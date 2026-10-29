import React from 'react';
import PropTypes from 'prop-types';
import { EmptyState } from 'nr1';

// A viewId in the URL that isn't a built-in view or one of this account's saved
// views: an old link, a deleted view, or a view saved in another account.
const ViewNotFound = ({ onBack }) => (
  <EmptyState
    fullHeight
    fullWidth
    type={EmptyState.TYPE.ERROR}
    title="View not found"
    description="This view doesn't exist, or it was saved in a different account."
    action={{ label: 'Back to views', onClick: onBack }}
  />
);

ViewNotFound.propTypes = {
  onBack: PropTypes.func
};

export default ViewNotFound;
