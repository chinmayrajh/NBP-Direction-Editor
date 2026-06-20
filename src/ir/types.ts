// ─────────────────────────────────────────────────────────────────────────────
// NBP Director — Intermediate Representation Types
// ─────────────────────────────────────────────────────────────────────────────
// These types define the contracts between all 9 compiler passes:
//   normalize-inputs → resolve-constraints → inject-identity →
//   inject-photography → inject-realism → inject-composition →
//   negative-guardrails → token-budgeting → visual-critique
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// §1  String Literal Union Types (JSON-serialization-friendly alternatives to enums)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Determines how the compiler should treat existing scene elements.
 *
 * - `preserve_enhance`  — Keep everything, push quality/realism up.
 * - `new_scene`         — Discard existing scene; build from scratch.
 * - `wardrobe_swap`     — Replace outfit only; anchor everything else.
 * - `lighting_edit`     — Re-light the scene; preserve subject & wardrobe.
 * - `editorial_upgrade` — Elevate to editorial-magazine quality.
 * - `cinematic_upgrade` — Apply cinematic grading, lens, and atmosphere.
 * - `ugc_realism`       — Down-grade toward user-generated-content feel.
 */
export type EditMode =
  | 'preserve_enhance'
  | 'new_scene'
  | 'wardrobe_swap'
  | 'lighting_edit'
  | 'editorial_upgrade'
  | 'cinematic_upgrade'
  | 'ugc_realism';

/**
 * Simulated camera system that controls lens distortion, bokeh, and grain
 * characteristics in the final prompt.
 */
export type CameraStyle =
  | 'iphone'
  | '35mm_street'
  | '85mm_portrait'
  | 'retro_ccd'
  | 'cinema_lens'
  | 'luxury_editorial';

/**
 * Primary lighting intent. The photography-injection pass expands this into
 * full light-rig descriptions with ratios and falloff curves.
 */
export type LightingStyle =
  | 'golden_hour'
  | 'direct_flash'
  | 'window_light'
  | 'neon_night'
  | 'studio'
  | 'overcast';

/**
 * Emotional register of the subject. Affects micro-expression tokens
 * and body-language cues injected by the pose-choreography module.
 */
export type Mood =
  | 'detached'
  | 'confident'
  | 'romantic'
  | 'calm'
  | 'playful';

/**
 * Role a reference image plays in identity anchoring.
 *
 * - `face_anchor`     — Primary identity source (Tier 1 geometry).
 * - `hair_reference`  — Hairstyle / color / texture reference (Tier 2).
 * - `body_reference`  — Body proportions and skin texture reference.
 * - `style_reference` — Outfit / mood-board reference (no identity data).
 */
export type ReferenceImageRole =
  | 'face_anchor'
  | 'hair_reference'
  | 'body_reference'
  | 'style_reference';

/**
 * Taxonomy of identity-preservation failures detected by the visual critic.
 * Each value maps to a specific remediation strategy in the critique loop.
 */
export type IdentityFailureType =
  | 'FACE_SOFTENING'
  | 'EYE_DRIFT'
  | 'JAWLINE_MUTATION'
  | 'HAIRLINE_SHIFT'
  | 'AGE_SHIFT'
  | 'ETHNICITY_DRIFT'
  | 'SKIN_TONE_DRIFT';

/**
 * The identity-anchoring tier to which a trait belongs.
 *
 * - `1` — Immutable geometry: face shape, eye spacing, jawline, nose bridge.
 * - `2` — Semi-stable features: hairstyle, hair texture, eyebrow shape.
 * - `3` — Volatile attributes: expression, lighting-dependent appearance.
 */
export type IdentityTier = 1 | 2 | 3;

/**
 * Severity level for a detected conflict between scene constraints.
 */
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Strategy used to resolve a constraint conflict.
 */
export type ResolutionStrategy =
  | 'priority_override'
  | 'weighted_blend'
  | 'user_preference'
  | 'drop_lower_priority'
  | 'manual';

/**
 * AST-level operation applied in a prompt patch.
 *
 * - `replace`    — Wholesale replacement of a token span.
 * - `strengthen` — Increase emphasis (e.g. add weight brackets).
 * - `weaken`     — Decrease emphasis.
 * - `inject`     — Insert new tokens into a module.
 * - `remove`     — Delete tokens from a module.
 */
export type PatchOperation =
  | 'replace'
  | 'strengthen'
  | 'weaken'
  | 'inject'
  | 'remove';

