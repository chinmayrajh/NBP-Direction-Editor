/**
 * @module ai/shot-planner
 * @description AI Shot Planner — calls Gemini 2.0 Flash to extrapolate
 * a user's scene description into a detailed photography shot plan.
 *
 * This is a pure async function with no side effects beyond the API call.
 * It does NOT handle identity tokens, negative prompts, or token budgeting
 * — those are handled deterministically by the caller.
 */

import { GoogleGenAI } from '@google/genai';
import type { DirectorInputs } from '../ir/project.js';
import { ShotPlanSchema, getShotPlanJsonSchema } from './schema.js';
import type { ShotPlan } from './schema.js';

// ─────────────────────────────────────────────
// System Prompt
// ─────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert photography director and AI image prompt engineer. Your job is to take a user's scene description and photography settings, then produce a detailed, structured shot plan that an AI image generator can use.

## Your Expertise
- Professional portrait and editorial photography
- Sports photography, fashion photography, lifestyle photography
- Camera physics: focal length, aperture, sensor behavior, depth of field
- Lighting design: key/fill/rim lights, color temperature, contrast ratios
- Wardrobe styling with fabric physics (drape, texture, movement)
- Pose choreography with body language and micro-expressions
- Atmospheric design: particles, color grading, environmental context

## Rules
1. **Extrapolate intent**: If the user says "like sports magazines", infer editorial-style dramatic lighting, high shutter speed freeze, tight crop, bold color grading. Don't just echo their words — ADD the photography knowledge they're implying.
2. **Override when contextually appropriate**: If the user selects "window_light" but describes an indoor sports court, override with venue-appropriate lighting (overhead fluorescent/LED). Explain why in your reasoning.
3. **Be specific and technical**: Use concrete photography terms, not vague descriptions. "f/2.8 at 135mm" not "blurry background". "3200K tungsten key from 45° camera-right" not "warm light".
4. **Respect the scene**: Don't add elements that contradict the scene. If they say "indoor badminton court", don't add "golden hour sunbeams".
5. **Match realism and imperfection levels**: Scale detail tokens to the user's chosen levels (1-5). Level 1 = minimal detail. Level 5 = extreme micro-detail (pore-level skin, fabric weave, lens aberrations).
6. **No identity preservation**: Never include face/body preservation tokens. Identity is handled separately.
7. **No negative prompts**: Never include "don't" or "avoid" statements. Negatives are handled separately.
8. **No quality buzzwords**: Never use "masterpiece", "beautiful", "award-winning", "stunning", "perfect", "hyperrealistic", "photorealistic", "unreal engine", "octane render".`;

// ─────────────────────────────────────────────
// Build User Message
// ─────────────────────────────────────────────

function buildUserMessage(inputs: DirectorInputs): string {
  return `## User's Request

**Scene**: ${inputs.coreScene}
**Camera**: ${inputs.cameraStyle}
**Lighting preference**: ${inputs.lightingStyle}
**Mood**: ${inputs.mood}
**Realism level**: ${inputs.realismLevel}/5
**Imperfection level**: ${inputs.imperfectionLevel}/5
**Edit mode**: ${inputs.editMode}
${inputs.wardrobe ? `**Wardrobe directive**: ${inputs.wardrobe}` : ''}

Plan this shot. Fill every field in the JSON schema with specific, technical photography tokens. In your reasoning, explain what intent you extrapolated and any overrides you made.`;
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

export interface PlanShotOptions {
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
  /** Override API key (otherwise reads from import.meta.env). */
  apiKey?: string;
}

/**
 * Calls Gemini 2.0 Flash to generate a structured shot plan.
 *
 * @param inputs - The user's director inputs.
 * @param options - Optional abort signal and API key override.
 * @returns A validated ShotPlan.
 * @throws If the scene is empty, API key is missing, API call fails,
 *         or the response doesn't match the schema.
 */
export async function planShot(
  inputs: DirectorInputs,
  options?: PlanShotOptions,
): Promise<ShotPlan> {
  // ── Guard: empty scene ───────────────────────────────────────────────
  if (!inputs.coreScene.trim()) {
    throw new Error('Scene description is required for AI planning.');
  }

  // ── Get API key ──────────────────────────────────────────────────────
  const apiKey = options?.apiKey
    ?? (typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY : undefined);

  if (!apiKey || apiKey === 'your-key-here') {
    throw new Error('MISSING_API_KEY');
  }

  // ── Check abort ──────────────────────────────────────────────────────
  if (options?.signal?.aborted) {
    throw new Error('ABORTED');
  }

  // ── Call Gemini ──────────────────────────────────────────────────────
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: buildUserMessage(inputs),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: getShotPlanJsonSchema(),
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });

  // ── Check abort after await ──────────────────────────────────────────
  if (options?.signal?.aborted) {
    throw new Error('ABORTED');
  }

  // ── Parse response ───────────────────────────────────────────────────
  const text = response.text;
  if (!text) {
    throw new Error('AI_EMPTY_RESPONSE');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('AI_MALFORMED_JSON');
  }

  // ── Validate with Zod ────────────────────────────────────────────────
  const result = ShotPlanSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`AI_SCHEMA_MISMATCH: ${issues}`);
  }

  return result.data;
}

/**
 * Checks if a Gemini API key is configured and valid-looking.
 */
export function isApiKeyConfigured(): boolean {
  try {
    const key = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY;
    return !!key && key !== 'your-key-here' && key.length > 10;
  } catch {
    return false;
  }
}
