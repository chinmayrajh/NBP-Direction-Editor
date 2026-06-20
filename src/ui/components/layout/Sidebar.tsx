import React from 'react';
import type { DirectorState, DirectorAction } from '../../hooks/useDirectorState';
import { GlassPanel } from '../shared/GlassPanel';
import { FlowModeSelector } from '../controls/FlowModeSelector';
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

type SidebarProps = {
  state: DirectorState;
  dispatch: React.Dispatch<DirectorAction>;
  onCompile: () => void;
  isCompiling: boolean;
};

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

export function Sidebar({ state, dispatch, onCompile, isCompiling }: SidebarProps) {
  const isCreateMode = state.flowMode === 'create';

  return (
    <aside
      style={{
        width: 420,
        minWidth: 420,
        height: 'calc(100vh - 60px)',
        overflow: 'auto',
        borderRight: '1px solid var(--border-glass)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Scrollable controls area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        {/* Flow Mode — ALWAYS first */}
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
      </div>

      {/* ─── Compile Button — pinned to bottom ─── */}
      <div
        style={{
          padding: 'var(--space-4)',
          borderTop: '1px solid var(--border-glass)',
          background: 'var(--bg-secondary)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onCompile}
          disabled={isCompiling}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-4) var(--space-6)',
            background: isCompiling
              ? 'rgba(74,125,255,0.15)'
              : 'var(--accent-gradient)',
            color: isCompiling ? 'var(--accent-blue)' : '#fff',
            border: isCompiling
              ? '1px solid rgba(74,125,255,0.3)'
              : '1px solid transparent',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--weight-bold)',
            fontFamily: 'var(--font-sans)',
            cursor: isCompiling ? 'not-allowed' : 'pointer',
            transition: 'all var(--duration-fast) var(--ease-default)',
            boxShadow: isCompiling ? 'none' : 'var(--shadow-glow-blue)',
            letterSpacing: '-0.01em',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseOver={(e) => {
            if (!isCompiling) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                '0 0 30px rgba(74,125,255,0.35), 0 0 80px rgba(74,125,255,0.12)';
            }
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = isCompiling
              ? 'none'
              : 'var(--shadow-glow-blue)';
          }}
        >
          {isCompiling ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(74,125,255,0.3)',
                  borderTopColor: 'var(--accent-blue)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Compiling…
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.1rem' }}>⚡</span>
              Compile Prompt
            </>
          )}
        </button>

        {/* Hint */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 'var(--space-2)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          Set your scene and options, then compile
        </div>
      </div>
    </aside>
  );
}
