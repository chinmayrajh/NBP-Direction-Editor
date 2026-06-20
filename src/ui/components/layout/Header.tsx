import React from 'react';

type HeaderProps = {
  isCompiling: boolean;
  isCompleted: boolean;
};

export function Header({ isCompiling, isCompleted }: HeaderProps) {
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
            background: isCompiling
              ? 'var(--accent-warm)'
              : isCompleted
                ? 'var(--accent-green)'
                : 'var(--text-muted)',
            boxShadow: isCompiling
              ? '0 0 8px rgba(245,158,11,0.5)'
              : isCompleted
                ? '0 0 8px rgba(16,185,129,0.5)'
                : 'none',
            animation: isCompiling ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
          }}
        />
        {isCompiling ? 'Compiling…' : isCompleted ? 'Compiled' : 'Ready'}
      </div>
    </header>
  );
}
