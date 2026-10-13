import { Component } from 'react';
import { ErrorState } from './StateViews.jsx';

// Catches render errors in a page so the header and footer stay usable.
// `resetKey` (the pathname) clears the error when the user navigates away.
export class ErrorBoundary extends Component {
  state = { error: null, key: this.props.resetKey };

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container">
          <ErrorState
            title="This page hit a snag"
            error={{ message: 'Something unexpected went wrong. Reloading usually fixes it.' }}
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
