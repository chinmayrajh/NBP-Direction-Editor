import React from 'react';
import type { DirectorProject } from '../../../ir/project';

type CompileMode = 'deterministic' | 'ai';

type PipelineVisualizerProps = {
  project: DirectorProject | null;
  isCompiling: boolean;
  compileMode?: CompileMode;
  compileProgress?: { phase: string } | null;
};

const DETERMINISTIC_PASSES = [
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

const AI_PASSES = [
  { name: 'AI Planning', phase: 'planning' },
  { name: 'Validation', phase: 'validating' },
  { name: 'Token Budget', phase: 'budgeting' },
  { name: 'Assembly', phase: 'assembling' },
];

export function PipelineVisualizer({
  project,
  isCompiling,
  compileMode,
  compileProgress,
}: PipelineVisualizerProps) {
  const isCompleted = project?.generationState?.status === 'completed';
  const hasError = project?.generationState?.status === 'error';
  const isAi = compileMode === 'ai';

  if (isAi) {
    return (
      <div
        role="list"
        aria-label="AI pipeline passes"
        style={{
          display: 'flex',
          gap: 'var(--space-1)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {AI_PASSES.map((pass, i) => {
          let icon: string;
          let color: string;
          let bgColor: string;
          let borderColor = 'var(--border-glass)';

          const currentPhase = compileProgress?.phase;
          const passIndex = AI_PASSES.findIndex((p) => p.phase === currentPhase);
          const isCurrentPass = isCompiling && currentPhase === pass.phase;
          const isPastPass = isCompiling && passIndex >= 0 && i < passIndex;

          if (isCurrentPass) {
            icon = '◌';
            color = 'var(--accent-purple)';
            bgColor = 'rgba(139,92,246,0.12)';
            borderColor = 'rgba(139,92,246,0.3)';
          } else if (isPastPass) {
            icon = '✓';
            color = 'var(--accent-green)';
            bgColor = 'rgba(16,185,129,0.08)';
          } else if (isCompiling) {
            icon = '○';
            color = 'var(--text-muted)';
            bgColor = 'rgba(255,255,255,0.02)';
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
              key={pass.name}
              role="listitem"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                background: bgColor,
                border: `1px solid ${borderColor}`,
                fontSize: 'var(--text-xs)',
                color: color,
                fontWeight: 'var(--weight-medium)',
                whiteSpace: 'nowrap',
                transition: `all var(--duration-fast) var(--ease-default)`,
                ...(isCurrentPass
                  ? { animation: 'pulse-glow 1.5s ease-in-out infinite' }
                  : {}),
              }}
            >
              <span style={{ fontSize: '0.625rem' }}>{icon}</span>
              {pass.name}
            </div>
          );
        })}
      </div>
    );
  }

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
      {DETERMINISTIC_PASSES.map((name, i) => {
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
