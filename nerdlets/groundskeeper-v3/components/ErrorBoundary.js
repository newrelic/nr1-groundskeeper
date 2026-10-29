import React from 'react';
import PropTypes from 'prop-types';

// A plain React error boundary (this can only be a class component -- there's no
// hook equivalent of getDerivedStateFromError/componentDidCatch). Without this, a
// thrown error anywhere below it (e.g. a bad GraphQL query, an unexpected NR1 SDK
// response shape) unmounts the whole nerdlet and leaves a blank screen with only a
// terse message in the console. This turns that into a labeled console.error with
// the component stack, plus a visible fallback that shows both stacks directly so
// you don't have to go hunting through devtools to find the failing line.
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { error };
  }

  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    // getDerivedStateFromError only receives `error`; componentStack (which
    // component/hook chain was rendering) only shows up here, in errorInfo.
    this.setState({ errorInfo });
    // eslint-disable-next-line no-console
    console.error(
      `[groundskeeper-v3] ${this.props.label || 'Unhandled error'}:`,
      error,
      errorInfo?.componentStack
    );
  }

  render() {
    const { error, errorInfo } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="error-boundary">
        <div className="error-boundary__title">Something went wrong.</div>
        <div className="error-boundary__message">
          {error?.message || String(error)}
        </div>
        {error?.stack ? (
          <>
            {/* error.stack is the JS stack -- which file/line/function actually
                threw (e.g. "at normalizeEntity (entities.js:10:27)"). */}
            <div className="error-boundary__stack-label">Stack trace</div>
            <pre className="error-boundary__stack">{error.stack}</pre>
          </>
        ) : null}
        {errorInfo?.componentStack ? (
          <>
            {/* componentStack is the React tree -- which component was rendering
                when it threw, complementary to the JS stack above. */}
            <div className="error-boundary__stack-label">Component stack</div>
            <pre className="error-boundary__stack">
              {errorInfo.componentStack}
            </pre>
          </>
        ) : null}
        <div className="error-boundary__hint">
          Also logged to the browser console.
        </div>
      </div>
    );
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
  label: PropTypes.string
};

export default ErrorBoundary;
