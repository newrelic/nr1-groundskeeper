/* eslint-disable react/prop-types */
import React from 'react';

// Manual mock of the `nr1` SDK for tests.
//
// node_modules/nr1 is always an empty stub (the real SDK is injected by the `nr1`
// CLI's webpack config at build/serve time, not resolved from npm) -- this fills in
// just enough behavior so unit tests can import and exercise our code instead of
// crashing on undefined imports. Jest applies manual mocks under __mocks__/ for
// node_modules packages automatically, with no jest.mock('nr1') call needed; test
// files can still override any export's return value per-test, e.g.:
//   useEntitySearchQuery.mockReturnValue({ data: { entities: [...] } })

// NOT a real GraphQL parser -- just re-flattens the tagged template back into a
// single string so tests can assert on the composed query text.
export const ngql = (strings, ...values) =>
  strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');

export const useEntitySearchQuery = jest.fn(() => ({
  data: { count: 0, entities: [] },
  loading: false,
  error: undefined,
  fetchMore: jest.fn()
}));

export const useNerdGraphQuery = jest.fn(() => ({
  data: undefined,
  loading: false,
  error: undefined
}));

export const AutoSizer = ({ children }) =>
  children({ width: 800, height: 600 });

export const DataTable = ({ children }) => (
  <div className="mock-data-table">{children}</div>
);
DataTable.SELECTION_TYPE = { SINGLE: 'single', MULTIPLE: 'multiple' };

export const DataTableHeader = ({ children }) => <div>{children}</div>;
export const DataTableHeaderCell = ({ children }) => <div>{children}</div>;
export const DataTableBody = ({ children }) => <div>{children}</div>;
export const DataTableRow = ({ children }) => <div>{children}</div>;
// The real DataTableRowCell only accepts a function (it calls this to render) as
// children, not raw content -- mirror that here instead of just displaying it.
export const DataTableRowCell = ({ children }) => (
  <div>{typeof children === 'function' ? children() : children}</div>
);

// Strip nr1-only props before spreading the rest onto a real DOM button, or React
// warns about unrecognized DOM attributes (e.g. `sizeType`).
export const Button = ({ children, sizeType, ...props }) => (
  <button type="button" {...props}>
    {children}
  </button>
);
Button.SIZE_TYPE = { SMALL: 'small', MEDIUM: 'medium', LARGE: 'large' };

export default {};
