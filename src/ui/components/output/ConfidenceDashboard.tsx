import React from 'react';
import type { CompilerConfidence } from '../../../ir/types';

type ConfidenceDashboardProps = {
  confidence: CompilerConfidence | undefined;
};

const AXES: { key: keyof CompilerConfidence; label: string }[] = [
  { key: 'identity', label: 'Identity' },
  { key: 'realism', label: 'Realism' },
  { key: 'composition', label: 'Composition' },
  { key: 'controllability', label: 'Controllability' },
];

function getColor(value: number): string {
  if (value >= 0.8) return 'var(--accent-green)';
  if (value >= 0.5) return 'var(--accent-warm)';
  return 'var(--accent-red)';
}

export function ConfidenceDashboard({ confidence }: ConfidenceDashboardProps) {
  if (!confidence) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {AXES.map(({ key, label }) => {
        const value = confidence[key];
        const isNA = value === 0;
        const color = isNA ? 'var(--text-muted)' : getColor(value);
        const pct = Math.round(value * 100);

        return (
          <div key={key}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-1)',
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 'var(--weight-medium)' }}>
                {label}
              </span>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  color,
                  fontWeight: 'var(--weight-semibold)',
                }}
              >
                {isNA ? 'N/A' : value.toFixed(2)}
              </span>
            </div>
            <div
              role="meter"
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={1}
              aria-label={`${label} confidence`}
              style={{
                height: 5,
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255,255,255,0.06)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  borderRadius: 'var(--radius-full)',
                  background: color,
                  transition: `width var(--duration-normal) var(--ease-out)`,
                  boxShadow: `0 0 8px ${color}40`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
