/**
 * @module ui/hooks/useCompiler
 * @description Bridge hook: maps DirectorState → DirectorInputs → compile.
 *
 * Supports two paths:
 * - **Deterministic**: synchronous runPipeline() (instant)
 * - **AI-Guided**: async planShot() → validate → assemble (1-5s)
 *
 * Race conditions are handled via a compileId counter — stale responses
 * from earlier compilations are silently discarded.
 */

import { useCallback, useRef } from 'react';
import type { LockedElements } from '../../ir/types';
import type { DirectorInputs } from '../../ir/project';
import type { DirectorState, DirectorAction } from './useDirectorState';
import { runPipeline } from '../../compiler/orchestrator';
import { BrowserLogger } from '../../utils/browser-logger';
import { deriveLockedElements } from '../../compiler/normalize-inputs';
import { normalizeInputs } from '../../compiler/normalize-inputs';
import { resolveConstraints } from '../../compiler/resolve-constraints';
import { injectIdentity } from '../../compiler/inject-identity';
import { buildIdentityLockString } from '../../compiler/inject-realism';
import { NBP_RULES } from '../../config/nbp-rules';
import { planShot } from '../../ai/shot-planner';
import { validateAndFix } from '../../ai/validators';
import { assembleAiProject } from '../../ai/assemble';

// ─── Build Inputs ──────────────────────────────────────────────────────────────

function buildInputs(state: DirectorState): DirectorInputs {
  const modeDefaults = deriveLockedElements(state.editMode);
  const overrides: Partial<LockedElements> = {};

  for (const key of Object.keys(modeDefaults) as (keyof LockedElements)[]) {
    if (state.lockedElements[key] !== modeDefaults[key]) {
      overrides[key] = state.lockedElements[key];
    }
  }

  return {
    coreScene: state.scene,
    referenceImages: [],
    editMode: state.editMode,
    cameraStyle: state.cameraStyle,
    lightingStyle: state.lightingStyle,
    mood: state.mood,
    realismLevel: state.realismLevel,
    imperfectionLevel: state.imperfectionLevel,
    priorities: [],
    negativeConstraints: state.negativeConstraints,
    wardrobe: state.wardrobe || undefined,
    lockedElementOverrides: Object.keys(overrides).length > 0 ? overrides : undefined,
  };
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useCompiler(state: DirectorState, dispatch: React.Dispatch<DirectorAction>) {
  /** Counter to detect stale responses from earlier compile calls. */
  const compileIdRef = useRef(0);

  /**
   * Deterministic compilation — synchronous, instant.
   */
  const compileDeterministic = useCallback(() => {
    dispatch({ type: 'COMPILE_START' });

    try {
      const inputs = buildInputs(state);
      const logger = new BrowserLogger();
      const project = runPipeline(inputs, { logger });

      if (project.generationState.status === 'error') {
        const errMsg = project.generationState.errors[0]?.message ?? 'Unknown compilation error';
        dispatch({ type: 'COMPILE_ERROR', payload: errMsg });
      } else {
        dispatch({ type: 'COMPILE_SUCCESS', payload: project });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch({ type: 'COMPILE_ERROR', payload: message });
    }
  }, [
    state.scene,
    state.cameraStyle,
    state.lightingStyle,
    state.mood,
    state.editMode,
    state.realismLevel,
    state.imperfectionLevel,
    state.lockedElements,
    state.wardrobe,
    state.negativeConstraints,
    dispatch,
  ]);

  /**
   * AI-guided compilation — async, 1-5 seconds.
   * Falls back to deterministic on any error.
   */
  const compileAi = useCallback(async () => {
    const thisCompileId = ++compileIdRef.current;
    const startTime = Date.now();

    dispatch({ type: 'COMPILE_START' });
    dispatch({ type: 'SET_AI_ERROR', payload: null });

    try {
      const inputs = buildInputs(state);

      // ── Phase 1: Deterministic identity + negatives ──────────────────
      dispatch({
        type: 'SET_COMPILE_PROGRESS',
        payload: { phase: 'planning', message: '🧠 AI is planning your shot…', startedAt: startTime },
      });

      const intentIR = normalizeInputs(inputs);
      const constraintIR = resolveConstraints(intentIR);
      const identityIR = injectIdentity(intentIR, constraintIR);
      const identityLock = buildIdentityLockString(identityIR);
      const negativePrompt: string[] = [...NBP_RULES.negativePromptDefaults];

      // Add user's negative constraints
      if (inputs.negativeConstraints) {
        negativePrompt.push(
          ...inputs.negativeConstraints
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        );
      }

      // ── Phase 2: AI creative planning ────────────────────────────────
      const shotPlan = await planShot(inputs);

      // Check if stale
      if (compileIdRef.current !== thisCompileId) return;

      // ── Phase 3: Validate + auto-fix ─────────────────────────────────
      dispatch({
        type: 'SET_COMPILE_PROGRESS',
        payload: { phase: 'validating', message: '🔍 Validating AI output…', startedAt: startTime },
      });

      const validation = validateAndFix(shotPlan, intentIR);

      // ── Phase 4: Assemble project ────────────────────────────────────
      dispatch({
        type: 'SET_COMPILE_PROGRESS',
        payload: { phase: 'assembling', message: '📦 Assembling prompt…', startedAt: startTime },
      });

      const elapsedMs = Date.now() - startTime;
      const project = assembleAiProject(
        inputs,
        validation.fixedPlan,
        identityLock,
        negativePrompt,
        identityIR,
        intentIR,
        validation,
        elapsedMs,
      );

      // Check if stale again
      if (compileIdRef.current !== thisCompileId) return;

      dispatch({ type: 'COMPILE_SUCCESS', payload: project });
    } catch (err) {
      // Check if stale
      if (compileIdRef.current !== thisCompileId) return;

      const message = err instanceof Error ? err.message : String(err);

      // Don't show UI for aborted requests
      if (message === 'ABORTED') return;

      // Set AI error for structured display
      dispatch({ type: 'SET_AI_ERROR', payload: message });

      // Fall back to deterministic pipeline
      try {
        const inputs = buildInputs(state);
        const logger = new BrowserLogger();
        const project = runPipeline(inputs, { logger });
        dispatch({ type: 'COMPILE_SUCCESS', payload: project });
      } catch (fallbackErr) {
        const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        dispatch({ type: 'COMPILE_ERROR', payload: fallbackMsg });
      }
    }
  }, [
    state.scene,
    state.cameraStyle,
    state.lightingStyle,
    state.mood,
    state.editMode,
    state.realismLevel,
    state.imperfectionLevel,
    state.lockedElements,
    state.wardrobe,
    state.negativeConstraints,
    dispatch,
  ]);

  /**
   * Main compile function — routes to deterministic or AI based on state.
   */
  const compile = useCallback(() => {
    if (state.compileMode === 'ai' && state.apiKeyConfigured) {
      compileAi();
    } else {
      compileDeterministic();
    }
  }, [state.compileMode, state.apiKeyConfigured, compileDeterministic, compileAi]);

  return { compile };
}