// ═══════════════════════════════════════════════════════════════════════════════
// §2  Supporting Sub-Types
// ═══════════════════════════════════════════════════════════════════════════════

// ─── LockedElements ──────────────────────────────────────────────────────────

/**
 * Boolean flags indicating which scene elements are locked against
 * modification by downstream compiler passes.
 *
 * When an element is `true` the compiler must preserve its current value
 * through every subsequent pass.
 */
export type LockedElements = {
  /** Lock facial identity — Tier 1 anchors are always implicitly locked. */
  face: boolean;
  /** Lock hairstyle, color, and texture. */
  hair: boolean;
  /** Lock body pose and body-language cues. */
  pose: boolean;
  /** Lock the current lighting setup. */
  lighting: boolean;
  /** Lock wardrobe / outfit. */
  outfit: boolean;
  /** Lock the background / environment. */
  environment: boolean;
};

// ─── IdentityAnchor ──────────────────────────────────────────────────────────

/**
 * A single measurable identity trait extracted from a reference image.
 *
 * Anchors are organized by tier:
 * - Tier 1 (immutable): face geometry, eye spacing, jawline contour, nose bridge.
 * - Tier 2 (semi-stable): hairstyle, hair texture, eyebrow arch.
 * - Tier 3 (volatile): micro-expressions, light-dependent skin reflectance.
 */
export type IdentityAnchor = {
  /** Human-readable trait name, e.g. "eye_spacing" or "jawline_contour". */
  trait: string;
  /** Descriptive value or normalized measurement of the trait. */
  value: string;
  /**
   * Importance weight for this anchor during prompt generation.
   * Range: 0.0 – 1.0. Higher weight = more prompt tokens allocated.
   */
  weight: number;
  /** Tier classification governing mutability rules. */
  tier: IdentityTier;
};

// ─── ConflictDetection & Resolution ──────────────────────────────────────────

/**
 * A contradiction detected between two or more scene constraints.
 *
 * Example: `lightingStyle: 'golden_hour'` + `scene: 'underground parking garage'`
 * is physically implausible and will be flagged.
 */
export type ConflictDetection = {
  /** Unique identifier for this conflict instance. */
  id: string;
  /** Human-readable summary of the contradiction. */
  description: string;
  /** The constraint elements involved in the conflict. */
  elements: string[];
  /** Assessed severity of the conflict. */
  severity: ConflictSeverity;
  /** Which compiler pass detected this conflict. */
  detectedBy: string;
};

/**
 * Record of how a detected conflict was resolved, for audit trail.
 */
export type ConflictResolutionRecord = {
  /** The `id` of the {@link ConflictDetection} that was resolved. */
  conflictId: string;
  /** Strategy applied to resolve the conflict. */
  strategy: ResolutionStrategy;
  /** Textual description of the action taken. */
  action: string;
  /** Which element "won" in a priority-based resolution, if applicable. */
  winner?: string;
  /** Original values that were overridden or dropped. */
  originalValues: Record<string, string>;
  /** Final values after resolution. */
  resolvedValues: Record<string, string>;
};

// ─── CritiqueFailure ─────────────────────────────────────────────────────────

/**
 * A specific failure identified by the visual-critique pass when comparing
 * the generated image against the intent and identity references.
 */
export type CritiqueFailure = {
  /** Category of failure (identity, lighting, composition, realism, etc.). */
  category: 'identity' | 'lighting' | 'composition' | 'realism' | 'pose' | 'wardrobe' | 'atmosphere';
  /** Sub-type for identity failures; `undefined` for non-identity failures. */
  identityFailureType?: IdentityFailureType;
  /** Human-readable description of what went wrong. */
  description: string;
  /**
   * Severity score for this failure.
   * Range: 0.0 (negligible) – 1.0 (catastrophic).
   */
  severity: number;
  /** The prompt module(s) most likely responsible. */
  affectedModules: (keyof PromptModules)[];
};

// ─── Camera & Photography Plan Sub-Types ─────────────────────────────────────

/**
 * Fully specified camera configuration for the photography-injection pass.
 */
