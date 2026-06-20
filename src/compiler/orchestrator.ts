/**
 * @module compiler/orchestrator
 * @description NBP Director Pipeline Orchestrator.
 *
 * Runs all 9 compiler passes sequentially to transform raw
 * {@link DirectorInputs} into a complete {@link DirectorProject}.
 *
 * Pipeline order:
 *   1. normalize-inputs     → IntentIR
 *   2. resolve-constraints  → ConstraintIR
 *   3. inject-identity      → IdentityIR
 *   4. inject-photography   → PhotographyPlanIR
 *   5. inject-realism       → PromptModules
 *   6. inject-composition   → PromptModules (enriched)
 *   7. negative-guardrails  → PromptModules (cleaned)
 *   8. token-budgeting      → FinalPromptIR
 *   9. visual-critique      → CritiqueIR
 *
 * Each pass is logged via {@link Logger} for observability and debugging.
 */

import type { DirectorInputs, DirectorProject } from '../ir/project.js';
import type { CompilerLogger } from '../utils/browser-logger.js';
import { BrowserLogger } from '../utils/browser-logger.js';

import { normalizeInputs } from './normalize-inputs.js';
import { resolveConstraints } from './resolve-constraints.js';
import { injectIdentity } from './inject-identity.js';
import { injectPhotography } from './inject-photography.js';
import { injectRealism } from './inject-realism.js';
import { injectComposition } from './inject-composition.js';
import { applyNegativeGuardrails } from './negative-guardrails.js';
import { budgetTokens } from './token-budgeting.js';
import { visualCritique } from './visual-critique.js';

// ─────────────────────────────────────────────
// Pipeline Options
// ─────────────────────────────────────────────

/**
 * Options for the pipeline orchestrator.
 *
 * @property logger - Optional logger implementation. Defaults to the
 *   filesystem-based {@link Logger} for CLI/Node.js use. Pass a
 *   {@link BrowserLogger} when running in the browser.
 */
export interface PipelineOptions {
  logger?: CompilerLogger;
}

// ─────────────────────────────────────────────
// Pipeline Orchestrator
// ─────────────────────────────────────────────

/**
 * Runs the complete NBP Director compilation pipeline.
 *
 * Executes all 9 compiler passes sequentially, logging each pass
 * for observability. Wraps execution in try/catch for error handling
 * and returns a fully populated {@link DirectorProject}.
 *
 * @param inputs - The raw user-provided inputs.
 * @returns A complete DirectorProject with all pipeline results.
 *
 * @example
 * ```ts
 * import { runPipeline } from './compiler/orchestrator.js';
 *
 * const project = runPipeline({
 *   coreScene: 'woman standing on a rooftop at golden hour',
 *   editMode: 'preserve_enhance',
 *   cameraStyle: '85mm_portrait',
 *   lightingStyle: 'golden_hour',
 *   mood: 'confident',
 *   realismLevel: 4,
 *   imperfectionLevel: 3,
 *   referenceImages: [],
 *   priorities: [],
 *   negativeConstraints: '',
 * });
 * ```
 */
export function runPipeline(inputs: DirectorInputs, options?: PipelineOptions): DirectorProject {
  const logger = options?.logger ?? new BrowserLogger();
  const startedAt = new Date().toISOString();

  try {
    // ── Pass 1: Normalize Inputs ──────────────────────────────────────────
    const intentIR = normalizeInputs(inputs);
    logger.logPass('normalize-inputs', inputs, intentIR);

    // ── Pass 2: Resolve Constraints ───────────────────────────────────────
    const constraintIR = resolveConstraints(intentIR);
    logger.logPass('resolve-constraints', intentIR, constraintIR);

    // ── Pass 3: Inject Identity ───────────────────────────────────────────
    const identityIR = injectIdentity(intentIR, constraintIR);
    logger.logPass('inject-identity', { intentIR, constraintIR }, identityIR);

    // ── Pass 4: Inject Photography ────────────────────────────────────────
    const photographyPlanIR = injectPhotography(intentIR, identityIR);
    logger.logPass('inject-photography', { intentIR, identityIR }, photographyPlanIR);

    // ── Pass 5: Inject Realism ────────────────────────────────────────────
    const realismEnhancedModules = injectRealism(photographyPlanIR, identityIR, intentIR);
    logger.logPass('inject-realism', photographyPlanIR, realismEnhancedModules);

    // ── Pass 6: Inject Composition ────────────────────────────────────────
    const compositionEnhancedModules = injectComposition(realismEnhancedModules, intentIR);
    logger.logPass('inject-composition', realismEnhancedModules, compositionEnhancedModules);

    // ── Pass 7: Negative Guardrails ───────────────────────────────────────
    const guardrailedModules = applyNegativeGuardrails(compositionEnhancedModules, intentIR);
    logger.logPass('negative-guardrails', compositionEnhancedModules, guardrailedModules);

    // ── Pass 8: Token Budgeting ───────────────────────────────────────────
    const finalPromptIR = budgetTokens(guardrailedModules);
    logger.logPass('token-budgeting', guardrailedModules, finalPromptIR);

    // ── Pass 9: Visual Critique ───────────────────────────────────────────
    const critiqueIR = visualCritique(finalPromptIR, intentIR);
    logger.logPass('visual-critique', finalPromptIR, critiqueIR);

    // ── Build confidence scores ───────────────────────────────────────────
    const confidence = {
      identity: identityIR.identityConfidence,
      realism: Math.min(1.0, intentIR.realismLevel / 5),
      composition: critiqueIR.compositionFlatness === 0 ? 0.9 : 1.0 - critiqueIR.compositionFlatness,
      controllability: critiqueIR.overallScore,
    };

    // ── Assemble DirectorProject ──────────────────────────────────────────
    const now = new Date().toISOString();
    const project: DirectorProject = {
      id: crypto.randomUUID(),
      createdAt: startedAt,
      updatedAt: now,
      inputs,
      aiPipeline: {
        intentIR,
        constraintIR,
        identityIR,
        photographyPlanIR,
        realismEnhancedModules,
        compositionEnhancedModules,
        guardrailedModules,
        finalPromptIR,
        critiqueIR,
        critiqueIterations: 1,
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
        elapsedMs: Date.now() - new Date(startedAt).getTime(),
      },
      versions: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          mutationIntent: 'initial compilation',
          diff: [],
          finalPrompt: finalPromptIR,
        },
      ],
      confidence,
    };

    // ── Print summary ─────────────────────────────────────────────────────
    console.log(logger.getSummary());

    return project;
  } catch (error) {
    // Log the error and build a minimal error project
    const passName = 'pipeline';
    logger.logError(passName, error);
    console.error(logger.getSummary());

    const now = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);

    const errorProject: DirectorProject = {
      id: crypto.randomUUID(),
      createdAt: startedAt,
      updatedAt: now,
      inputs,
      aiPipeline: {},
      output: {
        finalJson: null,
        editablePrompt: null,
        previewImage: null,
      },
      generationState: {
        status: 'error',
        progress: 0,
        errors: [
          {
            pass: 'error',
            message: errorMessage,
            timestamp: now,
            recoverable: false,
          },
        ],
        startedAt,
        completedAt: now,
        elapsedMs: Date.now() - new Date(startedAt).getTime(),
      },
      versions: [],
      confidence: {
        identity: 0,
        realism: 0,
        composition: 0,
        controllability: 0,
      },
    };

    return errorProject;
  }
}
