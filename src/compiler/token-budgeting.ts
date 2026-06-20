/**
 * @module compiler/token-budgeting
 * @description Pass 8 — Token Budgeting.
 *
 * Merges all prompt modules into a single prompt string within a
 * configurable token budget. Uses a three-tier priority system:
 *
 * - **Tier 1 (never drop)**: identityLock, cameraSystem, lightingSystem
 * - **Tier 2 (compress)**:  wardrobePhysics, poseChoreography, edgeActivity,
 *                           realismTokens, imperfectionTokens
 * - **Tier 3 (droppable)**: atmosphere
 *
 * Token counting uses a simple word-count approximation (split by spaces).
 * If the total exceeds the budget, Tier 3 tokens are dropped first, then
 * Tier 2 tokens are compressed (truncated to fit).
 *
 * This is a pure function: the input modules are cloned, never mutated.
 */

import type { PromptModules, FinalPromptIR } from '../ir/types.js';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** Default maximum token budget. */
const DEFAULT_MAX_TOKENS = 3500;

/** Tier 1 module keys — never dropped. */
const TIER_1_KEYS: readonly (keyof PromptModules)[] = [
  'identityLock',
  'cameraSystem',
  'lightingSystem',
] as const;

/** Tier 2 module keys — compressible under budget pressure. */
const TIER_2_KEYS: readonly (keyof PromptModules)[] = [
  'wardrobePhysics',
  'poseChoreography',
  'edgeActivity',
  'realismTokens',
  'imperfectionTokens',
] as const;

/** Tier 3 module keys — droppable when over budget. */
const TIER_3_KEYS: readonly (keyof PromptModules)[] = [
  'atmosphere',
] as const;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Counts the approximate token count of a string using space-split.
 *
 * @param text - The text to count tokens for.
 * @returns Approximate token count.
 */
function countTokens(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Extracts the string content for a given module key.
 * For `negativePrompt` (string[]), joins with comma-space.
 * For all other keys, returns the string value.
 *
 * @param modules - The prompt modules.
 * @param key - The module key to extract.
 * @returns The string content of the module.
 */
function getModuleContent(modules: PromptModules, key: keyof PromptModules): string {
  const value = modules[key];
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return typeof value === 'string' ? value : '';
}

/**
 * Compresses a text to fit within a target token count by truncating
 * at word boundaries.
 *
 * @param text - The text to compress.
 * @param targetTokens - Maximum number of tokens to keep.
 * @returns An object with the compressed text and the tokens that were dropped.
 */
function compressToFit(
  text: string,
  targetTokens: number,
): { compressed: string; dropped: string[] } {
  const words = text.trim().split(/\s+/);

  if (words.length <= targetTokens) {
    return { compressed: text, dropped: [] };
  }

  const kept = words.slice(0, targetTokens);
  const dropped = words.slice(targetTokens);

  return {
    compressed: kept.join(' '),
    dropped,
  };
}

// ─────────────────────────────────────────────
// Pass 8: Token Budgeting
// ─────────────────────────────────────────────

/**
 * Merges all prompt modules into a single budget-constrained prompt string.
 *
 * Processing order:
 * 1. Collect all Tier 1 content (never dropped).
 * 2. Collect all Tier 2 content (compressible).
 * 3. Collect all Tier 3 content (droppable).
 * 4. If total exceeds budget, drop Tier 3 first, then compress Tier 2.
 * 5. Build the FinalPromptIR with merged prompt, token count, and metadata.
 *
 * @param modules - The current prompt modules (not mutated).
 * @param maxTokens - Maximum token budget. Defaults to 3500.
 * @returns A FinalPromptIR with the merged, budgeted prompt.
 */
export function budgetTokens(
  modules: PromptModules,
  maxTokens: number = DEFAULT_MAX_TOKENS,
): FinalPromptIR {
  const droppedTokens: string[] = [];
  let compressionApplied = false;

  // ── Collect tier contents ─────────────────────────────────────────────

  const tier1Parts: string[] = [];
  for (const key of TIER_1_KEYS) {
    const content = getModuleContent(modules, key).trim();
    if (content.length > 0) {
      tier1Parts.push(content);
    }
  }

  const tier2Parts: { key: keyof PromptModules; content: string }[] = [];
  for (const key of TIER_2_KEYS) {
    const content = getModuleContent(modules, key).trim();
    if (content.length > 0) {
      tier2Parts.push({ key, content });
    }
  }

  const tier3Parts: { key: keyof PromptModules; content: string }[] = [];
  for (const key of TIER_3_KEYS) {
    const content = getModuleContent(modules, key).trim();
    if (content.length > 0) {
      tier3Parts.push({ key, content });
    }
  }

  // ── Calculate token counts ────────────────────────────────────────────

  const tier1Text = tier1Parts.join(', ');
  const tier1Tokens = countTokens(tier1Text);

  let tier2Text = tier2Parts.map((p) => p.content).join(', ');
  let tier2Tokens = countTokens(tier2Text);

  const tier3Text = tier3Parts.map((p) => p.content).join(', ');
  const tier3Tokens = countTokens(tier3Text);

  let totalTokens = tier1Tokens + tier2Tokens + tier3Tokens;

  // ── Budget enforcement ────────────────────────────────────────────────

  let finalTier3Text = tier3Text;

  // Step 1: Drop Tier 3 if over budget
  if (totalTokens > maxTokens) {
    compressionApplied = true;

    // Drop Tier 3 tokens
    if (tier3Tokens > 0) {
      const tier3Words = tier3Text.split(/\s+/);
      droppedTokens.push(...tier3Words);
      finalTier3Text = '';
      totalTokens -= tier3Tokens;
    }
  }

  // Step 2: Compress Tier 2 if still over budget
  if (totalTokens > maxTokens) {
    const availableForTier2 = Math.max(0, maxTokens - tier1Tokens);

    const { compressed, dropped } = compressToFit(tier2Text, availableForTier2);
    tier2Text = compressed;
    tier2Tokens = countTokens(tier2Text);
    droppedTokens.push(...dropped);
    totalTokens = tier1Tokens + tier2Tokens;
  }

  // ── Assemble merged prompt ────────────────────────────────────────────

  const promptParts: string[] = [];

  if (tier1Text.length > 0) promptParts.push(tier1Text);
  if (tier2Text.length > 0) promptParts.push(tier2Text);
  if (finalTier3Text.length > 0) promptParts.push(finalTier3Text);

  const mergedPrompt = promptParts.join(', ');
  const finalTokenCount = countTokens(mergedPrompt);

  // ── Build FinalPromptIR ───────────────────────────────────────────────

  return {
    modules: {
      ...modules,
      negativePrompt: [...modules.negativePrompt],
    },
    mergedPrompt,
    tokenCount: finalTokenCount,
    compressionApplied,
    droppedTokens,
  };
}
