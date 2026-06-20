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
import { AiReasoningPanel } from '../output/AiReasoningPanel';
import { AiErrorBanner } from '../output/AiErrorBanner';

type CompileMode = 'deterministic' | 'ai';

type OutputPanelProps = {
  project: DirectorProject | null;
  isCompiling: boolean;
  error: string | null;
  aiError?: string | null;
  onRetryAi?: () => void;
  compileMode?: CompileMode;
};

export function OutputPanel({
  project,
  isCompiling,
  error,
  aiError,
  onRetryAi,
  compileMode,
}: OutputPanelProps) {
  const modules = project?.aiPipeline?.finalPromptIR?.modules;
  const conflicts = project?.aiPipeline?.constraintIR?.conflictsDetected ?? [];
  const source = project?.aiPipeline?.source;
  const reasoning = project?.aiPipeline?.aiReasoning;
  const validationIssues = project?.aiPipeline?.aiValidation?.issues?.map((issue) => ({
    module: issue.module,
    message: issue.message,
    autoFixed: issue.autoFixed,
  }));

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

        {/* AI Error Banner */}
        <AiErrorBanner error={aiError ?? null} onRetry={onRetryAi} />

        {/* Pipeline Visualizer */}
        <GlassPanel title="Pipeline">
          <PipelineVisualizer project={project} isCompiling={isCompiling} compileMode={compileMode} />
        </GlassPanel>

        {/* AI Reasoning Panel */}
        <AiReasoningPanel
          reasoning={reasoning}
          source={source}
          validationIssues={validationIssues}
        />

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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
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
              {/* Source badge */}
              {source && (
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    background:
                      source === 'ai'
                        ? 'rgba(139,92,246,0.12)'
                        : 'rgba(74,125,255,0.12)',
                    color:
                      source === 'ai'
                        ? 'var(--accent-purple)'
                        : 'var(--accent-blue)',
                    border:
                      source === 'ai'
                        ? '1px solid rgba(139,92,246,0.25)'
                        : '1px solid rgba(74,125,255,0.25)',
                  }}
                >
                  {source === 'ai' ? '✨ AI' : '⚡ Fast'}
                </span>
              )}
            </div>
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

      {/* Accessible live region for async status */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {isCompiling
          ? 'Compiling prompt…'
          : project
            ? `Compilation complete. Source: ${source ?? 'deterministic'}.`
            : ''}
      </div>

      {/* Stats Bar pinned to bottom */}
      <StatsBar project={project} />
    </div>
  );
}
