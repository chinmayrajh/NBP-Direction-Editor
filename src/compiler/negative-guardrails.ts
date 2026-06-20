/**
 * @module compiler/negative-guardrails
 * @description Pass 7 — Negative Guardrails.
 *
 * Scans all positive prompt modules for banned words (from NBP_RULES)
 * and removes any found. Adds edit-mode–specific negative tokens:
 * - `ugc_realism`       → anti-polish tokens
 * - `cinematic_upgrade` → anti-flat tokens
 *
 * Ensures no duplicate entries exist in the negativePrompt array.
 *
 * This is a pure function: the input modules are cloned, never mutated.
 */

import type { PromptModules, IntentIR } from '../ir/types.js';
import { NBP_RULES } from '../config/nbp-rules.js';

// ─────────────────────────────────────────────
// Mode-Specific Negative Tokens
// ─────────────────────────────────────────────

/** Negative tokens for UGC-realism mode — suppress overly polished aesthetics. */
const UGC_REALISM_NEGATIVES: readonly string[] = [
  'overly polished',
  'studio perfection',
  'magazine retouching',
  'professional color grading',
  'flawless skin',
  'perfect symmetry',
] as const;

/** Negative tokens for cinematic-upgrade mode — suppress flat composition. */
const CINEMATIC_UPGRADE_NEGATIVES: readonly string[] = [
  'flat composition',
  'amateur framing',
  'harsh on-camera flash',
  'snapshot aesthetic',
  'flat lighting',
  'centered subject without intention',
] as const;

// ─────────────────────────────────────────────
// Positive Module Keys
// ─────────────────────────────────────────────

/**
 * The keys of PromptModules that contain positive prompt content
 * (everything except negativePrompt).
 */
const POSITIVE_MODULE_KEYS: readonly (keyof PromptModules)[] = [
  'identityLock',
  'cameraSystem',
  'lightingSystem',
  'wardrobePhysics',
  'poseChoreography',
  'edgeActivity',
  'atmosphere',
  'realismTokens',
  'imperfectionTokens',
] as const;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Removes all occurrences of banned words from a text string.
 * Uses case-insensitive whole-word matching to avoid partial matches.
 *
 * @param text - The source text to clean.
 * @param bannedWords - Array of banned word/phrase strings.
 * @returns The cleaned text with banned words removed.
 */
function removeBannedWords(
  text: string,
  bannedWords: readonly string[],
): string {
  let cleaned = text;

  for (const banned of bannedWords) {
    // Escape regex special characters in the banned word
    const escaped = banned.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match case-insensitively, as whole word or phrase,
    // handling surrounding commas and extra whitespace
    const pattern = new RegExp(
      `(?:,\\s*)?\\b${escaped}\\b(?:\\s*,)?`,
      'gi',
    );
    cleaned = cleaned.replace(pattern, '');
  }

  // Clean up residual artifacts: multiple commas, leading/trailing commas
  cleaned = cleaned
    .replace(/,\s*,/g, ',')
    .replace(/^\s*,\s*/, '')
    .replace(/\s*,\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Deduplicates an array of strings while preserving order.
 *
 * @param items - The array to deduplicate.
 * @returns A new array with duplicates removed.
 */
function deduplicate(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const normalized = item.trim().toLowerCase();
    if (normalized.length > 0 && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(item.trim());
    }
  }

  return result;
}

// ─────────────────────────────────────────────
// Pass 7: Negative Guardrails
// ─────────────────────────────────────────────

/**
 * Applies negative guardrails to the prompt modules.
 *
 * 1. Scans all positive modules for banned words and removes them.
 * 2. Adds edit-mode–specific negative tokens:
 *    - `ugc_realism` → UGC anti-polish negatives
 *    - `cinematic_upgrade` → anti-flat negatives
 * 3. Deduplicates the negativePrompt array.
 *
 * @param modules - The current prompt modules (not mutated).
 * @param intent - The normalized intent IR with editMode.
 * @returns A new PromptModules object with guardrails applied.
 */
export function applyNegativeGuardrails(
  modules: PromptModules,
  intent: IntentIR,
): PromptModules {
  const bannedWords = NBP_RULES.bannedWords;

  // Clone to avoid mutation
  const result: PromptModules = {
    ...modules,
    negativePrompt: [...modules.negativePrompt],
  };

  // ── Step 1: Strip banned words from all positive modules ──────────────

  for (const key of POSITIVE_MODULE_KEYS) {
    const value = result[key];
    if (typeof value === 'string' && value.length > 0) {
      (result as Record<string, unknown>)[key] = removeBannedWords(
        value,
        bannedWords,
      );
    }
  }

  // ── Step 2: Add mode-specific negative tokens ─────────────────────────

  if (intent.editMode === 'ugc_realism') {
    result.negativePrompt.push(...UGC_REALISM_NEGATIVES);
  }

  if (intent.editMode === 'cinematic_upgrade') {
    result.negativePrompt.push(...CINEMATIC_UPGRADE_NEGATIVES);
  }

  // ── Step 3: Deduplicate negative prompt entries ───────────────────────

  result.negativePrompt = deduplicate(result.negativePrompt);

  return result;
}
