/**
 * @module config/reference-policy
 * @description Reference Priority Policy for the NBP Director compiler.
 *
 * When multiple reference images are provided (face anchor, hair reference,
 * body reference, style reference), their traits can overlap. This module
 * defines which reference role takes precedence for each trait category,
 * and provides a conflict resolution function that produces a merged
 * priority map.
 */

import type {
  ReferenceRole,
  ReferenceImage,
  ReferencePriorityEntry,
  ReferencePriorityPolicy,
  MergedPriorityMap,
} from '../ir/types.js';

// ─────────────────────────────────────────────
// Priority Policy
// ─────────────────────────────────────────────

/**
 * Defines which reference role has authority over which traits.
 *
 * When two reference images both claim a trait (e.g., both
 * face_anchor and hair_reference define hair color), the role
 * listed here wins for that trait.
 *
 * @remarks
 * - `face_anchor` wins for all facial geometry traits.
 * - `hair_reference` wins for hair traits (overrides face_anchor hair).
 * - `body_reference` wins for body proportion and pose traits.
 * - `style_reference` wins for mood, lighting feel, and color grading.
 */
export const REFERENCE_PRIORITY_POLICY: ReferencePriorityPolicy = {
  priorities: [
    {
      role: 'face_anchor',
      traits: [
        'face_geometry',
        'eye_spacing',
        'jawline',
        'nose',
        'lips',
        'skin_tone',
        'facial_symmetry',
        'inter_pupillary_distance',
        'nose_bridge_width',
        'lip_proportions',
        'forehead_shape',
        'cheekbone_position',
      ],
    },
    {
      role: 'hair_reference',
      traits: [
        'hair_color',
        'hair_style',
        'hair_texture',
        'hair_volume',
        'hair_length',
        'hairline_position',
        'hair_highlights',
        'hair_parting',
      ],
    },
    {
      role: 'body_reference',
      traits: [
        'body_proportions',
        'pose_style',
        'body_type',
        'height_impression',
        'shoulder_width',
        'posture',
        'weight_distribution',
        'limb_angles',
      ],
    },
    {
      role: 'style_reference',
      traits: [
        'mood',
        'lighting_feel',
        'color_grading',
        'overall_tone',
        'color_palette',
        'contrast_style',
        'grain_level',
        'saturation_feel',
      ],
    },
  ],
} as const;

// ─────────────────────────────────────────────
// Internals
// ─────────────────────────────────────────────

/**
 * Builds a lookup map from trait name to the role that owns it.
 *
 * @param policy - The reference priority policy.
 * @returns Record mapping each trait to its authoritative ReferenceRole.
 */
function buildTraitToRoleMap(
  policy: ReferencePriorityPolicy,
): Record<string, ReferenceRole> {
  const map: Record<string, ReferenceRole> = {};

  for (const entry of policy.priorities) {
    for (const trait of entry.traits) {
      // Later entries do NOT override earlier ones; first declaration wins.
      // This means face_anchor traits take precedence if duplicated.
      if (!(trait in map)) {
        map[trait] = entry.role;
      }
    }
  }

  return map;
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Resolves reference conflicts by applying the priority policy.
 *
 * Given a set of reference images, this function:
 * 1. Builds a trait → role mapping from the policy.
 * 2. Filters to only roles that have an actual reference image.
 * 3. Returns a merged priority map indicating which reference
 *    image controls which traits.
 *
 * @param references - Array of reference images with assigned roles.
 * @returns A merged priority map with trait ownership and active references.
 *
 * @example
 * ```ts
 * import { resolveReferenceConflicts } from '../config/reference-policy.js';
 *
 * const merged = resolveReferenceConflicts(myReferences);
 * // merged.traitToRole['hair_color'] => 'hair_reference'
 * ```
 */
export function resolveReferenceConflicts(
  references: readonly ReferenceImage[],
): MergedPriorityMap {
  const traitToRole = buildTraitToRoleMap(REFERENCE_PRIORITY_POLICY);

  // Determine which roles are actually present in the provided references
  const activeRoles = new Set<ReferenceRole>(
    references.map((ref) => ref.role),
  );

  // Filter trait map to only include roles that have active references
  const filteredTraitToRole: Record<string, ReferenceRole> = {};
  for (const [trait, role] of Object.entries(traitToRole)) {
    if (activeRoles.has(role)) {
      filteredTraitToRole[trait] = role;
    }
  }

  // Collect only references whose roles appear in the policy
  const policyRoles = new Set<ReferenceRole>(
    REFERENCE_PRIORITY_POLICY.priorities.map((p) => p.role),
  );
  const activeReferences = references.filter((ref) =>
    policyRoles.has(ref.role),
  );

  return {
    traitToRole: filteredTraitToRole,
    activeReferences,
  };
}
