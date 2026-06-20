/**
 * @module config/contradiction-graph
 * @description Semantic Conflict Resolution for the NBP Director compiler.
 *
 * Contains a graph of contradiction rules that detect physically impossible,
 * aesthetically incompatible, or logically conflicting prompt combinations.
 * The `detectContradictions` function walks the graph against a given IntentIR
 * and returns all detected conflicts with their resolution strategies.
 */

import type {
  IntentIR,
  ConflictRule,
  DetectedConflict,
  ConflictCategory,
  ConflictResolution,
} from '../ir/types.js';

// ─────────────────────────────────────────────
// Helper — Rule Builder
// ─────────────────────────────────────────────

let _ruleCounter = 0;

/**
 * Creates a ConflictRule with an auto-generated ID.
 * @param category - The conflict category (physics, camera, style, environment).
 * @param conditionA - First condition label.
 * @param conditionB - Second condition label.
 * @param resolution - Resolution strategy (reject, downgrade, clarify).
 * @param message - Human-readable explanation.
 * @returns A fully formed ConflictRule.
 */
function rule(
  category: ConflictCategory,
  conditionA: string,
  conditionB: string,
  resolution: ConflictResolution,
  message: string,
): ConflictRule {
  return {
    id: `CONFLICT_${String(++_ruleCounter).padStart(3, '0')}`,
    category,
    conditionA,
    conditionB,
    resolution,
    message,
  };
}

// ─────────────────────────────────────────────
// Contradiction Rules
// ─────────────────────────────────────────────

/**
 * Complete set of contradiction rules for the NBP Director.
 *
 * Each rule defines a pair of conditions that are semantically
 * incompatible, along with a resolution strategy:
 *
 * - **reject**: The combination is physically impossible. Fail the pass.
 * - **downgrade**: The combination is suboptimal. Automatically adjust.
 * - **clarify**: The combination is ambiguous. Ask the user for clarification.
 */
