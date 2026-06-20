/**
 * @module compiler/inject-composition
 * @description Pass 6 — Inject Composition.
 *
 * Enriches the edgeActivity and atmosphere prompt modules based on
 * scene keywords from the intent. When edge activity is weak or empty,
 * default foreground elements are injected. Composition depth layers
 * (foreground / midground / background) are added to atmosphere if missing.
 *
 * This is a pure function: the input modules are cloned, never mutated.
 */

import type { PromptModules, IntentIR } from '../ir/types.js';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** Default foreground elements injected when edgeActivity is weak. */
const DEFAULT_FOREGROUND_ELEMENTS: readonly string[] = [
  'foreground object blur',
  'peripheral movement',
  'edge-of-frame detail',
  'subtle foreground bokeh element',
] as const;

/** Depth layer tokens that ensure spatial composition. */
const DEPTH_LAYER_TOKENS: readonly string[] = [
  'distinct foreground layer',
  'midground subject plane',
  'receding background depth',
] as const;

/** Scene keyword → edge activity enrichment mappings. */
const SCENE_EDGE_ENRICHMENTS: Readonly<Record<string, string[]>> = {
  street: ['passing pedestrians in background', 'vehicle motion blur at frame edge'],
  cafe: ['coffee cup foreground blur', 'ambient patron movement'],
  park: ['wind-blown foliage at frame edge', 'dappled light foreground'],
  beach: ['sand texture foreground', 'wave motion at frame edge'],
  city: ['urban light bokeh background', 'architectural depth layers'],
  rooftop: ['skyline depth layers', 'atmospheric haze gradient'],
  studio: ['controlled negative space', 'seamless background gradient'],
  night: ['neon bokeh in background', 'light trail streaks at edge'],
  indoor: ['doorframe or window edge element', 'interior depth perspective'],
  garden: ['botanical foreground blur', 'natural depth layering'],
} as const;

/** Scene keyword → atmosphere enrichment mappings. */
const SCENE_ATMOSPHERE_ENRICHMENTS: Readonly<Record<string, string[]>> = {
  street: ['urban haze', 'concrete texture reflections'],
  cafe: ['warm interior ambiance', 'steam wisps'],
  park: ['natural light filtering through canopy', 'grass and earth tones'],
  beach: ['salt air atmosphere', 'sun glare on water'],
  city: ['urban atmospheric perspective', 'building light reflections'],
  rooftop: ['elevated atmospheric perspective', 'sky gradient backdrop'],
  night: ['nocturnal atmosphere', 'artificial light color spill'],
  rain: ['wet surface reflections', 'rain streak motion'],
  golden: ['warm golden atmospheric glow', 'long shadow depth'],
  winter: ['cool atmospheric tone', 'frost texture detail'],
} as const;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Determines if the edge activity content is "weak" — empty or too short
 * to provide meaningful spatial context.
 *
 * @param edgeActivity - Current edge activity token string.
 * @returns `true` if the content is considered weak.
 */
function isEdgeActivityWeak(edgeActivity: string): boolean {
  const trimmed = edgeActivity.trim();
  return trimmed.length === 0 || trimmed.split(/\s+/).length < 3;
}

/**
 * Checks whether depth layer keywords are already present in the
 * atmosphere module content.
 *
 * @param atmosphere - Current atmosphere token string.
 * @returns `true` if depth layers are already present.
 */
function hasDepthLayers(atmosphere: string): boolean {
  const lower = atmosphere.toLowerCase();
  return (
    lower.includes('foreground') &&
    lower.includes('midground') &&
    lower.includes('background')
  );
}

/**
 * Extracts matching scene keywords from the intent's scene description.
 *
 * @param scene - The scene description string.
 * @param keywordMap - Map of keywords to enrichment tokens.
 * @returns Array of matched enrichment token arrays.
 */
function matchSceneKeywords(
  scene: string,
  keywordMap: Readonly<Record<string, string[]>>,
): string[] {
  const lower = scene.toLowerCase();
  const results: string[] = [];

  for (const [keyword, tokens] of Object.entries(keywordMap)) {
    if (lower.includes(keyword)) {
      results.push(...tokens);
    }
  }

  return results;
}

// ─────────────────────────────────────────────
// Pass 6: Inject Composition
// ─────────────────────────────────────────────

/**
 * Enriches the edgeActivity and atmosphere modules based on scene keywords.
 *
 * 1. If edgeActivity is weak/empty, injects default foreground elements.
 * 2. Matches scene keywords against enrichment tables for edge activity.
 * 3. Matches scene keywords against enrichment tables for atmosphere.
 * 4. Ensures composition depth layers (foreground/midground/background)
 *    are present in the atmosphere module.
 *
 * @param modules - The current prompt modules (not mutated).
 * @param intent - The normalized intent IR with scene description.
 * @returns A new PromptModules object with enriched composition data.
 */
export function injectComposition(
  modules: PromptModules,
  intent: IntentIR,
): PromptModules {
  // Clone to avoid mutation
  const result: PromptModules = {
    ...modules,
    negativePrompt: [...modules.negativePrompt],
  };

  // ── Enrich Edge Activity ──────────────────────────────────────────────

  const edgeParts: string[] = [];

  // Start with existing content if it's meaningful
  if (!isEdgeActivityWeak(modules.edgeActivity)) {
    edgeParts.push(modules.edgeActivity.trim());
  }

  // Inject default foreground elements if edge activity was weak
  if (isEdgeActivityWeak(modules.edgeActivity)) {
    edgeParts.push(DEFAULT_FOREGROUND_ELEMENTS.join(', '));
  }

  // Add scene-specific edge enrichments
  const edgeEnrichments = matchSceneKeywords(
    intent.scene,
    SCENE_EDGE_ENRICHMENTS,
  );
  if (edgeEnrichments.length > 0) {
    edgeParts.push(edgeEnrichments.join(', '));
  }

  result.edgeActivity = edgeParts.join(', ');

  // ── Enrich Atmosphere ─────────────────────────────────────────────────

  const atmoParts: string[] = [];

  // Preserve existing atmosphere
  if (modules.atmosphere.trim().length > 0) {
    atmoParts.push(modules.atmosphere.trim());
  }

  // Add scene-specific atmosphere enrichments
  const atmoEnrichments = matchSceneKeywords(
    intent.scene,
    SCENE_ATMOSPHERE_ENRICHMENTS,
  );
  if (atmoEnrichments.length > 0) {
    atmoParts.push(atmoEnrichments.join(', '));
  }

  // Ensure depth layers are present
  if (!hasDepthLayers(modules.atmosphere)) {
    atmoParts.push(DEPTH_LAYER_TOKENS.join(', '));
  }

  result.atmosphere = atmoParts.join(', ');

  return result;
}
