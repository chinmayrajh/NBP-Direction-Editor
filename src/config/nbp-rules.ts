/**
 * @module config/nbp-rules
 * @description Central Prompt Governance for the NBP Director compiler.
 *
 * Contains all deterministic mappings that the compiler uses to inject
 * realism tokens, imperfection tokens, camera physics, lighting physics,
 * identity-lock strings, and negative prompt defaults.
 *
 * This is the "hard-coded physics layer" — no LLM calls involved.
 */

import type {
  CameraStyle,
  LightingStyle,
  RealismLevel,
  ImperfectionLevel,
  LockedElement,
  CameraPhysicsSpec,
  LightingPhysicsSpec,
} from '../ir/types.js';

// ─────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────

/** Complete NBP rules configuration. */
export interface NBPRulesConfig {
  /** Words that produce AI-looking results and must be banned from prompts. */
  readonly bannedWords: readonly string[];

  /** Realism injection tokens keyed by level 1–5. */
  readonly realismTokens: Record<RealismLevel, readonly string[]>;

  /** Imperfection injection tokens keyed by level 1–5. */
  readonly imperfectionTokens: Record<ImperfectionLevel, readonly string[]>;

  /** Physical camera properties keyed by CameraStyle. */
  readonly cameraPhysics: Record<CameraStyle, CameraPhysicsSpec>;

  /** Physical lighting properties keyed by LightingStyle. */
  readonly lightingPhysics: Record<LightingStyle, LightingPhysicsSpec>;

  /** Default negative prompt tokens always injected. */
  readonly negativePromptDefaults: readonly string[];

  /** Identity lock injection strings keyed by LockedElement. */
  readonly identityLockTokens: Record<LockedElement, string>;
}

// ─────────────────────────────────────────────
// Banned Words
// ─────────────────────────────────────────────

/**
 * Words that consistently produce an "AI-generated" aesthetic.
 * The BannedWordsPass strips these from any user-supplied text
 * before prompt assembly.
 */
const bannedWords: readonly string[] = [
  'masterpiece',
  'beautiful',
  'award winning',
  'best quality',
  'ultra detailed',
  'perfect',
  'stunning',
  'gorgeous',
  'breathtaking',
  'magnificent',
  'exquisite',
  'flawless',
  'impeccable',
  'sublime',
  'transcendent',
  'divine',
  'ethereal',
  'majestic',
  'spectacular',
  'extraordinary',
  'hyperrealistic',
  'photorealistic',
  'unreal engine',
  'octane render',
  'highly detailed',
] as const;

// ─────────────────────────────────────────────
// Realism Tokens (Level 1–5)
// ─────────────────────────────────────────────

/**
 * Progressive realism tokens injected based on the user's
 * chosen realism level. Higher levels add physiological
 * micro-detail that pushes generated images toward documentary
 * and forensic fidelity.
 */
const realismTokens: Record<RealismLevel, readonly string[]> = {
  1: [
    'clean skin',
    'even lighting',
    'soft focus',
  ],
  2: [
    'natural skin texture',
    'ambient occlusion',
    'realistic proportions',
  ],
  3: [
    'visible pores',
    'natural skin variation',
    'subsurface scattering hints',
    'fabric weave visible',
  ],
  4: [
    'micro-pores visible',
    'skin imperfections',
    'natural blemishes',
    'fabric tension lines',
    'environmental wear',
  ],
  5: [
    'vellus hair',
    'micro-pores',
    'compression creases',
    'sebaceous detail',
    'fabric pill',
    'sensor grain',
    'chromatic aberration hints',
  ],
};

// ─────────────────────────────────────────────
// Imperfection Tokens (Level 1–5)
// ─────────────────────────────────────────────

/**
 * Progressive imperfection tokens that add optical and
 * physical artifacts. These fight the "too perfect" look
 * that AI generators default to.
 */
const imperfectionTokens: Record<ImperfectionLevel, readonly string[]> = {
  1: [
    'clean lens',
    'minimal noise',
    'sharp focus',
  ],
  2: [
    'subtle film grain',
    'minor lens softness',
  ],
  3: [
    'visible grain',
    'stray hair',
    'slight asymmetry',
    'minor motion blur',
  ],
  4: [
    'heavy grain',
    'lens dust',
    'sweat beads',
    'flyaway hair',
    'micro asymmetry',
  ],
  5: [
    'sensor bloom',
    'motion blur',
    'lens imperfections',
    'dirt on lens',
    'deep asymmetry',
    'bokeh fringing',
  ],
};

// ─────────────────────────────────────────────
// Camera Physics
// ─────────────────────────────────────────────

/**
 * Physical camera properties derived from each CameraStyle.
 * These inject focal-length, aperture, sensor, and rendering
 * characteristics that ground prompts in real optics.
 */
