import React from 'react';
import type { DirectorProject } from '../../../ir/project';

type StatsBarProps = {
  project: DirectorProject | null;
};

export function StatsBar({ project }: StatsBarProps) {
  const prompt = project?.aiPipeline?.finalPromptIR;
  const elapsed = project?.generationState?.elapsedMs;

  const stats = [
    {
      label: 'Tokens',
      value: prompt?.tokenCount?.toString() ?? '—',
      icon: '🔢',
    },
    {
      label: 'Compressed',
      value: prompt?.compressionApplied ? 'Yes' : 'No',
      icon: '📦',
    },
    {
      label: 'Dropped',
      value: prompt?.droppedTokens?.length?.toString() ?? '0',
      icon: '🗑️',
    },
    {
      label: 'Duration',
      value: elapsed != null ? `${elapsed}ms` : '—',
      icon: '⏱️',
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-6)',
        padding: 'var(--space-3) var(--space-5)',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-glass)',
        fontSize: 'var(--text-xs)',
        flexWrap: 'wrap',
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
          }}
        >
          <span style={{ fontSize: '0.7rem' }}>{stat.icon}</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 'var(--weight-medium)' }}>
            {stat.label}:
          </span>
          <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
