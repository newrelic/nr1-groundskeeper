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

// The real DataTable passes `items` down to its DataTableBody, which calls its
// render-prop child once per item -- mirror that here by cloning DataTableBody
// with `items` injected, since nothing else in this mock threads props through
// plain `children`.
export const DataTable = ({ children, items = [] }) => (
  <div className="mock-data-table">
    {React.Children.map(children, child =>
      child?.type === DataTableBody
        ? React.cloneElement(child, { items })
        : child
    )}
  </div>
);
DataTable.SELECTION_TYPE = { SINGLE: 'single', MULTIPLE: 'multiple' };

export const DataTableToolbar = ({ children }) => <div>{children}</div>;
export const DataTableToolbarContent = ({ title, description, children }) => (
  <div>
    {title ? <span className="mock-toolbar-title">{title}</span> : null}
    {description ? (
      <span className="mock-toolbar-description">{description}</span>
    ) : null}
    {children}
  </div>
);
export const DataTableHeader = ({ children }) => <div>{children}</div>;
export const DataTableHeaderCell = ({ children }) => <div>{children}</div>;
// `children` is the real DataTableBody render-prop function; call it once per item
// (as the real component does) instead of trying to render the function itself.
export const DataTableBody = ({ children, items = [] }) => (
  <div>
    {items.map((item, index) => (
      <React.Fragment key={item.guid || index}>
        {children({ item, index, items })}
      </React.Fragment>
    ))}
  </div>
);
export const DataTableRow = ({ children }) => <div>{children}</div>;
// The real DataTableRowCell only accepts a function (it calls this to render),
// optionally alongside a DataTableAdditionalValueCell element, as children -- not
// raw content. Mirror that here: call any function child, render any element
// child as-is, instead of just displaying whatever was passed.
export const DataTableRowCell = ({ children }) => {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div>
      {items.map((child, index) => (
        <React.Fragment key={index}>
          {typeof child === 'function' ? child() : child}
        </React.Fragment>
      ))}
    </div>
  );
};
// The real DataTableAdditionalValueCell only accepts a function as children, same
// as DataTableRowCell -- used to render a muted secondary line under a cell's main
// value (e.g. an account name under an app name).
export const DataTableAdditionalValueCell = ({ children }) => (
  <div className="mock-additional-value">
    {typeof children === 'function' ? children() : children}
  </div>
);

// Strip nr1-only props before spreading the rest onto a real DOM button, or React
// warns about unrecognized DOM attributes (e.g. `sizeType`). `ariaLabel` is mapped
// to the real `aria-label` DOM attribute, same as the real Button does internally.
export const Button = ({
  children,
  ariaLabel,
  sizeType,
  variant,
  iconType,
  ...props
}) => (
  <button type="button" aria-label={ariaLabel} {...props}>
    {children}
  </button>
);
Button.SIZE_TYPE = { SMALL: 'small', MEDIUM: 'medium', LARGE: 'large' };
Button.VARIANT = { PRIMARY: 'primary', SECONDARY: 'secondary', TERTIARY: 'tertiary' };
Button.ICON_TYPE = { INTERFACE__SIGN__CLOSE: 'INTERFACE__SIGN__CLOSE' };

// The real Badge stringifies its children (an element inside it shows up as
// "[object Object]"), so this does too -- a test then catches anything but a
// plain string being passed.
export const Badge = ({ children, type }) => (
  <span className="mock-badge" data-type={type}>
    {String(children)}
  </span>
);
Badge.TYPE = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  CRITICAL: 'critical',
  SEVERE: 'severe'
};

export const Switch = ({ checked, label, loading, onChange, className }) => (
  <label className={['mock-switch', className].filter(Boolean).join(' ')}>
    <input
      type="checkbox"
      checked={checked}
      disabled={loading}
      onChange={onChange}
    />
    {label}
  </label>
);

export const Icon = ({ type, color, className, ...props }) => (
  <i
    className={['mock-icon', className].filter(Boolean).join(' ')}
    data-type={type}
    style={color ? { color } : undefined}
    {...props}
  />
);
Icon.TYPE = {
  PROFILES__EVENTS__FAVORITE: 'PROFILES__EVENTS__FAVORITE',
  PROFILES__EVENTS__FAVORITE__WEIGHT_BOLD:
    'PROFILES__EVENTS__FAVORITE__WEIGHT_BOLD',
  INTERFACE__OPERATIONS__EXTERNAL_LINK: 'INTERFACE__OPERATIONS__EXTERNAL_LINK',
  INTERFACE__SIGN__CHECKMARK: 'INTERFACE__SIGN__CHECKMARK',
  INTERFACE__STATE__WARNING: 'INTERFACE__STATE__WARNING',
  INTERFACE__OPERATIONS__SHIELD: 'INTERFACE__OPERATIONS__SHIELD',
  INTERFACE__STATE__CRITICAL: 'INTERFACE__STATE__CRITICAL',
  INTERFACE__INFO__HELP: 'INTERFACE__INFO__HELP',
  INTERFACE__STATE__LOADING: 'INTERFACE__STATE__LOADING',
  DATE_AND_TIME__DATE_AND_TIME__TIME: 'DATE_AND_TIME__DATE_AND_TIME__TIME',
  INTERFACE__OPERATIONS__DOWNLOAD: 'INTERFACE__OPERATIONS__DOWNLOAD'
};

// The real Tooltip shows `text` on hover/focus of its children -- render it
// alongside them so tests can assert on it without simulating hover.
export const Tooltip = ({ children, text }) => (
  <span className="mock-tooltip">
    {children}
    <span className="mock-tooltip__text">{text}</span>
  </span>
);
Tooltip.PLACEMENT_TYPE = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right'
};

export default {};
