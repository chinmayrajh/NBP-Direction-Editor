import React from 'react';
import type { DirectorProject } from '../../../ir/project';
import { GlassPanel } from '../shared/GlassPanel';
import { PromptPreview } from '../output/PromptPreview';
import { SceneOntologyBadge } from '../output/SceneOntologyBadge';
import { ModuleInspector } from '../output/ModuleInspector';
import { ContradictionAlert } from '../output/ContradictionAlert';
import { PipelineVisualizer } from '../output/PipelineVisualizer';
import { ConfidenceDashboard } from '../output/ConfidenceDashboard';
import { StatsBar } from '../output/StatsBar';

type OutputPanelProps = {
  project: DirectorProject | null;
  isCompiling: boolean;
  error: string | null;
};

export function OutputPanel({ project, isCompiling, error }: OutputPanelProps) {
  const modules = project?.aiPipeline?.finalPromptIR?.modules;
  const conflicts = project?.aiPipeline?.constraintIR?.conflictsDetected ?? [];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 60px)',
        overflow: 'hidden',
      }}
    >
      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        {/* Error banner */}
        {error && (
          <div
            role="alert"
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--accent-red)',
              fontSize: 'var(--text-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Pipeline Visualizer */}
        <GlassPanel title="Pipeline">
          <PipelineVisualizer project={project} isCompiling={isCompiling} />
        </GlassPanel>

        {/* Prompt Preview + Ontology Badge */}
        <GlassPanel>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-3)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                fontWeight: 'var(--weight-semibold)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Output Prompt
            </span>
            <SceneOntologyBadge project={project} />
          </div>
          <PromptPreview project={project} />
        </GlassPanel>

        {/* Contradiction alerts */}
        {conflicts.length > 0 && (
          <GlassPanel title="Conflicts Detected">
            <ContradictionAlert conflicts={conflicts} />
          </GlassPanel>
        )}

        {/* Confidence Dashboard */}
        {project?.confidence && (
          <GlassPanel title="Confidence Scores">
            <ConfidenceDashboard confidence={project.confidence} />
          </GlassPanel>
        )}

        {/* Module Inspector */}
        <GlassPanel title="Prompt Modules">
          <ModuleInspector modules={modules} />
        </GlassPanel>
      </div>

      {/* Stats Bar pinned to bottom */}
      <StatsBar project={project} />
    </div>
  );
}
