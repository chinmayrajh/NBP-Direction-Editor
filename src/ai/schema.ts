/**
 * @module ai/schema
 * @description Zod schema for the AI Shot Planner's structured output.
 *
 * Defines the shape of the JSON response from Gemini. This schema is used
 * in two ways:
 * 1. `toJSONSchema()` → passed to Gemini as `responseSchema` to constrain output
 * 2. `safeParse()` → runtime validation of the AI response
 */

import { z } from 'zod';

/**
 * Schema for the AI's shot plan output.
 *
 * Maps to `PromptModules` minus `identityLock` (deterministic) and
 * `negativePrompt` (deterministic guardrail). Adds `reasoning` for
 * transparency.
 */
export const ShotPlanSchema = z.object({
  /** Enhanced scene description with extrapolated details. */
  sceneDescription: z.string().describe(
    'The user\'s scene description, enriched with extrapolated visual details. Keep the original intent but add specifics about subject appearance, action, environment.',
  ),

  /** Camera system tokens: lens, sensor, aperture, characteristics. */
  cameraSystem: z.string().describe(
    'Camera technical tokens: focal length, aperture, sensor size, depth of field, noise characteristics, ISO. Should match the user\'s camera selection but adapt to the scene.',
  ),

  /** Lighting rig tokens: key, fill, rim, ambient, color temperature. */
  lightingSystem: z.string().describe(
    'Lighting setup tokens: key light, fill light, ambient light, color temperature, contrast ratio, shadow quality. Should match the scene environment, even if it means overriding the user\'s lighting selection.',
  ),

  /** Wardrobe with material physics. */
  wardrobePhysics: z.string().describe(
    'Wardrobe description with material physics: garment type, fabric material, fit, texture details, fabric behavior (drape, wrinkles, tension).',
  ),

  /** Pose and body language choreography. */
  poseChoreography: z.string().describe(
    'Pose choreography: body orientation, head position, eye direction, hand placement, weight distribution, micro-expression, motion state.',
  ),

  /** Edge-of-frame activity and depth layers. */
  edgeActivity: z.string().describe(
    'Peripheral detail and depth: foreground elements, midground subject plane, background depth, edge-of-frame activity.',
  ),

  /** Atmosphere, environment, and color grading. */
  atmosphere: z.string().describe(
    'Atmosphere tokens: environment description, particles, background treatment, color grading, time of day, weather.',
  ),

  /** Realism-injection tokens. */
  realismTokens: z.string().describe(
    'Realism markers: skin texture, fabric weave, lens artifacts, subsurface scattering. Scale detail level to match the user\'s realism setting.',
  ),

  /** Imperfection-injection tokens. */
  imperfectionTokens: z.string().describe(
    'Imperfection markers: film grain, dust, stray hair, asymmetry, minor motion blur, natural blemishes. Scale to match the user\'s imperfection setting.',
  ),

  /** AI's creative reasoning — shown in the UI for transparency. */
  reasoning: z.string().describe(
    'Explain your creative decisions in 2-3 sentences. Why did you choose this lighting? Why this pose? What intent did you extrapolate from the user\'s description?',
  ),
});

/** TypeScript type inferred from the Zod schema. */
export type ShotPlan = z.infer<typeof ShotPlanSchema>;

/**
 * JSON Schema representation for Gemini's `responseSchema` parameter.
 * This constrains the model to return valid JSON matching our schema.
 */
export function getShotPlanJsonSchema(): Record<string, unknown> {
  // Build a Gemini-compatible JSON schema
  // Gemini expects a specific format, so we construct it manually
  return {
    type: 'object',
    properties: {
      sceneDescription: { type: 'string' },
      cameraSystem: { type: 'string' },
      lightingSystem: { type: 'string' },
      wardrobePhysics: { type: 'string' },
      poseChoreography: { type: 'string' },
      edgeActivity: { type: 'string' },
      atmosphere: { type: 'string' },
      realismTokens: { type: 'string' },
      imperfectionTokens: { type: 'string' },
      reasoning: { type: 'string' },
    },
    required: [
      'sceneDescription',
      'cameraSystem',
      'lightingSystem',
      'wardrobePhysics',
      'poseChoreography',
      'edgeActivity',
      'atmosphere',
      'realismTokens',
      'imperfectionTokens',
      'reasoning',
    ],
  };
}
