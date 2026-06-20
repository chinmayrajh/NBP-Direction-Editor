import React from 'react';

type CompileMode = 'deterministic' | 'ai';

type CompileModeToggleProps = {
  value: CompileMode;
  onChange: (mode: CompileMode) => void;
  disabled?: boolean;
};

const MODES: { id: CompileMode; icon: string; title: string; description: string }[] = [
  {
    id: 'deterministic',
    icon: '⚡',
    title: 'Fast',
    description: 'Instant deterministic compile',
  },
  {
    id: 'ai',
    icon: '🧠',
    title: 'AI-Guided',
    description: 'Built-in AI · local · ~1-3s',
  },
];

export function CompileModeToggle({ value, onChange, disabled }: CompileModeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Compile Mode"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-2)',
      }}
    >
      {MODES.map((mode) => {
        const selected = value === mode.id;
        const isDisabled = mode.id === 'ai' && disabled;
        return (
          <button
            key={mode.id}
            role="radio"
            aria-checked={selected}
            aria-disabled={isDisabled || undefined}
            title={isDisabled ? 'Add a Gemini API key in settings to enable AI mode' : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              if (!isDisabled) onChange(mode.id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const target = value === 'deterministic' ? 'ai' : 'deterministic';
                if (target === 'ai' && disabled) return;
                onChange(target);
              }
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-4) var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              border: selected
                ? '1px solid transparent'
                : '1px solid var(--border-glass)',
              background: isDisabled
                ? 'rgba(255,255,255,0.01)'
                : selected
                  ? mode.id === 'ai'
                    ? 'rgba(139,92,246,0.08)'
                    : 'rgba(74,125,255,0.08)'
                  : 'rgba(255,255,255,0.02)',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              transition: 'all var(--duration-fast) var(--ease-default)',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
              opacity: isDisabled ? 0.4 : 1,
              ...(selected
                ? {
                    boxShadow:
                      mode.id === 'ai'
                        ? 'var(--shadow-glow-purple), inset 0 0 0 1px rgba(139,92,246,0.4)'
                        : 'var(--shadow-glow-blue), inset 0 0 0 1px rgba(74,125,255,0.4)',
                  }
                : {}),
            }}
            onMouseOver={(e) => {
              if (!selected && !isDisabled) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'rgba(255,255,255,0.05)';
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  'rgba(255,255,255,0.14)';
              }
            }}
            onMouseOut={(e) => {
              if (!selected && !isDisabled) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'rgba(255,255,255,0.02)';
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  'var(--border-glass)';
              }
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{mode.icon}</span>
            <span
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-bold)',
                color: isDisabled
                  ? 'var(--text-muted)'
                  : selected
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                letterSpacing: '-0.01em',
              }}
            >
              {mode.title}
            </span>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                textAlign: 'center',
                lineHeight: 'var(--leading-tight)',
              }}
            >
              {isDisabled ? 'AI not available' : mode.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