export type CameraPlan = {
  /** Selected camera simulation style. */
  style: CameraStyle;
  /** Effective focal length in mm (e.g. 35, 50, 85, 135). */
  focalLength: number;
  /** Aperture f-stop (e.g. 1.4, 2.8, 5.6). Controls depth-of-field. */
  aperture: number;
  /** Sensor simulation: full-frame, APS-C, medium-format, phone-sensor. */
  sensorType: string;
  /** Optional film-stock simulation (e.g. "Portra 400", "Kodak Gold 200"). */
  filmStock?: string;
  /** Lens distortion profile descriptor (e.g. "barrel_slight", "none"). */
  distortion: string;
  /** ISO sensitivity — affects grain characteristics. */
  iso?: number;
  /** Shutter speed descriptor for motion-blur tokens (e.g. "1/125", "1/60"). */
  shutterSpeed?: string;
};

/**
 * Composition blueprint: framing, angles, and spatial relationships.
 */
export type CompositionPlan = {
  /** Compositional framework (e.g. "rule_of_thirds", "center_dominant", "dutch_angle"). */
  framework: string;
  /** Shot type: extreme-close-up, close-up, medium, full-body, wide, establishing. */
  shotType: string;
  /** Camera angle descriptor (e.g. "eye_level", "low_angle", "overhead"). */
  cameraAngle: string;
  /** Subject placement within the frame (e.g. "left_third", "center", "off_center_right"). */
  subjectPlacement: string;
  /** Depth layering description: foreground / midground / background elements. */
  depthLayers: string[];
  /** Desired aspect ratio (e.g. "3:2", "4:5", "16:9", "1:1"). */
  aspectRatio: string;
  /** Negative space intent: how much and where. */
  negativeSpace?: string;
  /** Leading lines or visual flow description. */
  leadingLines?: string;
};

/**
 * Full lighting rig specification generated by the photography-injection pass.
 */
export type LightingPlan = {
  /** Primary lighting style / intent. */
  style: LightingStyle;
  /** Key light descriptor with direction and intensity. */
  keyLight: string;
  /** Fill light descriptor, or "none" for hard-light setups. */
  fillLight: string;
  /** Rim / hair / accent light descriptor. */
  rimLight?: string;
  /** Ambient / environmental light description. */
  ambientLight: string;
  /** Color temperature in Kelvin (e.g. 3200 for warm tungsten, 5600 for daylight). */
  colorTemperature: number;
  /**
   * Light-to-shadow ratio descriptor.
   * E.g. "2:1" for gentle contrast, "8:1" for dramatic.
   */
  contrastRatio: string;
  /** Shadow quality: "soft", "medium", "hard". */
  shadowQuality: string;
  /** Optional practical light sources in the scene (lamps, signs, candles). */
  practicalLights?: string[];
};

/**
 * Wardrobe plan with material-physics tokens for realism injection.
 */
export type WardrobePlan = {
  /** High-level garment description (e.g. "oversized blazer with wide-leg trousers"). */
  description: string;
  /** Primary material / fabric (e.g. "raw silk", "worn denim", "cashmere knit"). */
  material: string;
  /** Fit description (e.g. "relaxed", "tailored", "oversized"). */
  fit: string;
  /** Colour palette description. */
  colorPalette: string;
  /** Texture detail tokens for the realism pass. */
  textureDetail: string;
  /**
   * Fabric-physics tokens: how the material drapes, creases, and catches light.
   * These are critical for bypassing the "AI sheen" look.
   */
  physicsTokens: string[];
  /** Accessories, shoes, jewelry, etc. */
  accessories?: string[];
};

/**
 * Atmosphere and environment plan.
 */
export type AtmospherePlan = {
  /** Overall atmosphere descriptor (e.g. "misty morning", "dusty golden haze"). */
  description: string;
  /** Atmospheric particles: dust, mist, rain, smoke, none. */
  particles: string;
  /** Background blur / bokeh quality descriptor. */
  backgroundTreatment: string;
  /** Environmental sound-scape hint (informs mood tokens). */
  environmentalContext: string;
  /** Color grading / LUT descriptor for the final image. */
  colorGrading: string;
  /** Time-of-day for lighting consistency. */
  timeOfDay: string;
  /** Weather conditions. */
  weather: string;
};

/**
 * Pose and body-language plan.
 */
