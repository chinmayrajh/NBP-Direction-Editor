// ─────────────────────────────────────────────────────────────────────────────
// NBP Director — Domain-Specific Language Types
// ─────────────────────────────────────────────────────────────────────────────
// The DSL layer sits between raw user input and the IR. User intent is first
// compiled into these typed DSL structures, which are then expanded by the
// photography-injection and realism-injection passes into full prompt tokens.
// ─────────────────────────────────────────────────────────────────────────────

import type { PromptModules } from '../ir/types.js';

// ═══════════════════════════════════════════════════════════════════════════════
// §1  DSL Literal Types
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Time-of-day presets that map to lighting temperature + shadow angle tables.
 */
export type TimeOfDay =
  | 'dawn'
  | 'golden_hour_morning'
  | 'midday'
  | 'afternoon'
  | 'golden_hour_evening'
  | 'blue_hour'
  | 'night';

/**
 * Weather conditions that affect atmosphere, lighting, and material rendering.
 */
export type Weather =
  | 'clear'
  | 'overcast'
  | 'partly_cloudy'
  | 'rain'
  | 'snow'
  | 'fog'
  | 'haze'
  | 'storm';

/**
 * Compositional framing preset.
 */
export type FramingPreset =
  | 'extreme_close_up'
  | 'close_up'
  | 'medium_close_up'
  | 'medium_shot'
  | 'medium_full'
  | 'full_body'
  | 'wide'
  | 'establishing';

/**
 * Lens type classification for the camera DSL.
 */
export type LensType =
  | 'wide_angle'
  | 'normal'
  | 'short_telephoto'
  | 'telephoto'
  | 'macro'
  | 'tilt_shift';

/**
 * Sensor type simulation.
 */
export type SensorType =
  | 'phone_sensor'
  | 'aps_c'
  | 'full_frame'
  | 'medium_format'
  | 'large_format'
  | 'ccd_vintage';

/**
 * Light source descriptor used in the lighting DSL.
 */
export type LightSourceType =
  | 'natural_sun'
  | 'natural_diffused'
  | 'window'
  | 'softbox'
  | 'beauty_dish'
  | 'ring_light'
  | 'fresnel'
  | 'practical'
  | 'neon'
  | 'led_panel'
  | 'flash'
  | 'reflector'
  | 'candle'
  | 'ambient_bounce';

/**
 * Shadow falloff characteristic.
 */
export type FalloffType =
  | 'gradual'
  | 'medium'
  | 'sharp'
  | 'none';

/**
 * Garment category in the wardrobe DSL.
 */
export type GarmentCategory =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'outerwear'
  | 'suit'
  | 'activewear'
  | 'swimwear'
  | 'lingerie'
  | 'traditional'
  | 'accessory'
  | 'footwear';

/**
 * Fabric fit descriptor.
 */
export type FitType =
  | 'skin_tight'
  | 'fitted'
  | 'relaxed'
  | 'oversized'
  | 'draped'
  | 'structured'
  | 'tailored';

/**
 * Lens distortion profile.
 */
export type DistortionProfile =
  | 'none'
  | 'barrel_slight'
  | 'barrel_moderate'
  | 'barrel_heavy'
  | 'pincushion'
  | 'mustache';

// ═══════════════════════════════════════════════════════════════════════════════
// §2  Scene DSL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Describes the physical scene / environment in structured form.
 *
 * The normalize-inputs pass compiles free-text scene descriptions into this
 * typed structure so that downstream passes can reason about physical
 * plausibility (e.g. "outdoor golden-hour scene can't have studio softboxes").
 */
export type SceneDSL = {
  /** Location descriptor (e.g. "rooftop terrace in downtown Manhattan"). */
  location: string;
  /** Weather conditions affecting atmosphere and lighting. */
  weather: Weather;
  /** Time of day — drives lighting temperature and shadow angle. */
  timeOfDay: TimeOfDay;
  /** Emotional register / mood of the scene. */
  mood: string;
  /**
   * Realism dial for the scene environment itself.
   * Range: 1 (stylized) – 5 (photo-real).
   */
  realism: number;
  /** Compositional framing preset. */
  framing: FramingPreset;
  /** Primary lighting descriptor for the scene. */
  lighting: string;
  /**
   * Edge-of-frame activity: peripheral details that add life and depth.
   * E.g. "couple walking out of focus in background", "taxi headlights".
   */
  edgeActivity: string;
  /**
   * Layered atmosphere descriptors, ordered from closest to farthest.
   * E.g. ["cigarette smoke in foreground", "neon reflections on wet ground", "distant city skyline haze"]
   */
  atmosphere: string[];
};

// ═══════════════════════════════════════════════════════════════════════════════
// §3  Camera DSL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Structured camera configuration compiled from the user's camera-style choice.
 *
 * Each field maps to specific prompt tokens that simulate the optical
 * characteristics of real camera systems.
 */
export type CameraDSL = {
  /** Lens type classification. */
  lens: LensType;
  /**
   * Focal length in millimeters.
   * Affects perspective compression, background blur, and distortion.
   */
  focalLength: number;
  /**
   * Aperture f-stop value.
   * Lower = shallower depth of field, stronger bokeh.
   */
  aperture: number;
  /** Sensor type simulation, affecting noise characteristics and dynamic range. */
  sensorType: SensorType;
  /**
   * Optional film-stock simulation.
   * When specified, overrides digital rendering with film-specific color science
   * and grain structure (e.g. "Kodak Portra 400", "Fuji Pro 400H", "Ilford HP5").
   */
  filmStock?: string;
  /** Lens distortion profile. */
  distortion: DistortionProfile;
};

