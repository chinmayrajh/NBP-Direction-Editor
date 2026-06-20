/**
 * @module config/mutation-policy
 * @description Edit Intent Rules for the NBP Director compiler.
 *
 * When a user requests a mutation (e.g., "fix face", "make it more cinematic"),
 * the compiler needs to know which prompt modules it is ALLOWED to change
 * and which it MUST NOT change. This prevents unintended drift across edits.
 *
 * Each EditIntent maps to a MutationPolicy with `allowed` and `forbidden` arrays.
 */

import type { EditIntent, MutationPolicy, PromptModule } from '../ir/types.js';

// ─────────────────────────────────────────────
// Mutation Policies
// ─────────────────────────────────────────────

/**
 * Mutation policies for each edit intent.
 *
 * - **allowed**: Prompt modules the pass MAY modify.
 * - **forbidden**: Prompt modules the pass MUST NOT touch.
 *
 * Any module not in either list is treated as "neutral" — it can
 * be modified if required by a dependent change, but should be
 * preserved if possible.
 *
 * @example
 * ```ts
 * import { MUTATION_POLICIES } from '../config/mutation-policy.js';
 *
 * const policy = MUTATION_POLICIES['fix_face'];
 * // policy.allowed => ['face', 'realism', 'imperfection']
 * // policy.forbidden => ['environment', 'outfit', 'pose', ...]
 * ```
 */
export const MUTATION_POLICIES: Record<EditIntent, MutationPolicy> = {
  fix_face: {
    allowed: ['face', 'realism', 'imperfection'],
    forbidden: [
      'environment',
      'outfit',
      'pose',
      'camera',
      'lighting',
      'mood',
      'color_grade',
      'hair',
      'body',
    ],
  },

  increase_realism: {
    allowed: ['realism', 'imperfection', 'face', 'body', 'lighting'],
    forbidden: [
      'environment',
      'outfit',
      'pose',
      'mood',
      'camera',
    ],
  },

  reduce_ai_artifacts: {
    allowed: ['realism', 'imperfection', 'negative', 'face'],
    forbidden: [
      'environment',
      'outfit',
      'pose',
      'camera',
      'lighting',
      'mood',
      'color_grade',
      'hair',
      'body',
    ],
  },

  more_editorial: {
    allowed: ['camera', 'lighting', 'mood', 'color_grade', 'pose'],
    forbidden: [
      'face',
      'hair',
      'body',
      'environment',
    ],
  },

  more_candid: {
    allowed: ['camera', 'lighting', 'mood', 'pose', 'imperfection'],
    forbidden: [
      'face',
      'hair',
      'body',
      'outfit',
    ],
  },

  more_cinematic: {
    allowed: ['camera', 'lighting', 'mood', 'color_grade', 'environment'],
    forbidden: [
      'face',
      'hair',
      'body',
      'outfit',
      'pose',
    ],
  },

  change_only_lighting: {
    allowed: ['lighting', 'color_grade', 'mood'],
    forbidden: [
      'face',
      'hair',
      'body',
      'outfit',
      'pose',
      'camera',
      'environment',
      'subject',
      'realism',
      'imperfection',
    ],
  },

  preserve_environment: {
    allowed: ['face', 'hair', 'body', 'outfit', 'pose', 'realism', 'imperfection'],
    forbidden: [
      'environment',
      'lighting',
      'camera',
      'mood',
      'color_grade',
    ],
  },

  better_lighting: {
    allowed: ['lighting', 'color_grade', 'mood', 'realism'],
    forbidden: [
      'face',
      'hair',
      'body',
      'outfit',
      'pose',
      'camera',
      'environment',
      'subject',
    ],
  },
} as const;

// ─────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────

/**
 * Checks if a prompt module is allowed to be modified under a given edit intent.
 *
 * @param intent - The edit intent to check against.
 * @param module - The prompt module to test.
 * @returns `true` if the module is explicitly allowed.
 */
export function isModuleAllowed(intent: EditIntent, module: PromptModule): boolean {
  const policy = MUTATION_POLICIES[intent];
  return policy.allowed.includes(module);
}

/**
 * Checks if a prompt module is forbidden from modification under a given edit intent.
 *
 * @param intent - The edit intent to check against.
 * @param module - The prompt module to test.
 * @returns `true` if the module is explicitly forbidden.
 */
export function isModuleForbidden(intent: EditIntent, module: PromptModule): boolean {
  const policy = MUTATION_POLICIES[intent];
  return policy.forbidden.includes(module);
}

/**
 * Returns the full mutation policy for a given edit intent.
 *
 * @param intent - The edit intent.
 * @returns The MutationPolicy specifying allowed and forbidden modules.
 */
export function getMutationPolicy(intent: EditIntent): MutationPolicy {
  return MUTATION_POLICIES[intent];
}
