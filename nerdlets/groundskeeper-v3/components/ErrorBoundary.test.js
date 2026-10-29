import React from 'react';

import ErrorBoundary from './ErrorBoundary';
import { renderComponent } from './testUtils';

const Boom = () => {
  throw new Error('kaboom');
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // React also logs its own "above error occurred in <Boom>" message on catch;
    // silence + inspect everything so that noise doesn't clutter test output.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('renders children normally when nothing throws', () => {
    const { container } = renderComponent(
      <ErrorBoundary>
        <div className="ok">fine</div>
      </ErrorBoundary>
    );

    expect(container.querySelector('.ok').textContent).toBe('fine');
    expect(container.querySelector('.error-boundary')).toBeNull();
  });

  test('renders a fallback instead of unmounting the whole tree when a child throws', () => {
    const { container } = renderComponent(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(container.querySelector('.error-boundary')).not.toBeNull();
    expect(
      container.querySelector('.error-boundary__message').textContent
    ).toBe('kaboom');
  });

  test('shows both the JS stack trace and the React component stack', () => {
    const { container } = renderComponent(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    const stacks = Array.from(
      container.querySelectorAll('.error-boundary__stack')
    ).map(el => el.textContent);

    // error.stack always starts with "<Name>: <message>", then file/line frames.
    expect(stacks.some(s => s.startsWith('Error: kaboom'))).toBe(true);
    // componentStack names the component that was rendering when it threw.
    expect(stacks.some(s => s.includes('Boom'))).toBe(true);
  });

  test('logs the error and component stack to the console, prefixed with the label', () => {
    renderComponent(
      <ErrorBoundary label="Agent Groundskeeper v3">
        <Boom />
      </ErrorBoundary>
    );

    const loggedOurMessage = consoleErrorSpy.mock.calls.some(
      call =>
        typeof call[0] === 'string' &&
        call[0].includes('[groundskeeper-v3] Agent Groundskeeper v3:') &&
        call[1] instanceof Error &&
        call[1].message === 'kaboom'
    );
    expect(loggedOurMessage).toBe(true);
  });

  test('falls back to a generic label when none is given', () => {
    renderComponent(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    const loggedGenericLabel = consoleErrorSpy.mock.calls.some(
      call =>
        typeof call[0] === 'string' &&
        call[0].includes('[groundskeeper-v3] Unhandled error:')
    );
    expect(loggedGenericLabel).toBe(true);
  });
});
