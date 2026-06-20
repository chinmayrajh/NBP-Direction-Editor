import React from 'react';
import type { FlowMode } from '../../hooks/useDirectorState';

type FlowModeSelectorProps = {
  value: FlowMode;
  onChange: (mode: FlowMode) => void;
};

const MODES: { id: FlowMode; icon: string; title: string; description: string }[] = [
  {
    id: 'create',
    icon: '✨',
    title: 'Create New Photo',
    description: 'Generate a photo from a scene description',
  },
  {
    id: 'edit',
    icon: '✏️',
    title: 'Edit Existing Photo',
    description: 'Modify or enhance a reference photo',
  },
];

export function FlowModeSelector({ value, onChange }: FlowModeSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Workflow Mode"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-2)',
      }}
    >
      {MODES.map((mode) => {
        const selected = value === mode.id;
        return (
          <button
            key={mode.id}
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(mode.id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                onChange(value === 'create' ? 'edit' : 'create');
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
              background: selected
                ? 'rgba(74,125,255,0.08)'
                : 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              transition: 'all var(--duration-fast) var(--ease-default)',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
              ...(selected
                ? {
                    boxShadow:
                      'var(--shadow-glow-blue), inset 0 0 0 1px rgba(74,125,255,0.4)',
                  }
                : {}),
            }}
            onMouseOver={(e) => {
              if (!selected) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'rgba(255,255,255,0.05)';
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  'rgba(255,255,255,0.14)';
              }
            }}
            onMouseOut={(e) => {
              if (!selected) {
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
                color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
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
              {mode.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