export const CONTRADICTION_RULES: readonly ConflictRule[] = [
  // ── Physics Conflicts ──────────────────────
  rule(
    'physics',
    'golden_hour',
    'studio',
    'downgrade',
    'Golden hour is an outdoor natural light condition; it cannot coexist with controlled studio lighting. Downgrading studio to warm-toned key light.',
  ),
  rule(
    'physics',
    'rain',
    'harsh_desert_sun',
    'reject',
    'Rain and harsh desert sun are mutually exclusive weather conditions.',
  ),
  rule(
    'physics',
    'overcast',
    'hard_shadows',
    'reject',
    'Overcast skies produce extremely soft, diffused light — hard shadows are physically impossible.',
  ),
  rule(
    'physics',
    'fog',
    'crystal_clear_visibility',
    'reject',
    'Fog and crystal-clear visibility are contradictory atmospheric conditions.',
  ),
  rule(
    'physics',
    'underwater',
    'dust_particles',
    'reject',
    'Dust particles do not exist underwater; use suspended sediment instead.',
  ),
  rule(
    'physics',
    'night',
    'harsh_direct_sunlight',
    'reject',
    'Direct sunlight and nighttime are mutually exclusive time-of-day conditions.',
  ),

  // ── Camera Conflicts ───────────────────────
  rule(
    'camera',
    '85mm_portrait',
    'wide_environmental_framing',
    'downgrade',
    '85mm portrait lens compresses perspective and isolates subjects; it cannot simultaneously produce wide environmental framing. Downgrading to 50mm.',
  ),
  rule(
    'camera',
    'retro_ccd',
    'ultra_clean_luxury_editorial',
    'downgrade',
    'CCD sensors produce limited dynamic range and warm cast; they cannot achieve ultra-clean luxury editorial rendering. Downgrading editorial crispness.',
  ),
  rule(
    'camera',
    'iphone',
    'shallow_depth_of_field',
    'reject',
    'iPhone small sensors produce deep depth of field; optical shallow DOF is not achievable without computational simulation.',
  ),
  rule(
    'camera',
    'iphone',
    'anamorphic_bokeh',
    'reject',
    'iPhone sensors cannot produce anamorphic bokeh characteristics.',
  ),
  rule(
    'camera',
    '35mm_street',
    'extreme_subject_isolation',
    'downgrade',
    '35mm at f/2.8 cannot achieve extreme subject isolation typical of medium format. Downgrading isolation strength.',
  ),

  // ── Style Conflicts ────────────────────────
  rule(
    'style',
    'retro_ccd',
    'luxury_editorial',
    'reject',
    'CCD retro aesthetic and luxury editorial are fundamentally incompatible visual styles.',
  ),
  rule(
    'style',
    'ugc_realism',
    'cinematic_upgrade',
    'downgrade',
    'UGC realism emphasizes casual, unpolished aesthetics; cinematic upgrade adds polish. Downgrading cinematic elements to maintain UGC feel.',
  ),
  rule(
    'style',
    'forensic_realism',
    'stylized_smooth_skin',
    'reject',
    'Forensic realism (level 5) demands micro-pore detail; stylized smooth skin erases it entirely.',
  ),
  rule(
    'style',
    'vintage_film',
    'digital_perfection',
    'reject',
    'Vintage film grain and digital perfection are aesthetically contradictory.',
  ),
  rule(
    'style',
    'documentary_gritty',
    'beauty_retouched',
    'downgrade',
    'Documentary grit and beauty retouching conflict. Downgrading retouching to maintain documentary feel.',
  ),

  // ── Environment Conflicts ──────────────────
  rule(
    'environment',
    'rain',
    'dust_particles',
    'reject',
    'Rain and dust particles cannot coexist — rain suppresses airborne particulates.',
  ),
  rule(
    'environment',
    'indoor_cafe',
    'outdoor_street',
    'clarify',
    'Indoor café and outdoor street are ambiguous — did you mean a café with street-facing windows, a sidewalk café, or separate scenes?',
  ),
  rule(
    'environment',
    'snow',
    'tropical_beach',
    'reject',
    'Snow and tropical beach are mutually exclusive biome conditions.',
  ),
  rule(
    'environment',
    'dense_forest',
    'open_desert',
    'reject',
    'Dense forest and open desert are contradictory terrains.',
  ),
  rule(
    'environment',
    'underwater',
    'mountaintop',
    'reject',
    'Underwater and mountaintop are mutually exclusive environments.',
  ),
];

// ─────────────────────────────────────────────
// Condition Matchers
// ─────────────────────────────────────────────

/**
 * Extracts all active "condition tags" from an IntentIR.
 * These tags are compared against ConflictRule conditions.
 *
 * @param ir - The intent IR to extract conditions from.
 * @returns A set of lowercase condition strings present in the IR.
 */