export type PoseLogic = {
  /** High-level pose intent (e.g. "leaning against wall", "mid-stride"). */
  intent: string;
  /** Body orientation relative to camera (e.g. "three_quarter_turn", "frontal"). */
  bodyOrientation: string;
  /** Head tilt / angle descriptor. */
  headPosition: string;
  /** Eye-line direction (e.g. "direct_to_camera", "looking_down_left"). */
  eyeDirection: string;
  /** Hand placement and gesture description. */
  handPlacement: string;
  /** Weight distribution descriptor (e.g. "weight_on_left_hip"). */
  weightDistribution: string;
  /** Micro-expression tokens aligned with the selected {@link Mood}. */
  microExpression: string;
  /**
   * Dynamic motion cue: is the subject static, in-motion, or caught mid-action?
   * Informs shutter-speed and motion-blur token choices.
   */
  motionState: 'static' | 'subtle_movement' | 'in_motion' | 'frozen_action';
};

// ─── CompilerConfidence ──────────────────────────────────────────────────────

/**
 * Per-axis confidence scores produced by the compiler after all passes complete.
 * Each score is in the range 0.0 – 1.0.
 */
export type CompilerConfidence = {
  /** How confident the compiler is that identity will be preserved. */
  identity: number;
  /** Confidence in achieving the requested realism level. */
  realism: number;
  /** Confidence in compositional accuracy (framing, angles, placement). */
  composition: number;
  /** Overall controllability: will the generation model follow the prompt? */
  controllability: number;
};

// ═══════════════════════════════════════════════════════════════════════════════
// §3  Core Intermediate Representations
// ═══════════════════════════════════════════════════════════════════════════════

// ─── IntentIR ────────────────────────────────────────────────────────────────

/**
 * **Pass 1 output: Normalize Inputs.**
 *
 * Canonical representation of the user's creative intent, produced by
 * normalizing free-form inputs into typed, validated fields.
 *
 * Every downstream pass reads `IntentIR` to understand _what_ the user wants;
 * it is never mutated after creation.
 */
export type IntentIR = {
  /** Free-text scene description, normalized and spell-checked. */
  scene: string;
  /** How the compiler should treat existing scene elements. */
  editMode: EditMode;
  /** Ordered list of the user's creative priorities (highest first). */
  priorities: string[];
  /** Which elements the user has explicitly locked against modification. */
  lockedElements: LockedElements;
  /**
   * Target realism level.
   * - 1 = stylized / illustrated
   * - 3 = natural but polished
   * - 5 = hyper-real, indistinguishable from a photograph
   */
  realismLevel: number;
  /**
   * Target imperfection level — controls injection of "anti-AI" micro-details.
   * - 1 = clean, polished
   * - 3 = natural wear / subtle imperfections
   * - 5 = gritty, heavy grain, visible flaws
   */
  imperfectionLevel: number;
  /** Desired camera simulation style. */
  cameraStyle: CameraStyle;
  /** Desired lighting approach. */
  lightingStyle: LightingStyle;
  /** Emotional register / mood of the image. */
  mood: Mood;
  /** Optional wardrobe / outfit directive. */
  wardrobe?: string;
  /** Free-text negative constraints (things to avoid). */
  negativeConstraints: string;
};

// ─── ConstraintIR ────────────────────────────────────────────────────────────

/**
 * **Pass 2 output: Resolve Constraints.**
 *
 * Partitions all scene tokens into immutable, editable, and forbidden sets,
 * and records any detected + resolved contradictions between constraints.
 */
export type ConstraintIR = {
  /** Tokens / phrases that must appear verbatim in the final prompt. */
  immutable: string[];
  /** Tokens / phrases that downstream passes may modify or enhance. */
  editable: string[];
  /** Tokens / phrases that must never appear (feeds negative prompt). */
  forbidden: string[];
  /** Contradictions detected between constraints. */
  conflictsDetected: ConflictDetection[];
  /** Resolution records for each resolved conflict. */
  conflictsResolved: ConflictResolutionRecord[];
};

// ─── IdentityIR ──────────────────────────────────────────────────────────────

/**
 * **Pass 3 output: Inject Identity.**
 *
 * Identity-preservation layer built from reference images. Anchors are
 * organized into three tiers of mutability so that downstream passes
 * know which facial / body features they may *never* alter.
 */
