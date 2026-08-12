import { Component } from 'react';
import { FiHome, FiRefreshCw } from 'react-icons/fi';
import Button from '../ui/Button';
import ErrorIllustration from './ErrorIllustration';
import { ROUTES } from '../../config/routes';

function ErrorFallback({ error, errorInfo, onRetry, errorRef }) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-page px-6 py-12">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        <ErrorIllustration className="w-full max-w-[280px] h-auto mb-6 select-none" />

        <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
          Aaaah! Something went wrong
        </h1>

        <p className="mt-3 text-[15px] text-slate-600 leading-relaxed max-w-sm">
          Brace yourself till we get the error fixed.
        </p>
        <p className="mt-1 text-[14px] text-slate-500 leading-relaxed max-w-sm">
          You may also refresh the page or try again later.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-8 w-full sm:w-auto">
          <Button icon={FiRefreshCw} onClick={onRetry} className="w-full sm:w-auto min-w-[140px]">
            Refresh Page
          </Button>
          <Button
            variant="outline"
            icon={FiHome}
            onClick={() => { window.location.href = ROUTES.DASHBOARD; }}
            className="w-full sm:w-auto min-w-[140px]"
          >
            Go to Dashboard
          </Button>
        </div>

        {errorRef && (
          <p className="mt-6 text-[11px] font-mono text-slate-400 tabular-nums">
            Ref: {errorRef}
          </p>
        )}
      </div>

      {isDev && error && (
        <details className="mt-8 w-full max-w-lg rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
          <summary className="px-4 py-2.5 text-xs font-medium text-red-600 cursor-pointer select-none">
            Developer details
          </summary>
          <div className="px-4 pb-4 space-y-2 border-t border-slate-200 bg-white">
            <pre className="text-[11px] text-red-600/90 whitespace-pre-wrap break-words font-mono leading-relaxed pt-3">
              {error.toString()}
            </pre>
            {errorInfo?.componentStack && (
              <pre className="text-[10px] text-slate-500 whitespace-pre-wrap break-words font-mono max-h-40 scroll-area overflow-y-auto">
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

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorRef: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorRef={this.state.errorRef}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
