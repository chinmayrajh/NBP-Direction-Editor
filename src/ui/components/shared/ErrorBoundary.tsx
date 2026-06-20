import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[NBP Director] ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 'var(--space-8)',
            background: 'var(--bg-primary)',
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-8)',
              maxWidth: 480,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 0 40px rgba(239, 68, 68, 0.1)',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>💥</div>
            <h2
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--accent-red)',
                marginBottom: 'var(--space-3)',
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-6)',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(255,255,255,0.03)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error?.message ?? 'Unknown error'}
            </p>
            <button
              onClick={this.handleReset}
              style={{
                padding: 'var(--space-3) var(--space-6)',
                background: 'var(--accent-gradient)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: `opacity var(--duration-fast) var(--ease-default)`,
              }}
              onMouseOver={(e) => ((e.target as HTMLButtonElement).style.opacity = '0.85')}
              onMouseOut={(e) => ((e.target as HTMLButtonElement).style.opacity = '1')}
            >
              Reset Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
