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
        boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.15)',
        transition: `border-color var(--duration-normal) var(--ease-default), box-shadow var(--duration-normal) var(--ease-default)`,
      }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(140, 160, 255, 0.12)';
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-glass)';
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