export type IdentityIR = {
  /**
   * Tier 1 — Immutable anchors.
   * Face geometry, eye spacing, nose bridge, jawline contour, ear placement.
   * These survive every edit mode and must appear in every generated prompt.
   */
  tier1Anchors: IdentityAnchor[];
  /**
   * Tier 2 — Semi-stable anchors.
   * Hairstyle, hair texture/color, eyebrow shape/arch.
   * May be overridden explicitly by `wardrobe_swap` or user unlock.
   */
  tier2Anchors: IdentityAnchor[];
  /**
   * Tier 3 — Volatile traits.
   * Expression, lighting-dependent appearance, perspiration, blush.
   * Ignored for identity matching; the compiler may freely alter these.
   */
  tier3Traits: string[];
  /** Roles assigned to each uploaded reference image. */
  referenceRoles: ReferenceImageRole[];
  /**
   * Overall confidence that the extracted identity anchors are sufficient
   * to preserve identity in generation. Range: 0.0 – 1.0.
   */
  identityConfidence: number;
  /**
   * Human-readable summary of the subject's biological features,
   * used as a fallback prose anchor when structured tokens are exhausted.
   */
  biologySummary: string;
};

// ─── PhotographyPlanIR ───────────────────────────────────────────────────────

/**
 * **Pass 4 output: Inject Photography.**
 *
 * Complete photography plan expanding the user's high-level intent
 * (camera style, lighting style, mood) into granular, physically-plausible
 * camera / lighting / wardrobe / atmosphere / pose specifications.
 */
export type PhotographyPlanIR = {
  /** Full camera configuration. */
  camera: CameraPlan;
  /** Composition and framing blueprint. */
  composition: CompositionPlan;
  /** Lighting rig specification. */
  lighting: LightingPlan;
  /** Wardrobe plan with material-physics tokens. */
  wardrobe: WardrobePlan;
  /** Atmosphere and environment plan. */
  atmosphere: AtmospherePlan;
  /** Pose and body-language choreography. */
  poseLogic: PoseLogic;
};

// ─── PromptModules ───────────────────────────────────────────────────────────

/**
 * **Modular prompt architecture.**
 *
 * The compiler assembles the final prompt from independently authored modules.
 * Each module is a self-contained block of prompt tokens that can be
 * individually patched, strengthened, weakened, or removed by the
 * critique loop.
 */
export type PromptModules = {
  /** The user's core scene description — placed at the very start of the prompt. */
  sceneDescription: string;
  /** Identity-lock tokens: Tier 1 + Tier 2 anchors serialized as prompt text. */
  identityLock: string;
  /** Camera system tokens: lens, sensor, aperture, film-stock, distortion. */
  cameraSystem: string;
  /** Lighting rig tokens: key, fill, rim, ambient, temperature, contrast. */
  lightingSystem: string;
  /** Wardrobe tokens with material-physics descriptors. */
  wardrobePhysics: string;
  /** Pose and body-language choreography tokens. */
  poseChoreography: string;
  /** Edge-of-frame activity / peripheral detail tokens. */
  edgeActivity: string;
  /** Atmosphere, environment, and color-grading tokens. */
  atmosphere: string;
  /**
   * Realism-injection tokens: skin pores, fabric weave, lens artifacts.
   * Scaled by {@link IntentIR.realismLevel}.
   */
  realismTokens: string;
  /**
   * Imperfection-injection tokens: grain, dust, micro-scratches, stray hairs.
   * Scaled by {@link IntentIR.imperfectionLevel}.
   */
  imperfectionTokens: string;
  /** Negative prompt fragments (things to suppress in generation). */
  negativePrompt: string[];
};

// ─── FinalPromptIR ───────────────────────────────────────────────────────────

/**
 * **Pass 8 output: Token Budgeting.**
 *
 * The final assembled prompt after all modules have been merged,
 * token-budgeted, and optionally compressed to fit model limits.
 */
export type FinalPromptIR = {
  /** The individual prompt modules before merging. */
  modules: PromptModules;
  /** The merged, ordered prompt string ready for the generation model. */
  mergedPrompt: string;
  /** Total token count of the merged prompt (model-specific tokenizer). */
  tokenCount: number;
  /** Whether token compression was applied to fit within budget. */
  compressionApplied: boolean;
  /**
   * Tokens that were dropped during compression, ordered by
   * least-important-first. Useful for diagnosing quality loss.
   */
  droppedTokens: string[];
};

// ─── CritiqueIR ──────────────────────────────────────────────────────────────

/**
 * **Pass 9 output: Visual Critique.**
 *
 * Result of comparing a generated image against the original intent,
 * identity references, and photography plan. Drives the closed-loop
 * refinement cycle.
 *
 * All mismatch scores are in the range 0.0 (perfect) – 1.0 (total failure).
 */
