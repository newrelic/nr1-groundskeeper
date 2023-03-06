import React from 'react';

export const SELECT_APPS_TEXT =
  'Select all the related applications that require Distributed Tracing';

export const SELECT_DATE_TEXT =
  'Select a date in the last month that reflects the typical traffic pattern and volume for the set of applications';

const DTIEInstructions = () => {
  return (
    <ol>
      <li>{SELECT_APPS_TEXT}</li>
      <li>{SELECT_DATE_TEXT}</li>
      <li>Three estimates are produced for each application selected</li>
    </ol>
  );
};

export default DTIEInstructions;
