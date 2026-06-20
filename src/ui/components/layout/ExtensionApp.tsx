import React, { useState, useEffect } from 'react';
import { useDirectorState } from '../../hooks/useDirectorState';
import { useCompiler } from '../../hooks/useCompiler';
import { isAiAvailable } from '../../../ai/shot-planner';
import { GlassPanel } from '../shared/GlassPanel';
import { FlowModeSelector } from '../controls/FlowModeSelector';
import { CompileModeToggle } from '../controls/CompileModeToggle';
import { AiSettings } from '../controls/AiSettings';
import { SceneInput } from '../controls/SceneInput';
import { CameraSelector } from '../controls/CameraSelector';
import { LightingSelector } from '../controls/LightingSelector';
import { MoodPicker } from '../controls/MoodPicker';
import { EditModeSelector } from '../controls/EditModeSelector';
import { RealismDial } from '../controls/RealismDial';
import { ImperfectionDial } from '../controls/ImperfectionDial';
import { WardrobeInput } from '../controls/WardrobeInput';
import { LockedElementsPanel } from '../controls/LockedElements';
import { NegativeInput } from '../controls/NegativeInput';
import { PromptPreview } from '../output/PromptPreview';
import { ActionBar } from '../output/ActionBar';
import { ContradictionAlert } from '../output/ContradictionAlert';
import { AiReasoningPanel } from '../output/AiReasoningPanel';
import { AiErrorBanner } from '../output/AiErrorBanner';
import { PipelineVisualizer } from '../output/PipelineVisualizer';
import { ConfidenceDashboard } from '../output/ConfidenceDashboard';
import { ModuleInspector } from '../output/ModuleInspector';
import { StatsBar } from '../output/StatsBar';
import { SceneOntologyBadge } from '../output/SceneOntologyBadge';

type TabId = 'configure' | 'output';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)',
        fontWeight: 'var(--weight-semibold)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: 'var(--space-2)',
        marginTop: 'var(--space-2)',
      }}
    >
      {children}
    </div>
  );
}

