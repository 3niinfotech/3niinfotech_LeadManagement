import { Component } from 'react';
import { FiHome, FiRefreshCw } from 'react-icons/fi';
import Button from '../ui/Button';
import ErrorIllustration from './ErrorIllustration';
import { ROUTES } from '../../config/routes';
import { clearChunkReloadFlag } from '../../utils/lazyImport';

function ErrorFallback({ error, errorInfo, onRetrySoft, onReload }) {
  const isDev = import.meta.env.DEV;
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-page px-4 py-8">
      <div className="w-full max-w-3xl flex flex-col items-center text-center">
        <h1 className="sr-only">Something went wrong</h1>
        <ErrorIllustration className="w-full max-w-[720px] h-auto select-none" />

        <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-6 w-full sm:w-auto">
          <Button icon={FiRefreshCw} onClick={onRetrySoft} className="w-full sm:w-auto min-w-[140px]">
            Try again
          </Button>
          <Button
            variant="outline"
            icon={FiRefreshCw}
            onClick={onReload}
            className="w-full sm:w-auto min-w-[140px]"
          >
            Reload page
          </Button>
          <Button
            variant="outline"
            icon={FiHome}
            onClick={() => { window.location.href = ROUTES.DASHBOARD; }}
            className="w-full sm:w-auto min-w-[140px]"
          >
            Dashboard
          </Button>
        </div>
      </div>

      {isDev && error && (
        <details className="mt-8 w-full max-w-lg rounded-xl border border-border bg-card-bg overflow-hidden" open>
          <summary className="px-4 py-2.5 text-xs font-medium text-danger cursor-pointer select-none">
            Developer details
          </summary>
          <div className="px-4 pb-4 space-y-2 border-t border-border">
            <pre className="text-[11px] text-danger/90 whitespace-pre-wrap break-words font-mono leading-relaxed pt-3">
              {error.toString()}
            </pre>
            {errorInfo?.componentStack && (
              <pre className="text-[10px] text-text-muted whitespace-pre-wrap break-words font-mono max-h-40 overflow-y-auto">
                {errorInfo.componentStack.trim()}
              </pre>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorRef: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorRef: `ERR-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  /** Soft retry — remount children without full browser reload (avoids infinite reload loops). */
  handleRetrySoft = () => {
    clearChunkReloadFlag();
    this.setState({ hasError: false, error: null, errorInfo: null, errorRef: null });
  };

  handleReload = () => {
    clearChunkReloadFlag();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorRef={this.state.errorRef}
          onRetrySoft={this.handleRetrySoft}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}
