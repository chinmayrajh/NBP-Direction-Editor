// ─────────────────────────────────────────────────────────────────────────────
// NBP Director — Director Project Domain Model
// ─────────────────────────────────────────────────────────────────────────────
// The DirectorProject is the top-level aggregate root. It owns the full
// lifecycle of a single prompt compilation: inputs → pipeline state →
// output → version history → confidence scores.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  IntentIR,
  ConstraintIR,
  IdentityIR,
  PhotographyPlanIR,
  PromptModules,
  FinalPromptIR,
  CritiqueIR,
  PromptVersion,
  CompilerConfidence,
  ReferenceImage,
  LockedElements,
  EditMode,
  CameraStyle,
  LightingStyle,
  Mood,
} from './types.js';

import type { CompiledDSL } from '../dsl/types.js';

// Re-export ReferenceImage from types.ts for consumers of project.ts
export type { ReferenceImage } from './types.js';

// ═══════════════════════════════════════════════════════════════════════════════
// §1  Pipeline Status
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Current status of the AI compilation pipeline.
 * Each value corresponds to one of the 9 compiler passes, plus lifecycle states.
 */
export type PipelineStatus =
  | 'idle'
  | 'normalizing'
  | 'resolving_constraints'
  | 'extracting_identity'
  | 'planning_photography'
  | 'injecting_realism'
  | 'composing'
  | 'applying_guardrails'
  | 'budgeting_tokens'
  | 'critiquing'
  | 'completed'
  | 'error';

/**
 * All user-provided inputs that feed the compilation pipeline.
 */
