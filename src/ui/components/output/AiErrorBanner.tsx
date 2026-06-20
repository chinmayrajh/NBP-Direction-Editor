import React from 'react';

type AiErrorBannerProps = {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
};

function getFriendlyMessage(error: string): { message: string; icon: string } | null {
  if (error === 'MISSING_API_KEY') {
    return {
      message: 'Add a Gemini API key in settings to use AI mode.',
      icon: '🔑',
    };
  }
  if (error === 'ABORTED') {
    return null;
  }
  if (error.startsWith('AI_')) {
    return {
      message: 'AI returned unexpected output. Using fast compile.',
      icon: '🔄',
    };
  }
  if (error.toLowerCase().includes('rate') || error.includes('429')) {
    return {
      message: 'Rate limit reached. Try again shortly.',
      icon: '⏳',
    };
  }
  return {
    message: 'Network error — couldn\u2019t reach the AI service. Fell back to fast compile.',
    icon: '📡',
  };
}

export function AiErrorBanner({ error, onRetry, onDismiss }: AiErrorBannerProps) {
  if (!error) return null;

  const friendly = getFriendlyMessage(error);
  if (!friendly) return null;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.2)',
        fontSize: 'var(--text-sm)',
        color: 'var(--accent-warm)',
        animation: 'fade-in var(--duration-fast) var(--ease-default)',
      }}
    >
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{friendly.icon}</span>
      <span style={{ flex: 1, lineHeight: 'var(--leading-tight)' }}>
        {friendly.message}
      </span>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: 'var(--space-1) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(245,158,11,0.3)',
              background: 'rgba(245,158,11,0.1)',
              color: 'var(--accent-warm)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all var(--duration-fast) var(--ease-default)',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'rgba(245,158,11,0.18)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'rgba(245,158,11,0.1)';
            }}
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            style={{
              padding: 'var(--space-1) var(--space-2)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid transparent',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all var(--duration-fast) var(--ease-default)',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                'var(--text-secondary)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                'var(--text-muted)';
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
