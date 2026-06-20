/**
 * @module ui/hooks/useDirectorState
 * @description useReducer-based state management for the NBP Director UI.
 */

import { useReducer } from 'react';
import type { CameraStyle, LightingStyle, Mood, EditMode, LockedElements } from '../../ir/types';
import type { DirectorProject } from '../../ir/project';
import { deriveLockedElements } from '../../compiler/normalize-inputs';

// ─── Flow Mode ─────────────────────────────────────────────────────────────────

/**
 * Top-level intent: is the user creating a new photo from scratch
 * or editing an existing one?
 *
 * This is UI-only state — the compiler sees `editMode` on DirectorInputs.
 */
export type FlowMode = 'create' | 'edit';

// ─── Compile Mode ──────────────────────────────────────────────────────────────

/** Whether to use deterministic rules or AI-guided shot planning. */
export type CompileMode = 'deterministic' | 'ai';

// ─── Compile Progress ──────────────────────────────────────────────────────────

/** Progress state for the multi-phase AI compilation. */
export type CompileProgress = {
  phase: 'planning' | 'validating' | 'assembling' | 'done' | 'error';
  message: string;
  startedAt: number;
} | null;

// ─── AI Availability ───────────────────────────────────────────────────────────

/** Describes which AI backends are available. */
export type AiAvailability = {
  builtinAi: boolean;
  geminiApi: boolean;
  anyAvailable: boolean;
};

// ─── State ─────────────────────────────────────────────────────────────────────

export type DirectorState = {
  flowMode: FlowMode;
  compileMode: CompileMode;
  compileProgress: CompileProgress;
  aiAvailable: AiAvailability;
  scene: string;
  cameraStyle: CameraStyle;
  lightingStyle: LightingStyle;
  mood: Mood;
  editMode: EditMode;
  realismLevel: number;
  imperfectionLevel: number;
  lockedElements: LockedElements;
  wardrobe: string;
  negativeConstraints: string;
  project: DirectorProject | null;
  isCompiling: boolean;
  error: string | null;
  /** AI error code for structured error display (separate from generic error). */
  aiError: string | null;
};

const initialState: DirectorState = {
  flowMode: 'create',
  compileMode: 'deterministic',
  compileProgress: null,
  aiAvailable: { builtinAi: false, geminiApi: false, anyAvailable: false },
  scene: '',
  cameraStyle: '85mm_portrait',
  lightingStyle: 'window_light',
  mood: 'confident',
  editMode: 'new_scene',
  realismLevel: 3,
  imperfectionLevel: 3,
  lockedElements: deriveLockedElements('new_scene'),
  wardrobe: '',
  negativeConstraints: '',
  project: null,
  isCompiling: false,
  error: null,
  aiError: null,
};

// ─── Actions ───────────────────────────────────────────────────────────────────

export type DirectorAction =
  | { type: 'SET_FLOW_MODE'; payload: FlowMode }
  | { type: 'SET_COMPILE_MODE'; payload: CompileMode }
  | { type: 'SET_COMPILE_PROGRESS'; payload: CompileProgress }
  | { type: 'SET_AI_AVAILABLE'; payload: AiAvailability }
  | { type: 'SET_SCENE'; payload: string }
  | { type: 'SET_CAMERA'; payload: CameraStyle }
  | { type: 'SET_LIGHTING'; payload: LightingStyle }
  | { type: 'SET_MOOD'; payload: Mood }
  | { type: 'SET_EDIT_MODE'; payload: EditMode }
  | { type: 'SET_REALISM'; payload: number }
  | { type: 'SET_IMPERFECTION'; payload: number }
  | { type: 'TOGGLE_LOCK'; payload: keyof LockedElements }
  | { type: 'SET_WARDROBE'; payload: string }
  | { type: 'SET_NEGATIVES'; payload: string }
  | { type: 'COMPILE_START' }
  | { type: 'COMPILE_SUCCESS'; payload: DirectorProject }
  | { type: 'COMPILE_ERROR'; payload: string }
  | { type: 'SET_AI_ERROR'; payload: string | null };

// ─── Reducer ───────────────────────────────────────────────────────────────────

function directorReducer(state: DirectorState, action: DirectorAction): DirectorState {
  switch (action.type) {
    case 'SET_FLOW_MODE': {
      if (action.payload === 'create') {
        return {
          ...state,
          flowMode: 'create',
          editMode: 'new_scene',
          lockedElements: deriveLockedElements('new_scene'),
        };
      }
      // edit mode
      return {
        ...state,
        flowMode: 'edit',
        editMode: 'preserve_enhance',
        lockedElements: deriveLockedElements('preserve_enhance'),
      };
    }

    case 'SET_COMPILE_MODE':
      return { ...state, compileMode: action.payload };

    case 'SET_COMPILE_PROGRESS':
      return { ...state, compileProgress: action.payload };

    case 'SET_AI_AVAILABLE':
      return { ...state, aiAvailable: action.payload };

    case 'SET_SCENE':
      return { ...state, scene: action.payload };

    case 'SET_CAMERA':
      return { ...state, cameraStyle: action.payload };

    case 'SET_LIGHTING':
      return { ...state, lightingStyle: action.payload };

    case 'SET_MOOD':
      return { ...state, mood: action.payload };

    case 'SET_EDIT_MODE':
      return {
        ...state,
        editMode: action.payload,
        lockedElements: deriveLockedElements(action.payload),
      };

    case 'SET_REALISM':
      return { ...state, realismLevel: action.payload };

    case 'SET_IMPERFECTION':
      return { ...state, imperfectionLevel: action.payload };

    case 'TOGGLE_LOCK':
      return {
        ...state,
        lockedElements: {
          ...state.lockedElements,
          [action.payload]: !state.lockedElements[action.payload],
        },
      };

    case 'SET_WARDROBE':
      return { ...state, wardrobe: action.payload };

    case 'SET_NEGATIVES':
      return { ...state, negativeConstraints: action.payload };

    case 'COMPILE_START':
      return { ...state, isCompiling: true, error: null, aiError: null };

    case 'COMPILE_SUCCESS':
      return {
        ...state,
        isCompiling: false,
        project: action.payload,
        error: null,
        compileProgress: null,
      };

    case 'COMPILE_ERROR':
      return {
        ...state,
        isCompiling: false,
        error: action.payload,
        compileProgress: null,
      };

    case 'SET_AI_ERROR':
      return { ...state, aiError: action.payload };

    default:
      return state;
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useDirectorState() {
  const [state, dispatch] = useReducer(directorReducer, initialState);
  return { state, dispatch };
}
