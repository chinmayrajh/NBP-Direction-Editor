/**
 * @module ai/shot-planner
 * @description AI Shot Planner with fallback chain:
 *
 * 1. Chrome Built-in AI (Prompt API) — free, local, no key
 * 2. Gemini API (@google/genai) — optional API key for higher quality
 * 3. Throws NO_AI_AVAILABLE — caller falls back to deterministic
 */

// @google/genai is lazy-loaded only when the Gemini API fallback path is used.
// This saves ~100KB from the main bundle since most users will use the built-in Prompt API.
import type { DirectorInputs } from '../ir/project.js';
import { ShotPlanSchema, getShotPlanJsonSchema } from './schema.js';
import type { ShotPlan } from './schema.js';
import { platform } from '../platform/index.js';

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
// Zod Validation Helper
// ─────────────────────────────────────────────

function validateShotPlan(text: string): ShotPlan {
  if (!text) throw new Error('AI_EMPTY_RESPONSE');

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('AI_MALFORMED_JSON');
  }

  const result = ShotPlanSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`AI_SCHEMA_MISMATCH: ${issues}`);
  }

  return result.data;
}

// ─────────────────────────────────────────────
// Strategy 1: Chrome Built-in AI (Prompt API)
// ─────────────────────────────────────────────

async function planShotWithBuiltinAI(
  inputs: DirectorInputs,
): Promise<ShotPlan> {
  // Check availability
  const aiGlobal = (globalThis as Record<string, unknown>).ai as {
    languageModel?: {
      capabilities(): Promise<{ available: string }>;
      create(opts: {
        initialPrompts: { role: string; content: string }[];
      }): Promise<{
        prompt(
          text: string,
          opts?: { responseConstraint?: unknown },
        ): Promise<string>;
        destroy(): void;
      }>;
    };
  } | undefined;

  if (!aiGlobal?.languageModel) {
    throw new Error('BUILTIN_AI_UNAVAILABLE');
  }

  const capabilities = await aiGlobal.languageModel.capabilities();
  if (capabilities.available === 'no') {
    throw new Error('BUILTIN_AI_UNAVAILABLE');
  }

  // Create session with system prompt
  const session = await aiGlobal.languageModel.create({
    initialPrompts: [
      { role: 'system', content: SYSTEM_PROMPT },
    ],
  });

  try {
    // Prompt with structured output constraint
    const result = await session.prompt(buildUserMessage(inputs), {
      responseConstraint: {
        type: 'json-schema',
        schema: getShotPlanJsonSchema(),
      },
    });

    return validateShotPlan(result);
  } finally {
    session.destroy(); // Always release resources
  }
}

// ─────────────────────────────────────────────
// Strategy 2: Gemini API (@google/genai)
// ─────────────────────────────────────────────

async function planShotWithGeminiAPI(
  inputs: DirectorInputs,
  apiKey: string,
): Promise<ShotPlan> {
  const { GoogleGenAI } = await import('@google/genai');
  const genai = new GoogleGenAI({ apiKey });

  const response = await genai.models.generateContent({
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

  return validateShotPlan(response.text ?? '');
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

export interface PlanShotOptions {
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
  /** Override API key (bypasses storage lookup). */
  apiKey?: string;
}

/**
 * Plans a shot using the best available AI strategy:
 * 1. Chrome Built-in AI (free, local)
 * 2. Gemini API with key (optional)
 * 3. Throws NO_AI_AVAILABLE
 */
export async function planShot(
  inputs: DirectorInputs,
  options?: PlanShotOptions,
): Promise<ShotPlan> {
  if (!inputs.coreScene.trim()) {
    throw new Error('Scene description is required for AI planning.');
  }

  if (options?.signal?.aborted) {
    throw new Error('ABORTED');
  }

  // ── Strategy 1: Chrome Built-in AI (free, no key) ──────────────────
  try {
    return await planShotWithBuiltinAI(inputs);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg !== 'BUILTIN_AI_UNAVAILABLE') {
      console.warn('[NBP] Built-in AI failed:', msg);
    }
    // Fall through to API key path
  }

  if (options?.signal?.aborted) {
    throw new Error('ABORTED');
  }

  // ── Strategy 2: Gemini API with key (optional) ─────────────────────
  const apiKey = options?.apiKey ?? await getApiKeyAsync();
  if (apiKey) {
    return await planShotWithGeminiAPI(inputs, apiKey);
  }

  // ── Neither available ──────────────────────────────────────────────
  throw new Error('NO_AI_AVAILABLE');
}

// ─────────────────────────────────────────────
// API Key Management (via platform abstraction)
// ─────────────────────────────────────────────

const STORAGE_KEY = 'nbp_gemini_api_key';

/** Get API key from platform storage. */
export async function getApiKeyAsync(): Promise<string | undefined> {
  const key = await platform.storage.get(STORAGE_KEY);
  if (key && key.length > 10 && key !== 'your-key-here') {
    return key;
  }

  // Fallback: Vite env var
  try {
    const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY;
    if (envKey && envKey !== 'your-key-here' && envKey.length > 10) {
      return envKey;
    }
  } catch {
    // import.meta not available
  }

  return undefined;
}

/** Synchronous API key check (for backward compat). */
export function getApiKey(): string | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.length > 10 && stored !== 'your-key-here') {
      return stored;
    }
  } catch { /* not available */ }

  try {
    const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY;
    if (envKey && envKey !== 'your-key-here' && envKey.length > 10) {
      return envKey;
    }
  } catch { /* not available */ }

  return undefined;
}

/** Save API key via platform storage. */
export async function saveApiKey(key: string): Promise<void> {
  await platform.storage.set(STORAGE_KEY, key.trim());
}

/** Clear stored API key. */
export async function clearApiKey(): Promise<void> {
  await platform.storage.remove(STORAGE_KEY);
}

// ─────────────────────────────────────────────
// AI Availability Detection
// ─────────────────────────────────────────────

export interface AiAvailability {
  /** Chrome's built-in Prompt API (Gemini Nano, local). */
  builtinAi: boolean;
  /** Gemini API with user-provided key. */
  geminiApi: boolean;
  /** At least one AI path is available. */
  anyAvailable: boolean;
}

/**
 * Checks what AI capabilities are available.
 * Call on mount to determine UI state.
 */
export async function isAiAvailable(): Promise<AiAvailability> {
  let builtinAi = false;
  try {
    const aiGlobal = (globalThis as Record<string, unknown>).ai as {
      languageModel?: { capabilities(): Promise<{ available: string }> };
    } | undefined;

    if (aiGlobal?.languageModel) {
      const caps = await aiGlobal.languageModel.capabilities();
      builtinAi = caps.available !== 'no';
    }
  } catch { /* not available */ }

  const geminiApi = !!(await getApiKeyAsync());

  return {
    builtinAi,
    geminiApi,
    anyAvailable: builtinAi || geminiApi,
  };
}

/**
 * @deprecated Use isAiAvailable() instead.
 */
export function isApiKeyConfigured(): boolean {
  return !!getApiKey();
}
