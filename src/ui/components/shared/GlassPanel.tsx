import React from 'react';

type GlassPanelProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  padding?: string;
};

export function GlassPanel({ children, className = '', title, padding }: GlassPanelProps) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-lg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: padding ?? 'var(--space-5)',
        transition: `border-color var(--duration-normal) var(--ease-default)`,
      }}
    >
      {title && (
        <h3
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
