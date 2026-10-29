import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';

// Minimal render helper (no testing-library is installed in this repo). The
// container is attached to document.body -- React 16's event delegation listens at
// the document level, so a detached container would silently swallow simulated
// clicks -- and act() flushes effects before returning, so assertions right after
// render see effect-driven state too.
const renderComponent = element => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    ReactDOM.render(element, container);
  });
  return {
    container,
    rerender: nextElement =>
      act(() => {
        ReactDOM.render(nextElement, container);
      }),
    unmount: () => {
      act(() => ReactDOM.unmountComponentAtNode(container));
      container.remove();
    }
  };
};

export { renderComponent };
