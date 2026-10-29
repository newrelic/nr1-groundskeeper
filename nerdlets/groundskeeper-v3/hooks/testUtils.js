import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';

// No hooks-testing library is installed in this repo, so this is a minimal
// hand-rolled stand-in for @testing-library/react-hooks's renderHook/rerender,
// built directly on ReactDOM.render + act (act flushes effects before returning,
// so assertions right after render/rerender see effect-driven state too).
const renderHook = (callback, initialProps) => {
  const result = {};
  const container = document.createElement('div');
  const Harness = ({ hookProps }) => {
    result.current = callback(hookProps);
    return null;
  };
  act(() => {
    ReactDOM.render(<Harness hookProps={initialProps} />, container);
  });
  return {
    result,
    rerender: hookProps =>
      act(() => {
        ReactDOM.render(<Harness hookProps={hookProps} />, container);
      }),
    // A block body: act() warns if its callback returns anything but undefined
    // or a promise, and unmountComponentAtNode returns a boolean.
    unmount: () =>
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      })
  };
};

export { renderHook };
