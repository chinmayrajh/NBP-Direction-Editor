/**
 * @module ui/hooks/useCompiler
 * @description Bridge hook: maps DirectorState → DirectorInputs → runPipeline().
 * Debounces compilation by 500ms on any state change.
 */

import { useCallback } from 'react';
import type { LockedElements } from '../../ir/types';
import type { DirectorInputs } from '../../ir/project';
import type { DirectorState, DirectorAction } from './useDirectorState';
import { runPipeline } from '../../compiler/orchestrator';
import { BrowserLogger } from '../../utils/browser-logger';
import { deriveLockedElements } from '../../compiler/normalize-inputs';

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

  const compile = useCallback(() => {
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

  return { compile };
}
