import React from 'react';
import type { DirectorProject } from '../../../ir/project';

type PipelineVisualizerProps = {
  project: DirectorProject | null;
  isCompiling: boolean;
};

const PASSES = [
  'Normalize',
  'Constraints',
  'Identity',
  'Photography',
  'Realism',
  'Composition',
  'Guardrails',
  'Budget',
  'Critique',
];

export function PipelineVisualizer({ project, isCompiling }: PipelineVisualizerProps) {
  const isCompleted = project?.generationState?.status === 'completed';
  const hasError = project?.generationState?.status === 'error';

  return (
    <div
      role="list"
      aria-label="Pipeline passes"
      style={{
        display: 'flex',
        gap: 'var(--space-1)',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {PASSES.map((name, i) => {
        let icon: string;
        let color: string;
        let bgColor: string;

        if (isCompiling) {
          icon = '◌';
          color = 'var(--accent-warm)';
          bgColor = 'rgba(245,158,11,0.08)';
        } else if (isCompleted) {
          icon = '✓';
          color = 'var(--accent-green)';
          bgColor = 'rgba(16,185,129,0.08)';
        } else if (hasError) {
          icon = i === 0 ? '✗' : '○';
          color = i === 0 ? 'var(--accent-red)' : 'var(--text-muted)';
          bgColor = i === 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)';
        } else {
          icon = '○';
          color = 'var(--text-muted)';
          bgColor = 'rgba(255,255,255,0.02)';
        }

        return (
          <div
            key={name}
            role="listitem"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              background: bgColor,
              border: '1px solid var(--border-glass)',
              fontSize: 'var(--text-xs)',
              color: color,
              fontWeight: 'var(--weight-medium)',
              whiteSpace: 'nowrap',
              transition: `all var(--duration-fast) var(--ease-default)`,
            }}
          >
            <span style={{ fontSize: '0.625rem' }}>{icon}</span>
            {name}
          </div>
        );
      })}
    </div>
  );
}
