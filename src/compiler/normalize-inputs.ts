/**
 * @module compiler/normalize-inputs
 * @description **Pass 1 — Normalize Inputs.**
 *
 * Reads raw {@link DirectorInputs} from the project layer and normalizes them
 * into a fully typed {@link IntentIR}. This pass:
 *
 * 1. Strips banned words from the scene description using {@link NBP_RULES.bannedWords}.
 * 2. Extracts ordered creative priorities from the edit mode.
 * 3. Sets sensible defaults for any missing optional values.
 * 4. Clamps numeric dials (realism, imperfection) to the valid 1-5 range.
 *
 * This is a **pure function** — no side effects, no LLM calls.
 */

import type { DirectorInputs } from '../ir/project.js';
import type {
  IntentIR,
  EditMode,
  LockedElements,
} from '../ir/types.js';
import { NBP_RULES } from '../config/nbp-rules.js';

// ─────────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────────

/**
 * Clamps a number to the integer range [min, max].
 *
 * @param value - The value to clamp.
 * @param min - The minimum bound (inclusive).
 * @param max - The maximum bound (inclusive).
 * @returns The clamped integer value.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * Strips all banned words from a scene description string.
 * Matching is case-insensitive; whole-word boundaries are respected.
 *
 * @param scene - Raw scene text.
 * @param bannedWords - List of banned words/phrases to remove.
 * @returns Cleaned scene text with banned words excised.
 */
function stripBannedWords(
  scene: string,
  bannedWords: readonly string[],
): string {
  let cleaned = scene;
  for (const word of bannedWords) {
    // Escape regex special characters in the banned word/phrase
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }
  // Collapse multiple spaces and trim
  return cleaned.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Derives ordered creative priorities from the edit mode.
 *
 * Each edit mode implies a different ranking of what matters most
 * to the user. These priorities guide downstream passes when they
 * must make trade-off decisions.
 *
 * @param editMode - The selected edit mode.
 * @param userPriorities - Any explicit user-supplied priorities.
 * @returns Merged, de-duplicated priority list (user priorities first).
 */
function derivePriorities(
  editMode: EditMode,
  userPriorities: string[],
): string[] {
  const modePriorities: Record<EditMode, string[]> = {
    preserve_enhance: ['identity', 'realism', 'lighting', 'composition'],
    new_scene: ['scene', 'composition', 'lighting', 'identity'],
    wardrobe_swap: ['wardrobe', 'identity', 'realism', 'composition'],
    lighting_edit: ['lighting', 'identity', 'atmosphere', 'realism'],
    editorial_upgrade: ['composition', 'lighting', 'wardrobe', 'identity'],
    cinematic_upgrade: ['atmosphere', 'lighting', 'composition', 'camera'],
    ugc_realism: ['imperfection', 'realism', 'identity', 'pose'],
  };

  const defaults = modePriorities[editMode] ?? modePriorities.preserve_enhance;

  // User priorities come first, then fill in from mode defaults
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const p of [...userPriorities, ...defaults]) {
    const normalized = p.toLowerCase().trim();
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      merged.push(normalized);
    }
  }
  return merged;
}

/**
 * Derives the default locked elements based on the edit mode.
 *
 * Different edit modes imply different locking semantics:
 * - `preserve_enhance`: lock everything except what explicitly changes.
 * - `new_scene`: unlock environment, keep face locked.
 * - `wardrobe_swap`: unlock outfit, lock everything else.
 * - etc.
 *
 * @param editMode - The selected edit mode.
 * @returns Default locked-elements flags.
 */
export function deriveLockedElements(editMode: EditMode): LockedElements {
  const defaults: Record<EditMode, LockedElements> = {
    preserve_enhance: {
      face: true,
      hair: true,
      pose: true,
      lighting: true,
      outfit: true,
      environment: true,
    },
    new_scene: {
      face: false,
      hair: false,
      pose: false,
      lighting: false,
      outfit: false,
      environment: false,
    },
    wardrobe_swap: {
      face: true,
      hair: true,
      pose: true,
      lighting: true,
      outfit: false,
      environment: true,
    },
    lighting_edit: {
      face: true,
      hair: true,
      pose: true,
      lighting: false,
      outfit: true,
      environment: true,
    },
    editorial_upgrade: {
      face: true,
      hair: true,
      pose: false,
      lighting: false,
      outfit: false,
      environment: false,
    },
    cinematic_upgrade: {
      face: true,
      hair: true,
      pose: false,
      lighting: false,
      outfit: true,
      environment: false,
    },
    ugc_realism: {
      face: true,
      hair: true,
      pose: true,
      lighting: false,
      outfit: true,
      environment: true,
    },
  };

  return defaults[editMode] ?? defaults.preserve_enhance;
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * **Pass 1 — Normalize Inputs.**
 *
 * Transforms raw {@link DirectorInputs} into a canonical {@link IntentIR}
 * by normalizing text, extracting priorities, stripping banned words,
 * and setting defaults for missing values.
 *
 * @param inputs - Raw user-provided inputs from the project layer.
 * @returns A fully typed, validated IntentIR.
 *
 * @example
 * ```ts
 * import { normalizeInputs } from '../compiler/normalize-inputs.js';
 *
 * const intent = normalizeInputs(project.inputs);
 * // intent.scene is cleaned, intent.priorities are ordered
 * ```
 */
export function normalizeInputs(inputs: DirectorInputs): IntentIR {
  // 1. Clean scene text — strip banned words
  const cleanedScene = stripBannedWords(
    inputs.coreScene.trim(),
    NBP_RULES.bannedWords,
  );

  // 2. Clamp numeric dials to valid 1-5 range
  const realismLevel = clamp(inputs.realismLevel ?? 3, 1, 5);
  const imperfectionLevel = clamp(inputs.imperfectionLevel ?? 2, 1, 5);

  // 3. Derive locked elements from edit mode, merge user overrides
  const modeDefaults = deriveLockedElements(inputs.editMode);
  const lockedElements: LockedElements = {
    ...modeDefaults,
    ...inputs.lockedElementOverrides,
  };

  // 4. Derive and merge priorities
  const priorities = derivePriorities(
    inputs.editMode,
    inputs.priorities ?? [],
  );

  // 5. Assemble the IntentIR
  return {
    scene: cleanedScene || 'portrait photograph',
    editMode: inputs.editMode,
    priorities,
    lockedElements,
    realismLevel,
    imperfectionLevel,
    cameraStyle: inputs.cameraStyle ?? '85mm_portrait',
    lightingStyle: inputs.lightingStyle ?? 'window_light',
    mood: inputs.mood ?? 'confident',
    wardrobe: inputs.wardrobe,
    negativeConstraints: inputs.negativeConstraints?.trim() ?? '',
  };
}