// ═══════════════════════════════════════════════════════════════════════════════
// §4  Lighting DSL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * A single light source specification.
 */
export type LightSource = {
  /** Type of light source. */
  type: LightSourceType;
  /** Direction the light is coming from (e.g. "45° camera-left, 30° above"). */
  direction: string;
  /**
   * Relative intensity.
   * Range: 0.0 (off) – 1.0 (full power).
   */
  intensity: number;
  /** Optional modifier (e.g. "through sheer curtain", "with barn doors"). */
  modifier?: string;
};

/**
 * Structured lighting setup compiled from the user's lighting-style choice.
 *
 * Supports multi-source lighting rigs with explicit color temperature,
 * falloff, and shadow control.
 */
export type LightingDSL = {
  /** Primary / key light source. */
  primary: LightSource;
  /** Optional secondary / fill light source. */
  secondary?: LightSource;
  /** Ambient light descriptor (e.g. "warm room bounce", "cool sky fill"). */
  ambient: string;
  /**
   * Color temperature in Kelvin.
   * 2700 = warm tungsten, 4000 = neutral, 5600 = daylight, 7500 = overcast blue.
   */
  colorTemperature: number;
  /** Shadow edge falloff characteristic. */
  falloff: FalloffType;
  /** Shadow quality descriptor. */
  shadows: string;
};

// ═══════════════════════════════════════════════════════════════════════════════
// §5  Wardrobe DSL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Structured wardrobe specification with material-physics descriptors.
 *
 * The wardrobe DSL captures not just *what* the subject wears but *how*
 * the fabric behaves — drape, crease patterns, light interaction — which
 * are critical tokens for defeating the "AI plastic sheen" look.
 */
export type WardrobeDSL = {
  /** Garment category. */
  garmentType: GarmentCategory;
  /** Fabric / material name (e.g. "raw silk dupioni", "washed cotton jersey"). */
  material: string;
  /** How the garment fits the body. */
  fit: FitType;
  /** Primary color descriptor (e.g. "ivory", "charcoal", "dusty rose"). */
  color: string;
  /** Texture descriptor for realism (e.g. "visible weave", "slight pilling", "matte finish"). */
  texture: string;
  /**
   * Physics detail tokens describing how the fabric interacts with the body
   * and environment (e.g. "drapes heavily over left shoulder", "wind catch at hem").
   */
  physicsDetail: string;
};

// ═══════════════════════════════════════════════════════════════════════════════
// §6  Realism DSL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Realism-dial specification controlling per-domain detail injection.
 *
 * Each sub-field scales independently so the user can, for example,
 * request hyper-real skin but stylized environment.
 */
export type RealismDSL = {
  /**
   * Global realism level.
   * Range: 1 (illustrative / stylized) – 5 (indistinguishable from photo).
   */
  level: number;
  /**
   * Skin detail level.
   * 1 = smooth/airbrushed, 3 = natural pores, 5 = hyper-detailed (pores, peach fuzz, veins).
   */
  skinDetail: number;
  /**
   * Fabric / material detail level.
   * 1 = flat color, 3 = visible weave, 5 = macro thread-level detail.
   */
  fabricDetail: number;
  /**
   * Environment detail level.
   * 1 = bokeh blur / abstracted, 3 = recognizable context, 5 = full scene fidelity.
   */
  environmentDetail: number;
  /**
   * Whether to inject optical imperfections: chromatic aberration, vignetting,
   * barrel distortion, lens flare. Controlled by the camera DSL but gated by
   * the realism dial.
   */
  lensArtifacts: boolean;
};

// ═══════════════════════════════════════════════════════════════════════════════
// §7  Edit Intent DSL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Describes a partial-edit intent against an existing prompt.
 *
 * Used by the `preserve_enhance`, `wardrobe_swap`, and `lighting_edit` modes
 * to express which modules to keep, which to modify, and which to
 * strengthen or weaken without full regeneration.
 */
export type EditIntentDSL = {
  /** Modules to preserve verbatim from the current prompt. */
  preserve: (keyof PromptModules)[];
  /**
   * Modules to modify with new content.
   * Keys are module names; values are the new content strings.
   */
  modify: Partial<Record<keyof PromptModules, string>>;
  /** Modules to strengthen (increase emphasis weight). */
  strengthen: (keyof PromptModules)[];
  /** Modules to weaken (decrease emphasis weight). */
  weaken: (keyof PromptModules)[];
};

// ═══════════════════════════════════════════════════════════════════════════════
// §8  Composite DSL Input
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * The complete compiled DSL representation of a user's creative intent.
 *
 * This is the output of the normalize-inputs pass's DSL compilation stage
 * and serves as the structured input to all subsequent compiler passes.
 */
export type CompiledDSL = {
  /** Scene / environment specification. */
  scene: SceneDSL;
  /** Camera system specification. */
  camera: CameraDSL;
  /** Lighting rig specification. */
  lighting: LightingDSL;
  /** Wardrobe specification (optional for scenes without a visible subject). */
  wardrobe?: WardrobeDSL;
  /** Realism dial settings. */
  realism: RealismDSL;
  /** Edit intent for partial-modification modes. */
  editIntent?: EditIntentDSL;
};