const cameraPhysics: Record<CameraStyle, CameraPhysicsSpec> = {
  iphone: {
    focalLength: '26mm equiv',
    aperture: 'f/1.8',
    sensor: 'small sensor',
    characteristics: [
      'computational HDR',
      'deep depth of field',
      'slight noise in shadows',
    ],
  },
  '35mm_street': {
    focalLength: '35mm',
    aperture: 'f/2.8',
    sensor: 'full frame',
    characteristics: [
      'moderate depth of field',
      'natural distortion',
      'street grain',
    ],
  },
  '85mm_portrait': {
    focalLength: '85mm',
    aperture: 'f/1.4',
    sensor: 'full frame',
    characteristics: [
      'shallow depth of field',
      'background compression',
      'creamy bokeh',
      'subject isolation',
    ],
  },
  retro_ccd: {
    focalLength: '38mm equiv',
    aperture: 'f/2.8',
    sensor: 'CCD sensor',
    characteristics: [
      'CCD color science',
      'highlight bloom',
      'limited dynamic range',
      'warm cast',
    ],
  },
  cinema_lens: {
    focalLength: '50mm anamorphic equiv',
    aperture: 'f/2.0',
    sensor: 'Super 35',
    characteristics: [
      'anamorphic flare',
      'oval bokeh',
      'cinematic color grading',
      'film halation',
    ],
  },
  luxury_editorial: {
    focalLength: '105mm',
    aperture: 'f/2.0',
    sensor: 'medium format',
    characteristics: [
      'extreme subject isolation',
      'medium format rendering',
      'tonal richness',
      'micro contrast',
    ],
  },
};

// ─────────────────────────────────────────────
// Lighting Physics
// ─────────────────────────────────────────────

/**
 * Physical lighting properties derived from each LightingStyle.
 * These inject color temperature, direction, quality, and
 * secondary characteristics that ground prompts in real light.
 */
const lightingPhysics: Record<LightingStyle, LightingPhysicsSpec> = {
  golden_hour: {
    colorTemp: '3200K',
    direction: 'low angle side',
    quality: 'warm diffused',
    characteristics: [
      'long shadows',
      'warm skin tones',
      'rim highlights',
    ],
  },
  direct_flash: {
    colorTemp: '5500K',
    direction: 'on-axis',
    quality: 'hard',
    characteristics: [
      'harsh shadows',
      'red eye risk',
      'flat foreground',
      'dark background falloff',
    ],
  },
  window_light: {
    colorTemp: '5600K',
    direction: 'side',
    quality: 'soft diffused',
    characteristics: [
      'natural falloff',
      'soft shadows',
      'even gradation',
    ],
  },
  neon_night: {
    colorTemp: 'mixed 2700K-6500K',
    direction: 'environmental',
    quality: 'colored mixed',
    characteristics: [
      'color spill',
      'neon reflections',
      'high contrast',
      'deep shadows',
    ],
  },
  studio: {
    colorTemp: '5500K',
    direction: 'key + fill + rim',
    quality: 'controlled',
    characteristics: [
      'precise falloff',
      'controlled shadows',
      'clean separation',
    ],
  },
  overcast: {
    colorTemp: '6500K',
    direction: 'overhead diffused',
    quality: 'extremely soft',
    characteristics: [
      'no hard shadows',
      'flat even light',
      'muted colors',
    ],
  },
};

// ─────────────────────────────────────────────
// Negative Prompt Defaults
// ─────────────────────────────────────────────

/**
 * Default negative prompt tokens always injected regardless
 * of user input. These suppress common AI failure modes.
 */
const negativePromptDefaults: readonly string[] = [
  'cartoon',
  'anime',
  'illustration',
  'painting',
  'drawing',
  'sketch',
  'CGI',
  'render',
  '3D',
  'artificial lighting artifacts',
  'oversaturated',
  'overexposed',
  'underexposed',
  'blurry',
  'watermark',
  'text',
  'logo',
  'deformed',
  'mutated',
  'extra limbs',
  'disfigured',
  'bad anatomy',
  'bad proportions',
  'duplicate',
] as const;

// ─────────────────────────────────────────────
// Identity Lock Tokens
// ─────────────────────────────────────────────

/**
 * Injection strings for each lockable element. When a user
 * locks an element, these tokens are injected to prevent
 * the generator from drifting that element.
 */
const identityLockTokens: Record<LockedElement, string> = {
  face: 'preserve exact facial geometry, maintain jawline angle, preserve inter-pupillary distance, maintain nose bridge width, keep exact lip proportions, preserve facial symmetry patterns',
  hair: 'maintain exact hairstyle, preserve hair texture and volume, keep hair color and highlights, maintain hairline position',
  pose: 'preserve exact body position, maintain weight distribution, keep limb angles, preserve posture',
  lighting: 'maintain existing light sources, preserve shadow directions, keep highlight positions, maintain color temperature',
  outfit: 'preserve exact garment, maintain fabric type and color, keep clothing fit, preserve accessories',
  environment: 'maintain background setting, preserve environmental elements, keep spatial relationships, maintain depth layers',
};

// ─────────────────────────────────────────────
// Assembled Export
// ─────────────────────────────────────────────

/**
 * Central NBP rules configuration.
 *
 * This is the single source of truth for all deterministic
 * prompt governance in the compiler. Every pass that needs
 * physics data, banned words, or injection tokens reads
 * from this object.
 *
 * @example
 * ```ts
 * import { NBP_RULES } from '../config/nbp-rules.js';
 *
 * const tokens = NBP_RULES.realismTokens[3];
 * // => ['visible pores', 'natural skin variation', ...]
 * ```
 */
export const NBP_RULES: NBPRulesConfig = {
  bannedWords,
  realismTokens,
  imperfectionTokens,
  cameraPhysics,
  lightingPhysics,
  negativePromptDefaults,
  identityLockTokens,
} as const;