export type CritiqueIR = {
  /** How much the generated face drifted from identity anchors. */
  identityDrift: number;
  /** Degree of mismatch between requested and actual pose. */
  poseMismatch: number;
  /** Degree of mismatch between requested and actual lighting. */
  lightingMismatch: number;
  /** Gap between requested realism level and perceived realism. */
  realismGap: number;
  /**
   * Compositional flatness score: 0 = rich depth/layering,
   * 1 = completely flat / lifeless composition.
   */
  compositionFlatness: number;
  /** Itemized list of specific failures with severity scores. */
  failures: CritiqueFailure[];
  /** AST-level prompt patches recommended to fix detected failures. */
  recommendedFixes: PromptPatch[];
  /**
   * Overall quality score.
   * Range: 0.0 (unusable) – 1.0 (perfect match to intent).
   */
  overallScore: number;
};

// ─── PromptPatch ─────────────────────────────────────────────────────────────

/**
 * An AST-style diff operation that modifies a single prompt module.
 *
 * Patches are produced by the visual-critique pass and applied by the
 * prompt-mutation engine to create the next prompt version.
 */
export type PromptPatch = {
  /** The mutation operation to perform. */
  operation: PatchOperation;
  /** Which prompt module this patch targets. */
  targetModule: keyof PromptModules;
  /** The token span to match in the current module content. Empty string for `inject`. */
  before: string;
  /** The replacement token span. Empty string for `remove`. */
  after: string;
  /** Human-readable explanation of why this patch is recommended. */
  reason: string;
};

// ─── PromptVersion ───────────────────────────────────────────────────────────

/**
 * A node in the prompt version DAG (directed acyclic graph).
 *
 * Each version captures the full prompt state plus the diff that produced it,
 * enabling time-travel debugging and branching prompt exploration.
 */
export type PromptVersion = {
  /** Unique version identifier (UUID v4). */
  id: string;
  /** Parent version ID; `undefined` for the initial version (root node). */
  parentId?: string;
  /** ISO-8601 timestamp of when this version was created. */
  timestamp: string;
  /** Human-readable description of the mutation intent that created this version. */
  mutationIntent: string;
  /** Ordered list of patches applied to the parent to produce this version. */
  diff: PromptPatch[];
  /** Complete prompt state at this version. */
  finalPrompt: FinalPromptIR;
};

// ═══════════════════════════════════════════════════════════════════════════════
// §4  Config Bridge Types
// ═══════════════════════════════════════════════════════════════════════════════
// Types consumed by config modules (nbp-rules, contradiction-graph,
// mutation-policy, reference-policy, ontology).

// ─── Realism & Imperfection Levels ───────────────────────────────────────────

/** Discrete realism level (1-5). Used to index deterministic token maps. */
export type RealismLevel = 1 | 2 | 3 | 4 | 5;

/** Discrete imperfection level (1-5). Used to index deterministic token maps. */
export type ImperfectionLevel = 1 | 2 | 3 | 4 | 5;

// ─── Locked Element Key ─────────────────────────────────────────────────────

/** String key for a lockable element (matches keys of {@link LockedElements}). */
export type LockedElement = keyof LockedElements;

// ─── Camera & Lighting Physics Specs ────────────────────────────────────────

/**
 * Physical camera specification used by the deterministic mapping layer.
 * One spec exists per {@link CameraStyle}.
 */
export type CameraPhysicsSpec = {
  /** Effective focal length string (e.g. "85mm", "26mm equiv"). */
  focalLength: string;
  /** Aperture f-stop string (e.g. "f/1.4"). */
  aperture: string;
  /** Sensor description (e.g. "full frame", "CCD sensor"). */
  sensor: string;
  /** Rendering characteristics unique to this camera system. */
  characteristics: readonly string[];
};

/**
 * Physical lighting specification used by the deterministic mapping layer.
 * One spec exists per {@link LightingStyle}.
 */
export type LightingPhysicsSpec = {
  /** Color temperature string (e.g. "3200K", "mixed 2700K-6500K"). */
  colorTemp: string;
  /** Light direction descriptor. */
  direction: string;
  /** Light quality descriptor. */
  quality: string;
  /** Visual characteristics unique to this lighting setup. */
  characteristics: readonly string[];
};

// ─── Scene Environment (Ontology) ───────────────────────────────────────────

/**
 * A pre-mapped scene environment from the ontology.
 * Contains physically-grounded data for a known location/setting.
 */
