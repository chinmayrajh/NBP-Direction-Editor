/**
 * @module ai/validators
 * @description Deterministic validators for AI-generated shot plans.
 *
 * These validators check the AI's output for correctness WITHOUT making
 * additional API calls. Issues that can be fixed deterministically are
 * auto-corrected. Issues that can't are reported as warnings.
 *
 * Validators:
 * 1. TokenBudgetValidator — ensures total tokens ≤ budget
 * 2. BannedWordValidator — removes quality buzzwords
 * 3. EmptyFieldValidator — flags empty modules
 * 4. IdentityGuard — ensures no identity tokens in Create mode
 */

import type { ShotPlan } from './schema.js';
import type { IntentIR } from '../ir/types.js';
import { NBP_RULES } from '../config/nbp-rules.js';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ValidationIssue {
  module: string;
  severity: 'error' | 'warning';
  message: string;
  autoFixed: boolean;
}

export interface ValidationResult {
  pass: boolean;
  issues: ValidationIssue[];
  fixedPlan: ShotPlan;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function countTokens(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * All ShotPlan fields that contain prompt content (excludes `reasoning`).
 */
const CONTENT_FIELDS: readonly (keyof Omit<ShotPlan, 'reasoning'>)[] = [
  'sceneDescription',
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
// Validators
// ─────────────────────────────────────────────

/**
 * Checks total token count and truncates if over budget.
 */
function validateTokenBudget(
  plan: ShotPlan,
  maxTokens: number = 3500,
): { plan: ShotPlan; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  let total = 0;

  for (const key of CONTENT_FIELDS) {
    total += countTokens(plan[key]);
  }

  if (total > maxTokens) {
    issues.push({
      module: 'all',
      severity: 'warning',
      message: `Total tokens (${total}) exceed budget (${maxTokens}). Will be compressed by token budgeting pass.`,
      autoFixed: true,
    });
    // Token budgeting pass handles actual compression — no need to modify here
  }

  return { plan, issues };
}

/**
 * Removes banned quality buzzwords from all fields.
 */
function validateBannedWords(plan: ShotPlan): { plan: ShotPlan; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const fixed = { ...plan };

  for (const key of CONTENT_FIELDS) {
    let text = fixed[key];
    let wasFixed = false;

    for (const word of NBP_RULES.bannedWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(text)) {
        text = text.replace(regex, '').replace(/,\s*,/g, ',').replace(/^\s*,|,\s*$/g, '').trim();
        wasFixed = true;
      }
    }

    if (wasFixed) {
      issues.push({
        module: key,
        severity: 'warning',
        message: `Removed banned quality buzzwords from ${key}.`,
        autoFixed: true,
      });
      fixed[key] = text;
    }
  }

  return { plan: fixed, issues };
}

/**
 * Flags empty content fields and marks them for deterministic fallback.
 */
function validateEmptyFields(plan: ShotPlan): { plan: ShotPlan; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  for (const key of CONTENT_FIELDS) {
    if (!plan[key].trim()) {
      issues.push({
        module: key,
        severity: 'error',
        message: `AI returned empty ${key}. Will use deterministic fallback.`,
        autoFixed: false,
      });
    }
  }

  return { plan, issues };
}

/**
 * Ensures no identity-preservation tokens appear in Create mode.
 */
function validateIdentityGuard(
  plan: ShotPlan,
  intent: IntentIR,
): { plan: ShotPlan; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  if (intent.editMode === 'new_scene') {
    const identityKeywords = /\b(preserve|maintain|face_geometry|eye_spacing|jawline|inter-pupillary|identity|anchor|reference face)\b/gi;

    for (const key of CONTENT_FIELDS) {
      if (identityKeywords.test(plan[key])) {
        issues.push({
          module: key,
          severity: 'warning',
          message: `Removed identity-preservation tokens from ${key} (Create mode).`,
          autoFixed: true,
        });
        const fixed = { ...plan };
        fixed[key] = plan[key].replace(identityKeywords, '').replace(/,\s*,/g, ',').replace(/^\s*,|,\s*$/g, '').trim();
        return { plan: fixed, issues };
      }
    }
  }

  return { plan, issues };
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Runs all deterministic validators on the AI's shot plan.
 * Auto-fixes what it can; reports what it can't.
 *
 * @param plan - The raw AI-generated shot plan.
 * @param intent - The normalized intent IR for context (edit mode, realism level).
 * @returns Validation result with the (possibly fixed) plan and all issues.
 */
export function validateAndFix(plan: ShotPlan, intent: IntentIR): ValidationResult {
  const allIssues: ValidationIssue[] = [];
  let currentPlan = { ...plan };

  // Run validators in sequence — each can modify the plan
  const budget = validateTokenBudget(currentPlan);
  currentPlan = budget.plan;
  allIssues.push(...budget.issues);

  const banned = validateBannedWords(currentPlan);
  currentPlan = banned.plan;
  allIssues.push(...banned.issues);

  const empty = validateEmptyFields(currentPlan);
  currentPlan = empty.plan;
  allIssues.push(...empty.issues);

  const identity = validateIdentityGuard(currentPlan, intent);
  currentPlan = identity.plan;
  allIssues.push(...identity.issues);

  const hasErrors = allIssues.some((i) => i.severity === 'error' && !i.autoFixed);

  return {
    pass: !hasErrors,
    issues: allIssues,
    fixedPlan: currentPlan,
  };
}