export type DirectorInputs = {
  /**
   * Reference images with assigned identity-anchoring roles.
   * At least one `face_anchor` is required for identity-preserving modes.
   */
  referenceImages: ReferenceImage[];

  // ── Scene & Style ────────────────────────────────────────────────────────

  /** Free-text core scene description. */
  coreScene: string;
  /** Wardrobe / outfit description (optional for some edit modes). */
  wardrobe?: string;

  // ── Edit Controls ────────────────────────────────────────────────────────

  /** How the compiler should treat existing scene elements. */
  editMode: EditMode;
  /** Camera simulation style. */
  cameraStyle: CameraStyle;
  /** Lighting approach. */
  lightingStyle: LightingStyle;
  /** Emotional register / mood. */
  mood: Mood;

  // ── Dials ────────────────────────────────────────────────────────────────

  /**
   * Realism target level.
   * Range: 1 (stylized) – 5 (hyper-real).
   */
  realismLevel: number;
  /**
   * Imperfection injection level.
   * Range: 1 (clean) – 5 (gritty).
   */
  imperfectionLevel: number;

  // ── Constraints ──────────────────────────────────────────────────────────

  /** Ordered list of creative priorities (highest first). */
  priorities: string[];
  /** Free-text negative constraints — things to avoid. */
  negativeConstraints: string;
  /** User-provided custom negative prompt fragments. */
  customNegativePrompt?: string[];
  /**
   * Optional user overrides for locked elements.
   * Merged with the edit-mode defaults in the normalize-inputs pass.
   * Only the overridden keys are applied; unset keys use mode defaults.
   */
  lockedElementOverrides?: Partial<LockedElements>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// §3  AI Pipeline State
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Holds the intermediate results from each compiler pass.
 *
 * All fields are optional because passes execute sequentially and
 * a given field is only populated after its corresponding pass completes.
 * This also enables partial-pipeline runs for debugging.
 */
export type AiPipelineState = {
  // ── Pass 1: Normalize Inputs ─────────────────────────────────────────────
  /** Output of the normalize-inputs pass. */
  intentIR?: IntentIR;
  /** Compiled DSL representation (produced alongside IntentIR). */
  compiledDSL?: CompiledDSL;

  // ── Pass 2: Resolve Constraints ──────────────────────────────────────────
  /** Output of the constraint-resolution pass. */
  constraintIR?: ConstraintIR;

  // ── Pass 3: Inject Identity ──────────────────────────────────────────────
  /** Output of the identity-injection pass. */
  identityIR?: IdentityIR;

  // ── Pass 4: Inject Photography ───────────────────────────────────────────
  /** Output of the photography-injection pass. */
  photographyPlanIR?: PhotographyPlanIR;

  // ── Pass 5: Inject Realism ───────────────────────────────────────────────
  /** Realism-enhanced prompt modules (mutated in place from photography plan). */
  realismEnhancedModules?: PromptModules;

  // ── Pass 6: Inject Composition ───────────────────────────────────────────
  /** Composition-enhanced prompt modules. */
  compositionEnhancedModules?: PromptModules;

  // ── Pass 7: Negative Guardrails ──────────────────────────────────────────
  /** Guardrail-processed prompt modules with hardened negative prompt. */
  guardrailedModules?: PromptModules;

  // ── Pass 8: Token Budgeting ──────────────────────────────────────────────
  /** Final prompt after token budgeting and optional compression. */
  finalPromptIR?: FinalPromptIR;

  // ── Pass 9: Visual Critique ──────────────────────────────────────────────
  /** Critique results from the visual-critique pass (may run multiple iterations). */
  critiqueIR?: CritiqueIR;
  /** Number of critique → patch → regenerate iterations completed. */
  critiqueIterations?: number;

  // ── AI-Specific Fields ────────────────────────────────────────────────
  /** Which pipeline path produced this result. */
  source?: 'deterministic' | 'ai';
  /** AI model's reasoning for creative decisions. */
  aiReasoning?: string;
  /** Validation results from deterministic validators. */
  aiValidation?: {
    pass: boolean;
    issues: { module: string; severity: string; message: string; autoFixed: boolean }[];
    fixedPlan: Record<string, string>;
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// §4  Output Types
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * The compiler's final deliverables.
 */
export type DirectorOutput = {
  /**
   * The full prompt compilation result as a JSON-serializable object.
   * This is the canonical output consumed by generation engines.
   */
  finalJson: FinalPromptIR | null;
  /**
   * A human-readable, user-editable version of the merged prompt.
   * Intended for display in the editor UI and manual tweaking.
   */
  editablePrompt: string | null;
  /**
   * URL or base64 data URI of the preview / generated image.
   * `null` until generation completes.
   */
  previewImage: string | null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// §5  Generation State
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * A single error that occurred during pipeline execution.
 */
export type PipelineError = {
  /** Which pass produced the error. */
  pass: PipelineStatus;
  /** Error message. */
  message: string;
  /** Machine-readable error code, if available. */
  code?: string;
  /** ISO-8601 timestamp of when the error occurred. */
  timestamp: string;
  /** Whether this error is recoverable (pipeline can continue). */
  recoverable: boolean;
};

/**
 * Tracks the runtime state of the compilation + generation pipeline.
 */
export type GenerationState = {
  /** Current pipeline status. */
  status: PipelineStatus;
  /**
   * Overall progress percentage.
   * Range: 0 – 100.
   */
  progress: number;
  /** Currently executing pass, if any. */
  currentPass?: PipelineStatus;
  /** Errors encountered during execution. */
  errors: PipelineError[];
  /** ISO-8601 timestamp of when the pipeline run started. */
  startedAt?: string;
  /** ISO-8601 timestamp of when the pipeline run completed (or errored). */
  completedAt?: string;
  /**
   * Elapsed wall-clock time in milliseconds.
   * Updated continuously while the pipeline is running.
   */
  elapsedMs?: number;
};

// ═══════════════════════════════════════════════════════════════════════════════
// §6  Director Project (Aggregate Root)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * The canonical project object — the top-level aggregate root for the
 * NBP Director system.
 *
 * A `DirectorProject` captures everything needed to reproduce, audit,
 * and iterate on a prompt compilation:
 *
 * 1. **Inputs** — user-provided reference images, scene description, dials.
 * 2. **Pipeline** — intermediate results from each of the 9 compiler passes.
 * 3. **Output** — the final prompt, editable prompt, and preview image.
 * 4. **Generation State** — progress, errors, and timing.
 * 5. **Versions** — DAG of prompt versions for undo/redo and branching.
 * 6. **Confidence** — per-axis quality predictions.
 */
export type DirectorProject = {
  /** Unique project identifier (UUID v4). */
  id: string;
  /** ISO-8601 timestamp of project creation. */
  createdAt: string;
  /** ISO-8601 timestamp of last modification. */
  updatedAt: string;
  /** All user-provided inputs. */
  inputs: DirectorInputs;
  /** Intermediate results from each compiler pass. */
  aiPipeline: AiPipelineState;
  /** Final deliverables. */
  output: DirectorOutput;
  /** Runtime state of the pipeline. */
  generationState: GenerationState;
  /** Prompt version history (DAG). Ordered oldest → newest. */
  versions: PromptVersion[];
  /** Per-axis compiler confidence scores. */
  confidence: CompilerConfidence;
};
