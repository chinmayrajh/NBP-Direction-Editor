/**
 * @module ontology/scenes
 * @description Pre-mapped Scene Environments for the NBP Director compiler.
 *
 * This ontology provides rich, pre-authored scene data that the
 * SceneInjectionPass uses to expand terse environment keys
 * (e.g., "tokyo_night_cafe") into detailed lighting, surface,
 * atmosphere, and edge-activity tokens grounded in physical reality.
 *
 * All data is deterministic — no LLM calls. The ontology is the
 * "world knowledge" layer of the compiler.
 */

import type { CameraStyle, SceneEnvironment } from '../ir/types.js';

// ─────────────────────────────────────────────
// Scene Ontology
// ─────────────────────────────────────────────

/**
 * Record mapping environment keys to structured scene data.
 *
 * Each scene includes:
 * - **lighting**: Light sources and qualities present in the environment.
 * - **surfaces**: Dominant materials and textures.
 * - **atmosphere**: Ambient conditions (humidity, haze, temperature feel).
 * - **edgeActivity**: What's happening at the edges/background of the frame.
 * - **typicalCamera**: The camera style that best captures this scene.
 * - **typicalMood**: The dominant emotional register.
 *
 * @example
 * ```ts
 * import { SCENE_ONTOLOGY } from '../ontology/scenes.js';
 *
 * const scene = SCENE_ONTOLOGY['tokyo_night_cafe'];
 * // scene.lighting => ['neon signage spill', 'warm interior tungsten', ...]
 * ```
 */
