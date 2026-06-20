import React from 'react';
import type { DirectorProject } from '../../../ir/project';

type SceneOntologyBadgeProps = {
  project: DirectorProject | null;
};

const KNOWN_SCENES = [
  'café', 'cafe', 'street', 'studio', 'rooftop', 'garden', 'beach',
  'bedroom', 'kitchen', 'bathroom', 'office', 'bar', 'club', 'park',
  'forest', 'desert', 'mountain', 'alley', 'subway', 'train',
  'airport', 'hotel', 'restaurant', 'balcony', 'parking', 'gym',
];

export function SceneOntologyBadge({ project }: SceneOntologyBadgeProps) {
  if (!project) return null;

  const atmosphere = project.aiPipeline?.photographyPlanIR?.atmosphere?.description ?? '';
  const scene = project.inputs?.coreScene ?? '';
  const combined = `${atmosphere} ${scene}`.toLowerCase();

  const matched = KNOWN_SCENES.find((s) => combined.includes(s));

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-mono)',
        fontWeight: 'var(--weight-medium)',
        ...(matched
          ? {
              background: 'rgba(16,185,129,0.1)',
              color: 'var(--accent-green)',
              border: '1px solid rgba(16,185,129,0.2)',
            }
          : {
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-glass)',
            }),
      }}
    >
      <span style={{ fontSize: '0.625rem' }}>{matched ? '●' : '○'}</span>
      {matched ? `Matched: ${matched}` : 'Custom scene'}
    </span>
  );
}
