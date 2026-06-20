/**
 * @module ai/assemble
 * @description Assembles an AI-generated ShotPlan + deterministic parts
 * into a complete DirectorProject.
 *
 * This is the bridge between the AI path and the existing project structure.
 * It takes:
 *   - ShotPlan (AI creative modules)
 *   - identityLock (deterministic from injectIdentity)
 *   - negativePrompt (deterministic from NBP_RULES)
 *
 * And produces a full DirectorProject with budgeted tokens and critique.
 */

import type { DirectorInputs, DirectorProject } from '../ir/project.js';
import type { PromptModules, IntentIR, IdentityIR } from '../ir/types.js';
import type { ShotPlan } from './schema.js';
import type { ValidationResult } from './validators.js';
import { budgetTokens } from '../compiler/token-budgeting.js';
import { visualCritique } from '../compiler/visual-critique.js';

// ─────────────────────────────────────────────
// ShotPlan → PromptModules
// ─────────────────────────────────────────────

/**
 * Maps an AI ShotPlan + deterministic fields into PromptModules.
 *
 * @param plan - The validated AI shot plan.
 * @param identityLock - Identity tokens from deterministic path (empty in Create mode).
 * @param negativePrompt - Negative prompt from NBP_RULES + user constraints.
 * @returns Complete PromptModules ready for token budgeting.
 */
function buildModulesFromShotPlan(
  plan: ShotPlan,
  identityLock: string,
  negativePrompt: string[],
): PromptModules {
  return {
    sceneDescription: plan.sceneDescription,
    identityLock,
    cameraSystem: plan.cameraSystem,
    lightingSystem: plan.lightingSystem,
    wardrobePhysics: plan.wardrobePhysics,
    poseChoreography: plan.poseChoreography,
    edgeActivity: plan.edgeActivity,
    atmosphere: plan.atmosphere,
    realismTokens: plan.realismTokens,
    imperfectionTokens: plan.imperfectionTokens,
    negativePrompt,
  };
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Assembles a complete DirectorProject from AI + deterministic parts.
 *
 * Processing:
 * 1. Maps ShotPlan → PromptModules (with identity + negatives)
 * 2. Runs budgetTokens() → FinalPromptIR
 * 3. Runs visualCritique() → CritiqueIR
 * 4. Derives confidence scores from validation results
 * 5. Builds full DirectorProject
 *
 * @param inputs - Original user inputs.
 * @param plan - The validated AI shot plan.
 * @param identityLock - Identity tokens from deterministic path.
 * @param negativePrompt - Negative prompt tokens.
 * @param identityIR - Identity IR for confidence scoring.
 * @param intentIR - Intent IR for critique pass.
 * @param validation - Validation results for confidence scoring.
 * @param reasoning - AI's reasoning text.
 * @param elapsedMs - Total elapsed time for the AI pipeline.
 * @returns A complete DirectorProject.
 */
export function assembleAiProject(
  inputs: DirectorInputs,
  plan: ShotPlan,
  identityLock: string,
  negativePrompt: string[],
  identityIR: IdentityIR,
  intentIR: IntentIR,
  validation: ValidationResult,
  elapsedMs: number,
): DirectorProject {
  const startedAt = new Date(Date.now() - elapsedMs).toISOString();
  const now = new Date().toISOString();

  // ── 1. Build PromptModules ─────────────────────────────────────────────
  const modules = buildModulesFromShotPlan(plan, identityLock, negativePrompt);

  // ── 2. Token Budgeting (deterministic) ─────────────────────────────────
  const finalPromptIR = budgetTokens(modules);

  // ── 3. Visual Critique (deterministic) ─────────────────────────────────
  const critiqueIR = visualCritique(finalPromptIR, intentIR);

  // ── 4. Confidence Scores ───────────────────────────────────────────────
  const validatorIssueCount = validation.issues.filter((i) => !i.autoFixed).length;
  const baseConfidence = validatorIssueCount === 0 ? 0.95 : Math.max(0.5, 0.95 - validatorIssueCount * 0.15);

  const confidence = {
    identity: identityIR.identityConfidence,
    realism: Math.min(1.0, intentIR.realismLevel / 5),
    composition: critiqueIR.compositionFlatness === 0 ? 0.9 : 1.0 - critiqueIR.compositionFlatness,
    controllability: baseConfidence,
  };

  // ── 5. Assemble DirectorProject ────────────────────────────────────────
  return {
    id: crypto.randomUUID(),
    createdAt: startedAt,
    updatedAt: now,
    inputs,
    aiPipeline: {
      intentIR,
      identityIR,
      finalPromptIR,
      critiqueIR,
      // AI-specific fields
      aiReasoning: plan.reasoning,
      aiValidation: validation,
      source: 'ai',
    },
    output: {
      finalJson: finalPromptIR,
      editablePrompt: finalPromptIR.mergedPrompt,
      previewImage: null,
    },
    generationState: {
      status: 'completed',
      progress: 100,
      errors: [],
      startedAt,
      completedAt: now,
      elapsedMs,
    },
    versions: [
      {
        id: crypto.randomUUID(),
        timestamp: now,
        mutationIntent: 'AI-guided compilation',
        diff: [],
        finalPrompt: finalPromptIR,
      },
    ],
    confidence,
  };
}
