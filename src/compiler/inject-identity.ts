/**
 * @module compiler/inject-identity
 * @description **Pass 3 — Inject Identity.**
 *
 * Builds the identity-preservation layer from locked elements and (in V2)
 * reference images. For V1 this is a deterministic stub that creates
 * tiered identity anchors from the locked-element flags.
 *
 * Identity anchors are organized into three tiers:
 * - **Tier 1 (immutable)**: Face geometry — eye spacing, jawline, nose bridge, etc.
 * - **Tier 2 (semi-stable)**: Hairstyle, hair texture, eyebrow grooming, skin texture.
 * - **Tier 3 (volatile)**: Lighting-dependent appearance, expression, makeup, clothing, pose.
 *
 * This is a **pure function** — no side effects, no LLM calls.
 */

import type {
  IntentIR,
  ConstraintIR,
  IdentityIR,
  IdentityAnchor,
  ReferenceImageRole,
} from '../ir/types.js';

// ─────────────────────────────────────────────
// Tier Definitions
// ─────────────────────────────────────────────

/**
 * Tier 1 face-geometry traits with their default stub values.
 *
 * In V2 these values will be extracted from reference images
 * via Gemini Vision. For now they are descriptive placeholders.
 */
const TIER_1_TRAITS: ReadonlyArray<{ trait: string; value: string; weight: number }> = [
  { trait: 'face_geometry', value: 'preserved from reference', weight: 0.95 },
  { trait: 'eye_spacing', value: 'maintained inter-pupillary distance', weight: 0.90 },
  { trait: 'jawline', value: 'preserved jawline contour and angle', weight: 0.90 },
  { trait: 'nose_bridge', value: 'maintained nose bridge width and profile', weight: 0.88 },
  { trait: 'lip_structure', value: 'preserved lip proportions and shape', weight: 0.85 },
  { trait: 'hairline', value: 'maintained hairline position and shape', weight: 0.82 },
  { trait: 'skin_undertone', value: 'preserved skin undertone and warmth', weight: 0.80 },
] as const;

/**
 * Tier 2 semi-stable traits.
 *
 * These may change across wardrobe_swap or styling edits
 * but are preserved in preserve_enhance and lighting_edit modes.
 */
const TIER_2_TRAITS: ReadonlyArray<{ trait: string; value: string; weight: number }> = [
  { trait: 'hairstyle', value: 'current hairstyle preserved', weight: 0.75 },
  { trait: 'hair_texture', value: 'natural hair texture maintained', weight: 0.70 },
  { trait: 'eyebrow_grooming', value: 'eyebrow shape and grooming preserved', weight: 0.65 },
  { trait: 'skin_texture', value: 'natural skin texture with pores', weight: 0.60 },
] as const;

/**
 * Tier 3 volatile traits that the compiler may freely alter.
 * These are lighting-dependent and change with every shot.
 */
const TIER_3_VOLATILE_TRAITS: readonly string[] = [
  'lighting_reflectance',
  'expression',
  'makeup_state',
  'clothing',
  'pose_angle',
  'perspiration',
  'blush_state',
  'eye_moisture',
] as const;

// ─────────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────────

/**
 * Builds Tier 1 identity anchors.
 *
 * If the face is locked, all Tier 1 anchors are returned at full weight.
 * If the face is unlocked, weights are halved to signal lower confidence.
 *
 * @param faceLocked - Whether the face is locked.
 * @returns Array of Tier 1 identity anchors.
 */
function buildTier1Anchors(faceLocked: boolean): IdentityAnchor[] {
  // TODO: [V2] Replace stub values with Gemini Vision face-geometry extraction.
  // The vision model should return normalized measurements for each trait,
  // e.g. eye_spacing = "0.32 face-widths", jawline = "angular, 118 deg gonial angle".
  return TIER_1_TRAITS.map((t) => ({
    trait: t.trait,
    value: t.value,
    weight: faceLocked ? t.weight : t.weight * 0.5,
    tier: 1 as const,
  }));
}

/**
 * Builds Tier 2 identity anchors.
 *
 * Hair-related anchors are included at full weight only if hair is locked.
 * Skin texture is included if face is locked.
 *
 * @param faceLocked - Whether the face is locked.
 * @param hairLocked - Whether the hair is locked.
 * @returns Array of Tier 2 identity anchors.
 */
function buildTier2Anchors(
  faceLocked: boolean,
  hairLocked: boolean,
): IdentityAnchor[] {
  // TODO: [V2] Replace stub values with Gemini Vision hair/skin analysis.
  // The vision model should extract hairstyle descriptors, texture classification,
  // and skin-texture characteristics from reference images.
  return TIER_2_TRAITS.map((t) => {
    const isHairTrait = t.trait.startsWith('hair') || t.trait === 'eyebrow_grooming';
    const isSkinTrait = t.trait === 'skin_texture';

    let weight = t.weight;
    if (isHairTrait && !hairLocked) {
      weight *= 0.4;
    }
    if (isSkinTrait && !faceLocked) {
      weight *= 0.5;
    }

    return {
      trait: t.trait,
      value: t.value,
      weight,
      tier: 2 as const,
    };
  });
}