function extractConditionTags(ir: IntentIR): Set<string> {
  const tags = new Set<string>();

  // Camera style
  tags.add(ir.cameraStyle);

  // Lighting style
  tags.add(ir.lightingStyle);

  // Edit mode
  tags.add(ir.editMode);

  // Mood
  tags.add(ir.mood);

  // Realism level derived conditions
  if (ir.realismLevel >= 5) {
    tags.add('forensic_realism');
  }
  if (ir.realismLevel <= 1) {
    tags.add('stylized_smooth_skin');
  }

  // Scan scene description for condition keywords
  const sceneTokens = ir.scene.toLowerCase();

  // Weather / atmosphere
  if (sceneTokens.includes('rain')) tags.add('rain');
  if (sceneTokens.includes('fog')) tags.add('fog');
  if (sceneTokens.includes('snow')) tags.add('snow');
  if (sceneTokens.includes('dust')) tags.add('dust_particles');
  if (sceneTokens.includes('overcast')) tags.add('overcast');
  if (sceneTokens.includes('underwater')) tags.add('underwater');

  // Sun conditions
  if (sceneTokens.includes('harsh') && sceneTokens.includes('sun')) tags.add('harsh_desert_sun');
  if (sceneTokens.includes('harsh') && sceneTokens.includes('direct') && sceneTokens.includes('sun')) tags.add('harsh_direct_sunlight');

  // Time of day
  if (sceneTokens.includes('night') && !sceneTokens.includes('neon')) tags.add('night');

  // Environments
  if (sceneTokens.includes('indoor') && sceneTokens.includes('cafe')) tags.add('indoor_cafe');
  if (sceneTokens.includes('outdoor') && sceneTokens.includes('street')) tags.add('outdoor_street');
  if (sceneTokens.includes('tropical') && sceneTokens.includes('beach')) tags.add('tropical_beach');
  if (sceneTokens.includes('desert')) tags.add('open_desert');
  if (sceneTokens.includes('dense') && sceneTokens.includes('forest')) tags.add('dense_forest');
  if (sceneTokens.includes('mountaintop')) tags.add('mountaintop');

  // Camera / style tokens in scene
  if (sceneTokens.includes('wide') && sceneTokens.includes('environmental')) tags.add('wide_environmental_framing');
  if (sceneTokens.includes('shallow') && sceneTokens.includes('depth')) tags.add('shallow_depth_of_field');
  if (sceneTokens.includes('anamorphic') && sceneTokens.includes('bokeh')) tags.add('anamorphic_bokeh');
  if (sceneTokens.includes('extreme') && sceneTokens.includes('isolation')) tags.add('extreme_subject_isolation');
  if (sceneTokens.includes('ultra') && sceneTokens.includes('clean')) tags.add('ultra_clean_luxury_editorial');
  if (sceneTokens.includes('hard') && sceneTokens.includes('shadow')) tags.add('hard_shadows');
  if (sceneTokens.includes('crystal') && sceneTokens.includes('clear')) tags.add('crystal_clear_visibility');

  // Style tokens
  if (ir.editMode === 'ugc_realism') tags.add('ugc_realism');
  if (ir.editMode === 'cinematic_upgrade') tags.add('cinematic_upgrade');
  if (sceneTokens.includes('vintage') && sceneTokens.includes('film')) tags.add('vintage_film');
  if (sceneTokens.includes('digital') && sceneTokens.includes('perfection')) tags.add('digital_perfection');
  if (sceneTokens.includes('documentary') && sceneTokens.includes('grit')) tags.add('documentary_gritty');
  if (sceneTokens.includes('beauty') && sceneTokens.includes('retouch')) tags.add('beauty_retouched');

  return tags;
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Detects semantic contradictions in the given IntentIR by
 * checking all registered conflict rules.
 *
 * @param intentIR - The compiled intent IR to analyze.
 * @returns An array of detected conflicts with resolution strategies.
 *
 * @example
 * ```ts
 * import { detectContradictions } from '../config/contradiction-graph.js';
 *
 * const conflicts = detectContradictions(myIR);
 * for (const c of conflicts) {
 *   if (c.resolution === 'reject') throw new Error(c.message);
 * }
 * ```
 */
export function detectContradictions(intentIR: IntentIR): DetectedConflict[] {
  const tags = extractConditionTags(intentIR);
  const detected: DetectedConflict[] = [];

  for (const conflictRule of CONTRADICTION_RULES) {
    const aPresent = tags.has(conflictRule.conditionA);
    const bPresent = tags.has(conflictRule.conditionB);

    if (aPresent && bPresent) {
      detected.push({
        ruleId: conflictRule.id,
        category: conflictRule.category,
        conditionA: conflictRule.conditionA,
        conditionB: conflictRule.conditionB,
        resolution: conflictRule.resolution,
        message: conflictRule.message,
      });
    }
  }

  return detected;
}
