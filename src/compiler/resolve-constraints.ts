/**
 * @module compiler/resolve-constraints
 * @description **Pass 2 — Resolve Constraints.**
 *
 * Partitions all scene tokens into immutable, editable, and forbidden sets
 * based on the user's locked elements, then runs the contradiction graph
 * to detect and resolve semantic conflicts.
 *
 * This is a **pure function** — no side effects, no LLM calls.
 */

import type {
  IntentIR,
  ConstraintIR,
  LockedElements,
  LockedElement,
  ConflictDetection,
  ConflictResolutionRecord,
  ResolutionStrategy,
} from '../ir/types.js';
import { detectContradictions } from '../config/contradiction-graph.js';
import { NBP_RULES } from '../config/nbp-rules.js';

// ─────────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────────

/**
 * Builds the immutable token list from locked elements.
 *
 * For each locked element, the corresponding identity-lock tokens
 * from {@link NBP_RULES.identityLockTokens} are split into individual
 * phrases and added to the immutable set.
 *
 * @param lockedElements - The locked-element flags from the IntentIR.
 * @returns Array of immutable token strings.
 */
function buildImmutableTokens(lockedElements: LockedElements): string[] {
  const immutable: string[] = [];
  const keys = Object.keys(lockedElements) as LockedElement[];

  for (const key of keys) {
    if (lockedElements[key]) {
      const lockString = NBP_RULES.identityLockTokens[key];
      // Split the comma-separated lock string into individual tokens
      const tokens = lockString.split(',').map((t) => t.trim()).filter(Boolean);
      immutable.push(...tokens);
    }
  }

  return immutable;
}

/**
 * Builds the editable token list from unlocked elements.
 *
 * Unlocked elements generate editable tokens that downstream passes
 * can modify or enhance.
 *
 * @param lockedElements - The locked-element flags from the IntentIR.
 * @param intent - The full IntentIR for extracting context tokens.
 * @returns Array of editable token strings.
 */
function buildEditableTokens(
  lockedElements: LockedElements,
  intent: IntentIR,
): string[] {
  const editable: string[] = [];
  const keys = Object.keys(lockedElements) as LockedElement[];

  for (const key of keys) {
    if (!lockedElements[key]) {
      // Add the element category as an editable domain
      editable.push(key);
    }
  }

  // Scene description tokens are always editable
  const sceneWords = intent.scene
    .split(/\s+/)
    .filter((w) => w.length > 2);
  editable.push(...sceneWords);

  // Wardrobe is editable if outfit is not locked
  if (!lockedElements.outfit && intent.wardrobe) {
    editable.push(intent.wardrobe);
  }

  return editable;
}

/**
 * Builds the forbidden token list from negative constraints
 * and the default banned words.
 *
 * @param intent - The IntentIR containing negative constraints.
 * @returns Array of forbidden token strings.
 */
function buildForbiddenTokens(intent: IntentIR): string[] {
  const forbidden: string[] = [];

  // User negative constraints
  if (intent.negativeConstraints) {
    const userForbidden = intent.negativeConstraints
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    forbidden.push(...userForbidden);
  }

  // Banned words are always forbidden
  forbidden.push(...NBP_RULES.bannedWords);

  return [...new Set(forbidden)];
}

/**
 * Converts detected conflicts from the contradiction graph into
 * the IR-level conflict detection records.
 *
 * @param intent - The IntentIR used for conflict detection.
 * @returns Tuple of [detected conflicts, resolution records].
 */
function resolveDetectedConflicts(
  intent: IntentIR,
): [ConflictDetection[], ConflictResolutionRecord[]] {
  const rawConflicts = detectContradictions(intent);
  const detections: ConflictDetection[] = [];
  const resolutions: ConflictResolutionRecord[] = [];

  for (const conflict of rawConflicts) {
    const detection: ConflictDetection = {
      id: conflict.ruleId,
      description: conflict.message,
      elements: [conflict.conditionA, conflict.conditionB],
      severity: conflict.resolution === 'reject' ? 'critical'
        : conflict.resolution === 'downgrade' ? 'medium'
        : 'low',
      detectedBy: 'resolve-constraints',
    };
    detections.push(detection);

    // Auto-resolve non-reject conflicts
    const strategyMap: Record<string, ResolutionStrategy> = {
      reject: 'manual',
      downgrade: 'priority_override',
      clarify: 'user_preference',
      blend: 'weighted_blend',
    };

    const strategy = strategyMap[conflict.resolution] ?? 'manual';

    const resolution: ConflictResolutionRecord = {
      conflictId: conflict.ruleId,
      strategy,
      action: conflict.resolution === 'reject'
        ? `Flagged for manual resolution: ${conflict.message}`
        : conflict.resolution === 'downgrade'
          ? `Auto-downgraded: ${conflict.message}`
          : `Awaiting user preference: ${conflict.message}`,
      originalValues: {
        [conflict.conditionA]: conflict.conditionA,
        [conflict.conditionB]: conflict.conditionB,
      },
      resolvedValues: conflict.resolution === 'downgrade'
        ? { adjustment: `Downgraded ${conflict.conditionB} to accommodate ${conflict.conditionA}` }
        : {
            [conflict.conditionA]: conflict.conditionA,
            [conflict.conditionB]: conflict.conditionB,
          },
    };

    // For priority override, the first condition (higher priority) wins
    if (strategy === 'priority_override') {
      resolution.winner = conflict.conditionA;
    }

    resolutions.push(resolution);
  }

  return [detections, resolutions];
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * **Pass 2 — Resolve Constraints.**
 *
 * Takes the normalized {@link IntentIR} from Pass 1 and produces a
 * {@link ConstraintIR} that partitions all scene tokens into:
 *
 * - **immutable**: must appear verbatim in the final prompt.
 * - **editable**: downstream passes may modify or enhance.
 * - **forbidden**: must never appear (feeds negative prompt).
 *
 * Also detects and records all semantic contradictions.
 *
 * @param intent - The IntentIR from Pass 1.
 * @returns A fully resolved ConstraintIR.
 *
 * @example
 * ```ts
 * import { resolveConstraints } from '../compiler/resolve-constraints.js';
 *
 * const constraints = resolveConstraints(intent);
 * // constraints.conflictsDetected may contain physics violations
 * ```
 */
export function resolveConstraints(intent: IntentIR): ConstraintIR {
  // 1. Build immutable tokens from locked elements
  const immutable = buildImmutableTokens(intent.lockedElements);

  // 2. Build editable tokens from unlocked elements + scene
  const editable = buildEditableTokens(intent.lockedElements, intent);

  // 3. Build forbidden tokens from negative constraints + banned words
  const forbidden = buildForbiddenTokens(intent);

  // 4. Detect and resolve contradictions
  const [conflictsDetected, conflictsResolved] = resolveDetectedConflicts(intent);

  return {
    immutable,
    editable,
    forbidden,
    conflictsDetected,
    conflictsResolved,
  };
}