/**
 * Computes the overall identity confidence score.
 *
 * Base confidence is 0.85 when face is locked. If face is unlocked,
 * confidence drops significantly since identity preservation becomes
 * best-effort.
 *
 * @param faceLocked - Whether the face is locked.
 * @param hairLocked - Whether the hair is locked.
 * @returns Confidence score in range 0.0-1.0.
 */
function computeIdentityConfidence(
  faceLocked: boolean,
  hairLocked: boolean,
): number {
  let confidence = 0.85;

  if (!faceLocked) {
    confidence -= 0.35;
  }
  if (!hairLocked) {
    confidence -= 0.10;
  }

  return Math.max(0.1, Math.min(1.0, confidence));
}

/**
 * Builds a prose biology summary from the tier anchors.
 *
 * This summary serves as a fallback prose anchor when structured
 * tokens are exhausted during token budgeting.
 *
 * @param tier1 - Tier 1 anchors.
 * @param tier2 - Tier 2 anchors.
 * @returns Human-readable biology summary string.
 */
function buildBiologySummary(
  tier1: IdentityAnchor[],
  tier2: IdentityAnchor[],
): string {
  // TODO: [V2] Generate this summary from Gemini Vision analysis of reference images.
  // For now, build a generic summary from the anchor traits.
  const tier1Desc = tier1
    .filter((a) => a.weight > 0.5)
    .map((a) => a.value)
    .join(', ');
  const tier2Desc = tier2
    .filter((a) => a.weight > 0.4)
    .map((a) => a.value)
    .join(', ');

  return `Subject identity: ${tier1Desc}. Semi-stable features: ${tier2Desc}.`;
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * **Pass 3 — Inject Identity.**
 *
 * Builds the identity-preservation layer by creating tiered identity
 * anchors from the user's locked elements and (in V2) reference images.
 *
 * For V1, this is a deterministic stub that produces a structurally
 * complete {@link IdentityIR} without actual vision-model analysis.
 *
 * @param intent - The IntentIR from Pass 1.
 * @param constraint - The ConstraintIR from Pass 2 (used for immutable-token awareness).
 * @returns A structured IdentityIR with tiered anchors.
 *
 * @example
 * ```ts
 * import { injectIdentity } from '../compiler/inject-identity.js';
 *
 * const identity = injectIdentity(intent, constraints);
 * // identity.tier1Anchors contains face geometry anchors
 * ```
 */
export function injectIdentity(
  intent: IntentIR,
  constraint: ConstraintIR,
): IdentityIR {
  const { face, hair } = intent.lockedElements;

  // ── Create Mode: suppress identity tokens entirely ──────────────────────
  // When creating a new photo from scratch (new_scene with no face lock),
  // there is no identity to preserve. Emit empty anchors so that
  // inject-realism produces an empty identityLock module string.
  if (intent.editMode === 'new_scene' && !face) {
    return {
      tier1Anchors: [],
      tier2Anchors: [],
      tier3Traits: [...TIER_3_VOLATILE_TRAITS],
      referenceRoles: [],
      identityConfidence: 0,
      biologySummary: '',
    };
  }

  // TODO: [V2] Integrate Gemini Vision for reference-image analysis:
  // 1. Send reference images to Gemini Vision API.
  // 2. Extract face geometry measurements (IPD, gonial angle, nose width, etc.).
  // 3. Classify hair texture, style, color from hair_reference images.
  // 4. Build skin-tone profile from body_reference images.
  // 5. Populate anchor values with real measurements instead of stubs.

  // 1. Build tiered anchors
  const tier1Anchors = buildTier1Anchors(face);
  const tier2Anchors = buildTier2Anchors(face, hair);

  // 2. Tier 3 is always the volatile trait list
  const tier3Traits = [...TIER_3_VOLATILE_TRAITS];

  // 3. Derive reference roles from locked elements (stub)
  const referenceRoles: ReferenceImageRole[] = [];
  if (face) referenceRoles.push('face_anchor');
  if (hair) referenceRoles.push('hair_reference');

  // 4. Compute identity confidence
  const identityConfidence = computeIdentityConfidence(face, hair);

  // 5. Build biology summary
  const biologySummary = buildBiologySummary(tier1Anchors, tier2Anchors);

  // Note: constraint.immutable is used implicitly — any immutable tokens
  // already cover identity-lock phrases. The identity IR provides the
  // structured version that downstream passes can reason about.
  void constraint;

  return {
    tier1Anchors,
    tier2Anchors,
    tier3Traits,
    referenceRoles,
    identityConfidence,
    biologySummary,
  };
}