export function ExtensionApp() {
  const { state, dispatch } = useDirectorState();
  const { compile } = useCompiler(state, dispatch);
  const [activeTab, setActiveTab] = useState<TabId>('configure');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Check AI availability on mount
  useEffect(() => {
    isAiAvailable().then((availability) => {
      dispatch({ type: 'SET_AI_AVAILABLE', payload: availability });
    });
  }, [dispatch]);

  // Auto-switch to output tab after successful compile
  const prevCompilingRef = React.useRef(state.isCompiling);
  useEffect(() => {
    if (prevCompilingRef.current && !state.isCompiling && state.project) {
      setActiveTab('output');
    }
    prevCompilingRef.current = state.isCompiling;
  }, [state.isCompiling, state.project]);

  const isAi = state.compileMode === 'ai';
  const isCreateMode = state.flowMode === 'create';
  const isCompleted = state.project?.generationState?.status === 'completed';

  // Derived data for output tab
  const prompt =
    state.project?.output?.editablePrompt ??
    state.project?.aiPipeline?.finalPromptIR?.mergedPrompt ??
    null;
  const conflicts = state.project?.aiPipeline?.constraintIR?.conflictsDetected ?? [];
  const source = state.project?.aiPipeline?.source;
  const reasoning = state.project?.aiPipeline?.aiReasoning;
  const validationIssues = state.project?.aiPipeline?.aiValidation?.issues?.map((issue) => ({
    module: issue.module,
    message: issue.message,
    autoFixed: issue.autoFixed,
  }));

  // Status text for compact header
  const isAiPhase =
    state.compileProgress?.phase === 'planning' ||
    state.compileProgress?.phase === 'validating' ||
    state.compileProgress?.phase === 'assembling';

  let statusText: string;
  if (state.compileProgress && state.isCompiling) {
    statusText = state.compileProgress.message;
  } else if (state.isCompiling) {
    statusText = 'Compiling…';
  } else if (isCompleted) {
    statusText = 'Compiled';
  } else {
    statusText = 'Ready';
  }

  const dotColor = state.isCompiling
    ? isAiPhase
      ? 'var(--accent-purple)'
      : 'var(--accent-warm)'
    : isCompleted
      ? 'var(--accent-green)'
      : 'var(--text-muted)';

  const dotGlow = state.isCompiling
    ? isAiPhase
      ? '0 0 8px rgba(139,92,246,0.5)'
      : '0 0 8px rgba(245,158,11,0.5)'
    : isCompleted
      ? '0 0 8px rgba(16,185,129,0.5)'
      : 'none';

  // Compile button content
  let compileButtonContent: React.ReactNode;
  if (state.isCompiling) {
    let phaseText = 'Compiling…';
    let phaseIcon: React.ReactNode = (
      <span
        style={{
          display: 'inline-block',
          width: 14,
          height: 14,
          border: isAi
            ? '2px solid rgba(139,92,246,0.3)'
            : '2px solid rgba(74,125,255,0.3)',
          borderTopColor: isAi ? 'var(--accent-purple)' : 'var(--accent-blue)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    );

    if (state.compileProgress?.phase === 'planning') {
      phaseText = '🧠 Planning…';
      phaseIcon = null;
    } else if (state.compileProgress?.phase === 'validating') {
      phaseText = '🔍 Validating…';
      phaseIcon = null;
    } else if (state.compileProgress?.phase === 'assembling') {
      phaseText = '📦 Assembling…';
      phaseIcon = null;
    }

    compileButtonContent = (
      <>
        {phaseIcon}
        {phaseText}
      </>
    );
  } else {
    compileButtonContent = isAi ? (
      <>
        <span style={{ fontSize: '1rem' }}>🧠</span>
        AI Compile
      </>
    ) : (
      <>
        <span style={{ fontSize: '1rem' }}>⚡</span>
        Compile Prompt
      </>
    );
  }

  const buttonGradient = isAi
    ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
    : 'var(--accent-gradient)';
  const buttonGlow = isAi
    ? 'var(--shadow-glow-purple)'
    : 'var(--shadow-glow-blue)';
  const buttonAccentColor = isAi ? 'var(--accent-purple)' : 'var(--accent-blue)';
  const buttonHoverShadow = isAi
    ? '0 0 30px rgba(139,92,246,0.35), 0 0 80px rgba(139,92,246,0.12)'
    : '0 0 30px rgba(74,125,255,0.35), 0 0 80px rgba(74,125,255,0.12)';

  // Tab accent
  const tabAccent = isAi ? 'rgba(139,92,246,0.8)' : 'rgba(74,125,255,0.8)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        background: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* ─── Compact Header (36px) ─── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-4)',
          height: 36,
          minHeight: 36,
          borderBottom: '1px solid var(--border-glass)',
          background: 'rgba(255,255,255,0.01)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: dotColor,
              boxShadow: dotGlow,
              animation: state.isCompiling ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
            }}
          />
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-bold)',
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}
          >
            NBP Director
          </span>
        </div>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            fontWeight: 'var(--weight-medium)',
          }}
        >
          {statusText}
        </span>
      </header>

      {/* ─── Tab Bar ─── */}
      <div
        role="tablist"
        aria-label="Extension panels"
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-glass)',
          background: 'var(--bg-secondary)',
          flexShrink: 0,
        }}
      >
        {([
          { id: 'configure' as TabId, label: '⚙️ Configure' },
          { id: 'output' as TabId, label: '📝 Output' },
        ]).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: 'var(--space-3) var(--space-4)',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive
                  ? `2px solid ${tabAccent}`
                  : '2px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 'var(--text-sm)',
                fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-medium)',
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                transition: 'all var(--duration-fast) var(--ease-default)',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Tab Content ─── */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--space-3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        {activeTab === 'configure' && (
          <div
            id="panel-configure"
            role="tabpanel"
            aria-labelledby="tab-configure"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              animation: 'fade-in var(--duration-fast) var(--ease-default)',
            }}
          >
            {/* Flow Mode */}
            <GlassPanel padding="var(--space-3)">
              <FlowModeSelector
                value={state.flowMode}
                onChange={(v) => dispatch({ type: 'SET_FLOW_MODE', payload: v })}
              />
            </GlassPanel>

            {/* Scene */}
            <GlassPanel>
              <SectionLabel>Scene Description</SectionLabel>
              <SceneInput
                value={state.scene}
                onChange={(v) => dispatch({ type: 'SET_SCENE', payload: v })}
              />
            </GlassPanel>

            {/* Camera */}
            <GlassPanel>
              <SectionLabel>Camera System</SectionLabel>
              <CameraSelector
                value={state.cameraStyle}
                onChange={(v) => dispatch({ type: 'SET_CAMERA', payload: v })}
              />
            </GlassPanel>

            {/* Lighting */}
            <GlassPanel>
              <SectionLabel>Lighting</SectionLabel>
              <LightingSelector
                value={state.lightingStyle}
                onChange={(v) => dispatch({ type: 'SET_LIGHTING', payload: v })}
              />
            </GlassPanel>

            {/* Mood */}
            <GlassPanel>
              <SectionLabel>Mood</SectionLabel>
              <MoodPicker
                value={state.mood}
                onChange={(v) => dispatch({ type: 'SET_MOOD', payload: v })}
              />
            </GlassPanel>

            {/* Edit Mode — only in Edit flow */}
            {!isCreateMode && (
              <GlassPanel>
                <SectionLabel>Edit Mode</SectionLabel>
                <EditModeSelector
                  value={state.editMode}
                  onChange={(v) => dispatch({ type: 'SET_EDIT_MODE', payload: v })}
                />
              </GlassPanel>
            )}

            {/* Realism + Imperfection */}
            <GlassPanel>
              <SectionLabel>Quality Dials</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <RealismDial
                  value={state.realismLevel}
                  onChange={(v) => dispatch({ type: 'SET_REALISM', payload: v })}
                />
                <ImperfectionDial
                  value={state.imperfectionLevel}
                  onChange={(v) => dispatch({ type: 'SET_IMPERFECTION', payload: v })}
                />
              </div>
            </GlassPanel>

            {/* Wardrobe */}
            <GlassPanel>
              <SectionLabel>Wardrobe</SectionLabel>
              <WardrobeInput
                value={state.wardrobe}
                onChange={(v) => dispatch({ type: 'SET_WARDROBE', payload: v })}
              />
              {isCreateMode && (
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    marginTop: 'var(--space-2)',
                    fontStyle: 'italic',
                  }}
                >
                  Leave empty to auto-detect from scene description
                </div>
              )}
            </GlassPanel>

            {/* Locked Elements — only in Edit flow */}
            {!isCreateMode && (
              <GlassPanel>
                <SectionLabel>Locked Elements</SectionLabel>
                <LockedElementsPanel
                  value={state.lockedElements}
                  onChange={(key) => dispatch({ type: 'TOGGLE_LOCK', payload: key })}
                />
              </GlassPanel>
            )}

            {/* Negatives */}
            <GlassPanel>
              <SectionLabel>Negative Constraints</SectionLabel>
              <NegativeInput
                value={state.negativeConstraints}
                onChange={(v) => dispatch({ type: 'SET_NEGATIVES', payload: v })}
              />
            </GlassPanel>

            {/* Compile Mode Toggle + AI Settings */}
            <GlassPanel padding="var(--space-3)">
              <SectionLabel>Compile Mode</SectionLabel>
              <CompileModeToggle
                value={state.compileMode}
                onChange={(mode) => dispatch({ type: 'SET_COMPILE_MODE', payload: mode })}
                disabled={!state.aiAvailable.anyAvailable}
              />
              <div style={{ marginTop: 'var(--space-2)' }}>
                <AiSettings aiAvailable={state.aiAvailable} />
              </div>
            </GlassPanel>
          </div>
        )}

        {activeTab === 'output' && (
          <div
            id="panel-output"
            role="tabpanel"
            aria-labelledby="tab-output"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              animation: 'fade-in var(--duration-fast) var(--ease-default)',
            }}
          >
            {/* Error banner */}
            {state.error && (
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
                {state.error}
              </div>
            )}

            {/* AI Error Banner */}
            <AiErrorBanner error={state.aiError ?? null} onRetry={compile} />

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
                <SceneOntologyBadge project={state.project} />
              </div>
              <PromptPreview project={state.project} />
            </GlassPanel>

            {/* Action Bar — sticky */}
            {prompt && (
              <ActionBar prompt={prompt} onRetryCompile={compile} />
            )}

            {/* Contradiction alerts */}
            {conflicts.length > 0 && (
              <GlassPanel title="Conflicts Detected">
                <ContradictionAlert conflicts={conflicts} />
              </GlassPanel>
            )}

            {/* Advanced Section (expandable) */}
            <div
              style={{
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-glass)',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setAdvancedOpen(!advancedOpen)}
                aria-expanded={advancedOpen}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-medium)',
                  textAlign: 'left',
                  outline: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    transition: 'transform var(--duration-fast) var(--ease-default)',
                    transform: advancedOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    display: 'inline-block',
                  }}
                >
                  ▶
                </span>
                Advanced
              </button>

              {advancedOpen && (
                <div
                  style={{
                    padding: '0 var(--space-4) var(--space-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)',
                    animation: 'fade-in var(--duration-fast) var(--ease-default)',
                  }}
                >
                  {/* Pipeline Visualizer */}
                  <GlassPanel title="Pipeline">
                    <PipelineVisualizer
                      project={state.project}
                      isCompiling={state.isCompiling}
                      compileMode={state.compileMode}
                      compileProgress={state.compileProgress}
                    />
                  </GlassPanel>

                  {/* Confidence Dashboard */}
                  {state.project?.confidence && (
                    <GlassPanel title="Confidence Scores">
                      <ConfidenceDashboard confidence={state.project.confidence} />
                    </GlassPanel>
                  )}

                  {/* Module Inspector */}
                  <GlassPanel title="Prompt Modules">
                    <ModuleInspector
                      modules={state.project?.aiPipeline?.finalPromptIR?.modules}
                    />
                  </GlassPanel>

                  {/* Stats Bar */}
                  <StatsBar project={state.project} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Sticky Compile Button ─── */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderTop: '1px solid var(--border-glass)',
          background: 'var(--bg-secondary)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={compile}
          disabled={state.isCompiling}
          aria-label={isAi ? 'AI Compile' : 'Compile Prompt'}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-6)',
            background: state.isCompiling
              ? `rgba(${isAi ? '139,92,246' : '74,125,255'},0.15)`
              : buttonGradient,
            color: state.isCompiling ? buttonAccentColor : '#fff',
            border: state.isCompiling
              ? `1px solid rgba(${isAi ? '139,92,246' : '74,125,255'},0.3)`
              : '1px solid transparent',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--weight-bold)',
            fontFamily: 'var(--font-sans)',
            cursor: state.isCompiling ? 'not-allowed' : 'pointer',
            transition: 'all var(--duration-fast) var(--ease-default)',
            boxShadow: state.isCompiling ? 'none' : buttonGlow,
            letterSpacing: '-0.01em',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseOver={(e) => {
            if (!state.isCompiling) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = buttonHoverShadow;
            }
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = state.isCompiling
              ? 'none'
              : buttonGlow;
          }}
        >
          {compileButtonContent}
        </button>
      </div>

      {/* Aria-live region for screen readers */}
      <div
        aria-live="polite"
        role="status"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          border: 0,
        }}
      >
        {state.isCompiling
          ? state.compileProgress?.message ?? 'Compiling prompt…'
          : state.project
            ? 'Compilation complete'
            : ''}
      </div>
    </div>
  );
}
