import React from 'react';

type HeaderProps = {
  isCompiling: boolean;
  isCompleted: boolean;
  compileProgress?: { phase: string; message: string } | null;
};

export function Header({ isCompiling, isCompleted, compileProgress }: HeaderProps) {
  const isAiPhase = compileProgress?.phase === 'planning' ||
    compileProgress?.phase === 'validating' ||
    compileProgress?.phase === 'assembling';

  // Status text
  let statusText: string;
  if (compileProgress && isCompiling) {
    statusText = compileProgress.message;
  } else if (isCompiling) {
    statusText = 'Compiling…';
  } else if (isCompleted) {
    statusText = 'Compiled';
  } else {
    statusText = 'Ready';
  }

  // Status indicator colors
  const dotColor = isCompiling
    ? isAiPhase
      ? 'var(--accent-purple)'
      : 'var(--accent-warm)'
    : isCompleted
      ? 'var(--accent-green)'
      : 'var(--text-muted)';

  const dotGlow = isCompiling
    ? isAiPhase
      ? '0 0 8px rgba(139,92,246,0.5)'
      : '0 0 8px rgba(245,158,11,0.5)'
    : isCompleted
      ? '0 0 8px rgba(16,185,129,0.5)'
      : 'none';

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-4) var(--space-6)',
        borderBottom: '1px solid var(--border-glass)',
        background: 'rgba(255,255,255,0.01)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-bold)',
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            marginBottom: 2,
          }}
        >
          NBP Director
        </h1>
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            fontWeight: 'var(--weight-medium)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          AI Photography Prompt Compiler
        </p>
      </div>

      {/* Status indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-3)',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-glass)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
          fontWeight: 'var(--weight-medium)',
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dotColor,
            boxShadow: dotGlow,
            animation: isCompiling ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
          }}
        />
        {statusText}
      </div>
    </header>
  );
}