export const SCENE_ONTOLOGY: Record<string, SceneEnvironment> = {
  // ── 1. Tokyo Night Café ────────────────────
  tokyo_night_cafe: {
    lighting: [
      'neon signage spill',
      'warm interior tungsten',
      'cool blue from vending machines',
      'reflected wet pavement glow',
      'mixed color temperature 2700K-6500K',
    ],
    surfaces: [
      'rain-slicked asphalt',
      'glass storefront reflections',
      'condensation on windows',
      'worn wooden counter',
      'ceramic cups',
    ],
    atmosphere: [
      'light rain mist',
      'steam from kitchen exhaust',
      'humid night air',
      'slight haze from heat',
    ],
    edgeActivity: [
      'passing pedestrians with umbrellas',
      'distant taxi headlights',
      'kanji signage bokeh',
      'bicycle parked at curb',
    ],
    typicalCamera: 'retro_ccd',
    typicalMood: 'intimate urban solitude',
  },

  // ── 2. Paris Golden Hour Street ────────────
  paris_golden_hour_street: {
    lighting: [
      'low-angle golden sunlight',
      'warm rim light on hair',
      'long cast shadows on cobblestone',
      'reflected warm light from limestone façades',
      'color temperature 3200K',
    ],
    surfaces: [
      'cobblestone pavement',
      'limestone building façades',
      'wrought-iron balcony rails',
      'café bistro chairs',
      'worn wooden tabletops',
    ],
    atmosphere: [
      'warm amber haze',
      'dust motes in sunbeams',
      'dry summer air',
      'faint exhaust shimmer',
    ],
    edgeActivity: [
      'couple walking arm-in-arm',
      'waiter carrying tray',
      'vintage car parked curbside',
      'pigeons on rooftop',
    ],
    typicalCamera: '35mm_street',
    typicalMood: 'romantic nostalgia',
  },

  // ── 3. Scandinavian Window Studio ──────────
  scandinavian_window_studio: {
    lighting: [
      'large north-facing window light',
      'soft diffused daylight',
      'subtle fill from white walls',
      'natural falloff across room',
      'color temperature 5600K',
    ],
    surfaces: [
      'light birch wood flooring',
      'white plastered walls',
      'linen curtains',
      'matte ceramic objects',
      'natural fiber textiles',
    ],
    atmosphere: [
      'clean crisp air',
      'dust motes in window beam',
      'calm stillness',
      'minimal humidity',
    ],
    edgeActivity: [
      'potted monstera plant',
      'books stacked on shelf',
      'simple ceramic vase',
      'daylight gradient on far wall',
    ],
    typicalCamera: 'luxury_editorial',
    typicalMood: 'serene minimalism',
  },

  // ── 4. New York Subway ─────────────────────
  new_york_subway: {
    lighting: [
      'harsh overhead fluorescent',
      'greenish tungsten cast',
      'platform edge safety lighting',
      'approaching train headlight',
      'uneven mixed color temperature',
    ],
    surfaces: [
      'tiled walls with grime',
      'stainless steel columns',
      'concrete platform',
      'scratched plexiglass barriers',
      'rubber floor mat edges',
    ],
    atmosphere: [
      'stale recycled air',
      'warm updraft from tunnel',
      'faint metallic smell impression',
      'slight haze',
    ],
    edgeActivity: [
      'commuters on benches',
      'busker with guitar case',
      'train schedule board',
      'distant tunnel darkness',
    ],
    typicalCamera: '35mm_street',
    typicalMood: 'gritty urban energy',
  },

  // ── 5. Luxury Hotel Lobby ──────────────────
  luxury_hotel_lobby: {
    lighting: [
      'warm chandelier overhead',
      'recessed accent spotlights',
      'table lamp pools of warm light',
      'natural light from entrance',
      'controlled color temperature 3000K',
    ],
    surfaces: [
      'polished marble floor',
      'velvet upholstery',
      'brass fixtures',
      'dark wood paneling',
      'fresh flower arrangements',
    ],
    atmosphere: [
      'climate-controlled comfort',
      'faint fragrance',
      'hushed acoustics',
      'still air',
    ],
    edgeActivity: [
      'concierge at desk',
      'luggage cart passing',
      'guest reading newspaper',
      'elevator doors closing',
    ],
    typicalCamera: 'luxury_editorial',
    typicalMood: 'refined opulence',
  },

  // ── 6. Beach Sunset ────────────────────────
  beach_sunset: {
    lighting: [
      'golden-to-orange horizon light',
      'warm backlight through hair',
      'reflected light from wet sand',
      'sky gradient warm-to-cool',
      'color temperature transitioning 2800K-4500K',
    ],
    surfaces: [
      'wet packed sand',
      'dry powdery sand',
      'ocean foam at shoreline',
      'driftwood texture',
      'seashell fragments',
    ],
    atmosphere: [
      'salt spray in air',
      'humid ocean breeze',
      'warm fading heat',
      'slight lens moisture',
    ],
    edgeActivity: [
      'breaking waves',
      'seagulls in flight',
      'distant sailboat',
      'footprints in sand',
    ],
    typicalCamera: '85mm_portrait',
    typicalMood: 'warm tranquility',
  },

  // ── 7. London Rain Street ──────────────────
  london_rain_street: {
    lighting: [
      'overcast diffused sky',
      'reflected streetlight on wet pavement',
      'warm pub window glow',
      'red telephone box illumination',
      'color temperature 6500K ambient',
    ],
    surfaces: [
      'wet dark asphalt',
      'brick building walls',
      'glossy black cab paint',
      'puddle reflections',
      'weathered stone curbs',
    ],
    atmosphere: [
      'steady drizzle',
      'cool damp air',
      'low hanging clouds',
      'mist reducing visibility',
    ],
    edgeActivity: [
      'pedestrians with umbrellas',
      'double-decker bus passing',
      'black cab tail lights',
      'street vendor under awning',
    ],
    typicalCamera: '35mm_street',
    typicalMood: 'melancholic urbanity',
  },

  // ── 8. Korean Convenience Store ────────────
  korean_convenience_store: {
    lighting: [
      'bright white fluorescent overhead',
      'LED shelf strip lighting',
      'warm display case glow',
      'neon storefront sign through glass',
      'mixed color temperature 4000K-6500K',
    ],
    surfaces: [
      'white tile floor',
      'metal shelving units',
      'plastic product packaging',
      'glass refrigerator doors',
      'laminate counter surface',
    ],
    atmosphere: [
      'air-conditioned cool',
      'faint food warmth from display',
      'clean sterile feel',
      'slight plastic smell impression',
    ],
    edgeActivity: [
      'instant ramen display',
      'soju bottles in fridge',
      'customer at register',
      'late-night street visible through window',
    ],
    typicalCamera: 'retro_ccd',
    typicalMood: 'late-night nostalgia',
  },

  // ── 9. Desert Dusk ─────────────────────────
  desert_dusk: {
    lighting: [
      'deep orange-to-purple sky gradient',
      'last horizontal sun rays',
      'warm sand reflected fill light',
      'emerging cool blue twilight',
      'color temperature transitioning 2500K-7000K',
    ],
    surfaces: [
      'fine wind-rippled sand',
      'cracked dry earth patches',
      'weathered sandstone rocks',
      'sparse desert brush',
      'sun-bleached bone fragments',
    ],
    atmosphere: [
      'dry still air',
      'radiant ground heat',
      'fine airborne sand particles',
      'vast open space',
    ],
    edgeActivity: [
      'distant mesa silhouettes',
      'hawk circling overhead',
      'Joshua tree outlines',
      'tire tracks in sand',
    ],
    typicalCamera: 'cinema_lens',
    typicalMood: 'vast existential solitude',
  },

  // ── 10. Cozy Bookshop ─────────────────────
  cozy_bookshop: {
    lighting: [
      'warm reading lamp pools',
      'overhead pendant with warm bulb',
      'natural light from small window',
      'spine-level shelf shadow play',
      'color temperature 2700K-3200K',
    ],
    surfaces: [
      'dark wood bookshelves',
      'worn leather armchair',
      'paper book textures',
      'aged hardwood floor',
      'wool area rug',
    ],
    atmosphere: [
      'dust and old paper scent impression',
      'quiet muffled acoustics',
      'warm dry air',
      'slight dust motes in lamplight',
    ],
    edgeActivity: [
      'stacked books on side table',
      'reading glasses left open',
      'ceramic mug with tea',
      'cat sleeping on chair arm',
    ],
    typicalCamera: '85mm_portrait',
    typicalMood: 'intellectual warmth',
  },

  // ── 11. Rooftop Bar ───────────────────────
  rooftop_bar: {
    lighting: [
      'string light overhead canopy',
      'city skyline ambient glow',
      'candle table accents',
      'backbar LED underlighting',
      'mixed color temperature 2700K-5000K',
    ],
    surfaces: [
      'concrete floor with expansion joints',
      'reclaimed wood bar top',
      'glass railing panels',
      'metal bar stools',
      'cocktail glassware condensation',
    ],
    atmosphere: [
      'warm evening breeze',
      'slight urban haze',
      'music bass vibration impression',
      'open sky above',
    ],
    edgeActivity: [
      'city skyline panorama',
      'other guests in conversation',
      'bartender mixing drinks',
      'helicopter light in distance',
    ],
    typicalCamera: '35mm_street',
    typicalMood: 'social elevated cool',
  },

  // ── 12. Greenhouse Botanical ──────────────
  greenhouse_botanical: {
    lighting: [
      'filtered sunlight through glass panels',
      'dappled leaf shadows',
      'humid diffused warmth',
      'green color cast from foliage',
      'color temperature 5200K with green shift',
    ],
    surfaces: [
      'mossy brick pathways',
      'condensation on glass walls',
      'terracotta pots',
      'tropical leaf textures',
      'wrought-iron plant stands',
    ],
    atmosphere: [
      'high humidity',
      'warm tropical air',
      'earthy organic scent impression',
      'gentle dripping water sound impression',
    ],
    edgeActivity: [
      'hanging ferns overhead',
      'orchid display',
      'small fountain or water feature',
      'garden tools propped against wall',
    ],
    typicalCamera: '85mm_portrait',
    typicalMood: 'lush natural serenity',
  },
} as const;

// ─────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────

/**
 * Retrieves a scene from the ontology by its environment key.
 *
 * @param key - The environment key (e.g., 'tokyo_night_cafe').
 * @returns The SceneEnvironment if found, or `undefined`.
 */
export function getScene(key: string): SceneEnvironment | undefined {
  return SCENE_ONTOLOGY[key];
}

/**
 * Returns all available scene environment keys.
 *
 * @returns An array of registered scene keys.
 */
export function getAvailableScenes(): string[] {
  return Object.keys(SCENE_ONTOLOGY);
}

/**
 * Checks if a given environment key exists in the ontology.
 *
 * @param key - The environment key to check.
 * @returns `true` if the scene is registered.
 */
export function hasScene(key: string): boolean {
  return key in SCENE_ONTOLOGY;
}
