import { Component, useCallback, useMemo, useState } from 'react';
import { FiCheck, FiCopy, FiHome, FiRefreshCw } from 'react-icons/fi';
import Button from '../ui/Button';
import ErrorIllustration from './ErrorIllustration';
import { ROUTES } from '../../config/routes';
import { clearChunkReloadFlag } from '../../utils/lazyImport';
import toastService from '../../services/toast/toast.service';
import './error-boundary.theme.css';

function buildErrorReport({ error, errorInfo, errorRef }) {
  const lines = [
    `Error ID: ${errorRef || 'UNKNOWN'}`,
    `Time: ${new Date().toISOString()}`,
    `URL: ${typeof window !== 'undefined' ? window.location.href : ''}`,
    `User agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : ''}`,
    '',
    '--- Error ---',
    error?.toString?.() || String(error || 'Unknown error'),
    '',
  ];
  if (error?.stack) {
    lines.push('--- Stack ---', error.stack, '');
  }
  if (errorInfo?.componentStack) {
    lines.push('--- Component stack ---', errorInfo.componentStack.trim());
  }
  return lines.join('\n');
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.left = '-9999px';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  document.body.removeChild(area);
}

function ErrorFallback({ error, errorInfo, errorRef, onRetrySoft, onReload }) {
  const isDev = import.meta.env.DEV;
  const [copied, setCopied] = useState(false);

  const report = useMemo(
    () => buildErrorReport({ error, errorInfo, errorRef }),
    [error, errorInfo, errorRef],
  );

  const handleCopy = useCallback(async () => {
    try {
      await copyText(report);
      setCopied(true);
      toastService.success('Error details copied');
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toastService.error('Could not copy — select text manually');
    }
  }, [report]);

  const showDevPanel = Boolean(error) && (isDev || errorRef);

  return (
    <div className="crm-error-page">
      <div className="crm-error-page__wrap">
        <div className="crm-error-page__card">
          <ErrorIllustration className="crm-error-page__illus" />

          <h1 className="crm-error-page__title">Something went wrong</h1>
          <p className="crm-error-page__subtitle">
            An unexpected error stopped this page. Try again, reload, or return to the dashboard.
            {isDev ? ' Developer details are below — copy and share them when reporting a bug.' : ''}
          </p>

          {errorRef && (
            <span className="crm-error-page__ref" title="Reference for support">
              {errorRef}
            </span>
          )}

          <div className="crm-error-page__actions">
            <Button icon={FiRefreshCw} onClick={onRetrySoft}>
              Try again
            </Button>
            <Button variant="outline" icon={FiRefreshCw} onClick={onReload}>
              Reload page
            </Button>
            <Button
              variant="outline"
              icon={FiHome}
              onClick={() => { window.location.href = ROUTES.DASHBOARD; }}
            >
              Dashboard
            </Button>
          </div>
        </div>

        {showDevPanel && (
          <section className="crm-error-dev" aria-label="Developer error details">
            <div className="crm-error-dev__head">
              <h2 className="crm-error-dev__title">Developer details</h2>
              <button
                type="button"
                className={`crm-error-dev__copy${copied ? ' crm-error-dev__copy--done' : ''}`}
                onClick={handleCopy}
              >
                {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
                {copied ? 'Copied' : 'Copy error'}
              </button>
            </div>
            <div className="crm-error-dev__body">
              <pre className="crm-error-dev__message">{error.toString()}</pre>
              {(error.stack || errorInfo?.componentStack) && (
                <pre className="crm-error-dev__stack">
                  {[error.stack, errorInfo?.componentStack?.trim()].filter(Boolean).join('\n\n')}
                </pre>
              )}
            </div>
          </section>
        )}
      </div>
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
