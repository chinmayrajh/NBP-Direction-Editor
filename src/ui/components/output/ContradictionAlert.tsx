import React from 'react';
import type { ConflictDetection } from '../../../ir/types';

type ContradictionAlertProps = {
  conflicts: ConflictDetection[];
};

export function ContradictionAlert({ conflicts }: ContradictionAlertProps) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
      }}
    >
      {conflicts.map((conflict) => (
        <div
          key={conflict.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <span style={{ fontSize: 'var(--text-lg)', flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-1)',
              }}
            >
              {conflict.description}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--accent-warm)',
                  background: 'rgba(245,158,11,0.1)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {conflict.severity}
              </span>
              {conflict.elements.map((el, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {el}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