export type SceneEnvironment = {
  /** Light sources and qualities present in the environment. */
  lighting: readonly string[];
  /** Dominant materials and textures in the scene. */
  surfaces: readonly string[];
  /** Ambient atmospheric conditions. */
  atmosphere: readonly string[];
  /** What's happening at the edges / background of the frame. */
  edgeActivity: readonly string[];
  /** Camera style that best captures this scene. */
  typicalCamera: CameraStyle;
  /** Dominant emotional register of this environment. */
  typicalMood: string;
};

// ─── Contradiction Graph Types ──────────────────────────────────────────────

/** Category of a semantic conflict rule. */
export type ConflictCategory = 'physics' | 'camera' | 'style' | 'environment';

/** Resolution strategy for a detected conflict. */
export type ConflictResolution = 'reject' | 'downgrade' | 'clarify' | 'blend';

/**
 * A single rule in the contradiction graph defining an incompatible pair.
 */
export type ConflictRule = {
  /** Unique rule identifier. */
  id: string;
  /** Category of the conflict. */
  category: ConflictCategory;
  /** First condition label. */
  conditionA: string;
  /** Second condition label. */
  conditionB: string;
  /** How to resolve if both conditions are present. */
  resolution: ConflictResolution;
  /** Human-readable explanation of the contradiction. */
  message: string;
};

/**
 * A conflict that was detected during constraint resolution.
 */
export type DetectedConflict = {
  /** ID of the {@link ConflictRule} that triggered. */
  ruleId: string;
  /** Category of the conflict. */
  category: ConflictCategory;
  /** First condition that was present. */
  conditionA: string;
  /** Second condition that was present. */
  conditionB: string;
  /** Resolution strategy. */
  resolution: ConflictResolution;
  /** Human-readable explanation. */
  message: string;
};

// ─── Mutation Policy Types ──────────────────────────────────────────────────

/**
 * Edit intent identifier — the user's high-level editing action.
 */
export type EditIntent =
  | 'fix_face'
  | 'increase_realism'
  | 'reduce_ai_artifacts'
  | 'more_editorial'
  | 'more_candid'
  | 'more_cinematic'
  | 'change_only_lighting'
  | 'preserve_environment'
  | 'better_lighting';

/**
 * A fine-grained prompt module identifier used by the mutation policy.
 */
export type PromptModule =
  | 'face'
  | 'hair'
  | 'body'
  | 'outfit'
  | 'pose'
  | 'camera'
  | 'lighting'
  | 'mood'
  | 'color_grade'
  | 'environment'
  | 'realism'
  | 'imperfection'
  | 'negative'
  | 'subject';

/**
 * Defines what a mutation is allowed and forbidden to change.
 */
export type MutationPolicy = {
  /** Prompt modules the edit is explicitly allowed to modify. */
  allowed: readonly PromptModule[];
  /** Prompt modules the edit must never modify. */
  forbidden: readonly PromptModule[];
};

// ─── Reference Policy Types ─────────────────────────────────────────────────

/** Reference image role string used by the reference policy. */
export type ReferenceRole = ReferenceImageRole;

/**
 * A reference image with its role assignment.
 * Used by the reference policy to resolve trait conflicts.
 */
export type ReferenceImage = {
  /** Unique identifier. */
  id: string;
  /** Original filename. */
  filename: string;
  /** URL or local path. */
  url: string;
  /** MIME type. */
  mimeType: string;
  /** Width in pixels. */
  width: number;
  /** Height in pixels. */
  height: number;
  /** Role in identity anchoring. */
  role: ReferenceRole;
  /** Optional user notes. */
  notes?: string;
};

/**
 * A single entry in the reference priority policy.
 */
export type ReferencePriorityEntry = {
  /** The reference role that has authority. */
  role: ReferenceRole;
  /** Traits this role controls. */
  traits: readonly string[];
};

/**
 * The full reference priority policy definition.
 */
export type ReferencePriorityPolicy = {
  /** Ordered list of priority entries (earlier = higher precedence). */
  priorities: readonly ReferencePriorityEntry[];
};

/**
 * Result of resolving reference conflicts using the priority policy.
 */
export type MergedPriorityMap = {
  /** Maps each trait to the role that controls it. */
  traitToRole: Record<string, ReferenceRole>;
  /** References that are active and matched by the policy. */
  activeReferences: readonly ReferenceImage[];
};
