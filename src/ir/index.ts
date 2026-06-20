// ─────────────────────────────────────────────────────────────────────────────
// NBP Director — IR Module Barrel Export
// ─────────────────────────────────────────────────────────────────────────────

// ── IR Types ─────────────────────────────────────────────────────────────────
export type {
  // String literal unions
  EditMode,
  CameraStyle,
  LightingStyle,
  Mood,
  ReferenceImageRole,
  IdentityFailureType,
  IdentityTier,
  ConflictSeverity,
  ResolutionStrategy,
  PatchOperation,

  // Supporting sub-types
  LockedElements,
  IdentityAnchor,
  ConflictDetection,
  ConflictResolutionRecord,
  CritiqueFailure,
  CameraPlan,
  CompositionPlan,
  LightingPlan,
  WardrobePlan,
  AtmospherePlan,
  PoseLogic,
  CompilerConfidence,

  // Core IRs
  IntentIR,
  ConstraintIR,
  IdentityIR,
  PhotographyPlanIR,
  PromptModules,
  FinalPromptIR,
  CritiqueIR,
  PromptPatch,
  PromptVersion,

  // Config bridge types
  RealismLevel,
  ImperfectionLevel,
  LockedElement,
  CameraPhysicsSpec,
  LightingPhysicsSpec,
  SceneEnvironment,
  ConflictCategory,
  ConflictResolution,
  ConflictRule,
  DetectedConflict,
  EditIntent,
  PromptModule,
  MutationPolicy,
  ReferenceRole,
  ReferenceImage,
  ReferencePriorityEntry,
  ReferencePriorityPolicy,
  MergedPriorityMap,
} from './types.js';

// ── Project Domain Model ─────────────────────────────────────────────────────
export type {
  PipelineStatus,
  DirectorInputs,
  AiPipelineState,
  DirectorOutput,
  PipelineError,
  GenerationState,
  DirectorProject,
} from './project.js';
