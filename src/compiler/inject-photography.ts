/**
 * @module compiler/inject-photography
 * @description **Pass 4 — Inject Photography.**
 *
 * Expands the user's high-level intent (camera style, lighting style, mood)
 * into a granular, physically-plausible photography plan covering camera
 * configuration, composition, lighting rig, wardrobe, atmosphere, and pose.
 *
 * All mappings are deterministic — derived from {@link NBP_RULES} and
 * the {@link SCENE_ONTOLOGY}. No LLM calls.
 *
 * This is a **pure function** — takes IR input, returns transformed IR output.
 */

import type {
  IntentIR,
  IdentityIR,
  PhotographyPlanIR,
  CameraPlan,
  CompositionPlan,
  LightingPlan,
  WardrobePlan,
  AtmospherePlan,
  PoseLogic,
  CameraStyle,
  LightingStyle,
  Mood,
} from '../ir/types.js';
import { NBP_RULES } from '../config/nbp-rules.js';
import { SCENE_ONTOLOGY } from '../ontology/scenes.js';

// ─────────────────────────────────────────────
// Internal Helpers — Camera
// ─────────────────────────────────────────────

/**
 * Parses a focal-length string like "85mm" or "26mm equiv" into a number.
 *
 * @param focalLengthStr - The focal length string from camera physics spec.
 * @returns Numeric focal length in mm.
 */
function parseFocalLength(focalLengthStr: string): number {
  const match = focalLengthStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 50;
}

/**
 * Parses an aperture string like "f/1.4" into a number.
 *
 * @param apertureStr - The aperture string from camera physics spec.
 * @returns Numeric aperture f-stop value.
 */
function parseAperture(apertureStr: string): number {
  const match = apertureStr.match(/f\/([\d.]+)/);
  return match ? parseFloat(match[1]) : 2.8;
}

/**
 * Builds a camera plan from the camera style using NBP_RULES physics.
 *
 * @param cameraStyle - The selected camera style.
 * @returns A fully specified CameraPlan.
 */
function buildCameraPlan(cameraStyle: CameraStyle): CameraPlan {
  const spec = NBP_RULES.cameraPhysics[cameraStyle];

  /** Map camera styles to distortion profiles */
  const distortionMap: Record<CameraStyle, string> = {
    iphone: 'barrel_slight',
    '35mm_street': 'barrel_slight',
    '85mm_portrait': 'none',
    retro_ccd: 'barrel_slight',
    cinema_lens: 'barrel_moderate',
    luxury_editorial: 'none',
  };

  /** Map camera styles to film stock presets */
  const filmStockMap: Partial<Record<CameraStyle, string>> = {
    '35mm_street': 'Kodak Tri-X 400',
    retro_ccd: 'CCD digital circa 2006',
    cinema_lens: 'Kodak Vision3 500T',
  };

  /** Map camera styles to ISO values */
  const isoMap: Record<CameraStyle, number> = {
    iphone: 200,
    '35mm_street': 400,
    '85mm_portrait': 100,
    retro_ccd: 200,
    cinema_lens: 500,
    luxury_editorial: 100,
  };

  return {
    style: cameraStyle,
    focalLength: parseFocalLength(spec.focalLength),
    aperture: parseAperture(spec.aperture),
    sensorType: spec.sensor,
    filmStock: filmStockMap[cameraStyle],
    distortion: distortionMap[cameraStyle],
    iso: isoMap[cameraStyle],
    shutterSpeed: '1/125',
  };
}

// ─────────────────────────────────────────────
// Internal Helpers — Composition
// ─────────────────────────────────────────────

/**
 * Builds a composition plan based on the camera style.
 *
 * Different camera systems imply different framing conventions:
 * - 85mm portrait = close-up, centered subject
 * - 35mm street = rule of thirds, medium shot
 * - cinema lens = widescreen, cinematic framing
 *
 * @param cameraStyle - The selected camera style.
 * @returns A fully specified CompositionPlan.
 */
function buildCompositionPlan(cameraStyle: CameraStyle): CompositionPlan {
  const compositionMap: Record<CameraStyle, CompositionPlan> = {
    iphone: {
      framework: 'casual_center',
      shotType: 'medium',
      cameraAngle: 'eye_level',
      subjectPlacement: 'center',
      depthLayers: ['subject', 'background'],
      aspectRatio: '4:3',
      negativeSpace: 'minimal',
    },
    '35mm_street': {
      framework: 'rule_of_thirds',
      shotType: 'medium',
      cameraAngle: 'eye_level',
      subjectPlacement: 'left_third',
      depthLayers: ['foreground_element', 'subject', 'street_background'],
      aspectRatio: '3:2',
      negativeSpace: 'moderate environmental context',
      leadingLines: 'street perspective lines',
    },
    '85mm_portrait': {
      framework: 'center_dominant',
      shotType: 'close-up',
      cameraAngle: 'eye_level',
      subjectPlacement: 'center',
      depthLayers: ['subject', 'soft_bokeh_background'],
      aspectRatio: '3:2',
      negativeSpace: 'bokeh negative space surrounding subject',
    },
    retro_ccd: {
      framework: 'casual_offset',
      shotType: 'medium',
      cameraAngle: 'slight_low_angle',
      subjectPlacement: 'off_center_right',
      depthLayers: ['subject', 'environment'],
      aspectRatio: '4:3',
      negativeSpace: 'environmental context fills frame',
    },
    cinema_lens: {
      framework: 'cinematic_widescreen',
      shotType: 'medium',
      cameraAngle: 'low_angle',
      subjectPlacement: 'left_third',
      depthLayers: ['foreground_depth', 'subject', 'atmospheric_background'],
      aspectRatio: '2.39:1',
      negativeSpace: 'dramatic negative space',
      leadingLines: 'environmental leading lines to subject',
    },
    luxury_editorial: {
      framework: 'editorial_asymmetry',
      shotType: 'medium_close_up',
      cameraAngle: 'slight_high_angle',
      subjectPlacement: 'golden_ratio',
      depthLayers: ['subject', 'minimal_curated_background'],
      aspectRatio: '4:5',
      negativeSpace: 'controlled negative space for editorial breathing room',
    },
  };

  return compositionMap[cameraStyle];
}

// ─────────────────────────────────────────────
// Internal Helpers — Lighting
// ─────────────────────────────────────────────

/**
 * Parses a color temperature string like "3200K" or "mixed 2700K-6500K"
 * into a representative numeric value.
 *
 * @param colorTempStr - The color temperature string.
 * @returns Numeric color temperature in Kelvin.
 */
function parseColorTemp(colorTempStr: string): number {
  const match = colorTempStr.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : 5500;
}

/**
 * Builds a lighting plan from the lighting style using NBP_RULES physics.
 *
 * @param lightingStyle - The selected lighting style.
 * @returns A fully specified LightingPlan.
 */
function buildLightingPlan(lightingStyle: LightingStyle): LightingPlan {
  const spec = NBP_RULES.lightingPhysics[lightingStyle];

  const lightingMap: Record<LightingStyle, Omit<LightingPlan, 'style' | 'colorTemperature'>> = {
    golden_hour: {
      keyLight: 'low-angle sun at 15 degrees above horizon, warm directional',
      fillLight: 'ambient sky fill, warm reflected light from surfaces',
      rimLight: 'golden rim highlights on hair and shoulders',
      ambientLight: 'warm atmospheric scatter, golden ambient fill',
      contrastRatio: '3:1',
      shadowQuality: 'soft',
    },
    direct_flash: {
      keyLight: 'on-camera flash, hard direct, full power',
      fillLight: 'none',
      ambientLight: 'dark background falloff, flash-dominated foreground',
      contrastRatio: '8:1',
      shadowQuality: 'hard',
    },
    window_light: {
      keyLight: 'large window source, soft diffused daylight, camera-left',
      fillLight: 'subtle bounce from opposite wall',
      ambientLight: 'natural room ambient, soft overall fill',
      contrastRatio: '2:1',
      shadowQuality: 'soft',
    },
    neon_night: {
      keyLight: 'neon signage as primary key, colored, directional',
      fillLight: 'ambient street light bounce, mixed color',
      rimLight: 'neon rim spill on hair and edges',
      ambientLight: 'dark urban ambient with colored light pools',
      contrastRatio: '6:1',
      shadowQuality: 'medium',
      practicalLights: ['neon signs', 'streetlights', 'car headlights', 'phone screens'],
    },
    studio: {
      keyLight: 'beauty dish at 45 degrees camera-right, controlled output',
      fillLight: 'large softbox at 30 degrees camera-left, 2 stops under key',
      rimLight: 'strip softbox from behind, hair separation light',
      ambientLight: 'controlled studio ambient, minimal spill',
      contrastRatio: '3:1',
      shadowQuality: 'medium',
    },
    overcast: {
      keyLight: 'diffused overhead sky, no directional dominance',
      fillLight: 'even environmental fill from all directions',
      ambientLight: 'flat diffused ambient, extremely even',
      contrastRatio: '1.5:1',
      shadowQuality: 'soft',
    },
  };

  return {
    style: lightingStyle,
    colorTemperature: parseColorTemp(spec.colorTemp),
    ...lightingMap[lightingStyle],
  };
}

// ─────────────────────────────────────────────
// Internal Helpers — Wardrobe
// ─────────────────────────────────────────────

/**
 * Activity keyword patterns for scene-aware wardrobe selection.
 * Checked before falling back to mood defaults.
 */
const ACTIVITY_WARDROBE: ReadonlyArray<{ pattern: RegExp; wardrobe: WardrobePlan }> = [
  {
    pattern: /\b(sport|badminton|tennis|running|gym|yoga|basketball|football|cricket|soccer|volleyball|athletic|workout|exercise|fitness)\b/i,
    wardrobe: {
      description: 'athletic sportswear, performance fabric',
      material: 'moisture-wicking synthetic blend',
      fit: 'athletic fitted',
      colorPalette: 'team colors or bright athletic tones',
      textureDetail: 'smooth performance fabric with mesh ventilation panels',
      physicsTokens: [
        'stretchy fabric conforming to body during movement',
        'compression fit visible at muscles',
        'sweat-wicking fabric sheen',
        'fabric tension at movement points',
      ],
    },
  },
  {
    pattern: /\b(swim|pool|beach|surfing|diving)\b/i,
    wardrobe: {
      description: 'swimwear or beach attire',
      material: 'nylon-spandex blend',
      fit: 'form-fitting',
      colorPalette: 'tropical or solid bold tones',
      textureDetail: 'smooth wet-look surface, water droplets on skin',
      physicsTokens: [
        'water dripping from fabric edges',
        'wet fabric clinging to skin',
        'sand grains on damp surfaces',
      ],
    },
  },
  {
    pattern: /\b(wedding|bridal|ceremony|gala|formal event|ball|prom)\b/i,
    wardrobe: {
      description: 'formal ceremonial attire',
      material: 'luxury satin or embroidered tulle',
      fit: 'tailored formal',
      colorPalette: 'ivory, champagne, deep jewel tones',
      textureDetail: 'intricate beadwork, lace detailing, luxurious sheen',
      physicsTokens: [
        'heavy fabric draping with gravity',
        'structured bodice maintaining shape',
        'trailing fabric pooling on floor',
      ],
    },
  },
  {
    pattern: /\b(office|corporate|meeting|business|boardroom|professional)\b/i,
    wardrobe: {
      description: 'business professional attire',
      material: 'worsted wool or cotton blend',
      fit: 'tailored',
      colorPalette: 'navy, charcoal, white, muted corporate',
      textureDetail: 'pressed fabric, sharp collar, visible stitching',
      physicsTokens: [
        'crisp shirt collar maintaining structure',
        'pressed trouser creases',
        'blazer lapels lying flat',
      ],
    },
  },
  {
    pattern: /\b(cook|chef|kitchen|baking)\b/i,
    wardrobe: {
      description: 'kitchen apron over casual clothes',
      material: 'cotton canvas apron, casual cotton underneath',
      fit: 'functional relaxed',
      colorPalette: 'neutral apron, casual colors underneath',
      textureDetail: 'flour-dusted apron surface, stained fabric patches',
      physicsTokens: [
        'apron strings tied at waist',
        'fabric splashes and food stains',
        'sleeves rolled up above elbows',
      ],
    },
  },
  {
    pattern: /\b(hik|trail|mountain|outdoor|camping|trek)\b/i,
    wardrobe: {
      description: 'outdoor activewear, layered for weather',
      material: 'technical nylon shell, merino base layer',
      fit: 'functional athletic',
      colorPalette: 'earth tones, olive, burnt orange',
      textureDetail: 'ripstop nylon texture, visible zippers and toggles',
      physicsTokens: [
        'wind catching jacket shell',
        'layered fabrics visible at collar and cuffs',
        'backpack strap compression on shoulders',
      ],
    },
  },
  {
    pattern: /\b(danc|ballet|salsa|hip.?hop|club|party)\b/i,
    wardrobe: {
      description: 'dance performance or party attire',
      material: 'stretchy lycra or sequined fabric',
      fit: 'body-hugging performance',
      colorPalette: 'bold blacks, metallics, sequin shimmer',
      textureDetail: 'reflective surface catching light, stretchy fabric',
      physicsTokens: [
        'fabric stretching with movement',
        'sequins catching and reflecting light',
        'sweat visible on exposed skin',
      ],
    },
  },
];

/**
 * Builds a wardrobe plan from the user's wardrobe directive, scene context,
 * or sensible mood-based defaults.
 *
 * Priority: user directive > scene activity keywords > mood defaults.
 *
 * @param wardrobeDirective - Optional free-text wardrobe description.
 * @param mood - The selected mood (influences default wardrobe choices).
 * @param scene - The cleaned scene description for activity-keyword matching.
 * @returns A fully specified WardrobePlan.
 */
function buildWardrobePlan(
  wardrobeDirective: string | undefined,
  mood: Mood,
  scene: string,
): WardrobePlan {
  // Priority 1: User provided an explicit wardrobe directive
  if (wardrobeDirective && wardrobeDirective.trim()) {
    return {
      description: wardrobeDirective.trim(),
      material: 'natural fabric',
      fit: 'relaxed',
      colorPalette: 'neutral tones',
      textureDetail: 'visible fabric texture, natural creases',
      physicsTokens: [
        'natural drape following body contours',
        'gravity-informed fabric fall',
        'subtle wrinkles at joints',
        'fabric catching light at fold peaks',
      ],
    };
  }

  // Priority 2: Scene-aware wardrobe from activity keywords
  const sceneLower = scene.toLowerCase();
  for (const entry of ACTIVITY_WARDROBE) {
    if (entry.pattern.test(sceneLower)) {
      return entry.wardrobe;
    }
  }

  // Priority 3: Default wardrobe based on mood
  const moodWardrobeMap: Record<Mood, WardrobePlan> = {
    detached: {
      description: 'minimalist layered outfit, muted palette',
      material: 'washed cotton',
      fit: 'relaxed',
      colorPalette: 'muted grays and blacks',
      textureDetail: 'worn fabric texture, soft from washing',
      physicsTokens: [
        'relaxed drape, fabric pooling slightly',
        'subtle pilling on high-friction areas',
        'natural wrinkle patterns',
      ],
    },
    confident: {
      description: 'well-fitted structured outfit',
      material: 'tailored wool blend',
      fit: 'tailored',
      colorPalette: 'deep tones, navy or charcoal',
      textureDetail: 'visible weave structure, crisp edges',
      physicsTokens: [
        'structured shoulders maintaining shape',
        'fabric tension across chest',
        'sharp crease lines',
        'subtle sheen on pressed fabric',
      ],
    },
    romantic: {
      description: 'soft flowing garment with delicate details',
      material: 'silk or chiffon',
      fit: 'draped',
      colorPalette: 'soft pastels, blush and cream',
      textureDetail: 'sheer fabric layers, light-catching surface',
      physicsTokens: [
        'flowing fabric responding to air movement',
        'delicate drape following body curves',
        'translucent layers overlapping',
        'fabric catching and releasing light',
      ],
    },
    calm: {
      description: 'comfortable knitwear, understated elegance',
      material: 'cashmere or merino wool',
      fit: 'relaxed',
      colorPalette: 'earth tones, warm neutrals',
      textureDetail: 'visible knit texture, soft surface',
      physicsTokens: [
        'soft knit conforming gently to body',
        'natural stretch and recovery in fabric',
        'subtle cable or rib knit pattern',
      ],
    },
    playful: {
      description: 'casual vibrant outfit with personality',
      material: 'cotton jersey',
      fit: 'relaxed',
      colorPalette: 'bright accents, warm tones',
      textureDetail: 'soft cotton surface, casual wear patterns',
      physicsTokens: [
        'fabric moving with body in motion',
        'casual drape, lived-in comfort',
        'slight stretch at movement points',
      ],
    },
  };

  return moodWardrobeMap[mood];
}

// ─────────────────────────────────────────────
// Internal Helpers — Atmosphere
// ─────────────────────────────────────────────

/**
 * Attempts to match scene keywords to the SCENE_ONTOLOGY and
 * builds an atmosphere plan from the match or sensible defaults.
 *
 * @param scene - The cleaned scene description.
 * @param lightingStyle - The selected lighting style.
 * @returns A fully specified AtmospherePlan.
 */
function buildAtmospherePlan(
  scene: string,
  lightingStyle: LightingStyle,
): AtmospherePlan {
  // Try to match scene keywords to ontology keys
  const sceneKey = matchSceneToOntology(scene);
  const sceneData = sceneKey ? SCENE_ONTOLOGY[sceneKey] : undefined;

  if (sceneData) {
    return {
      description: sceneData.atmosphere.join(', '),
      particles: sceneData.atmosphere.find((a) =>
        a.includes('mist') || a.includes('dust') || a.includes('rain') || a.includes('smoke')
      ) ?? 'none',
      backgroundTreatment: 'natural background with environmental context',
      environmentalContext: sceneData.edgeActivity.join(', '),
      colorGrading: `graded for ${sceneData.typicalMood}`,
      timeOfDay: deriveTimeOfDay(sceneData.lighting),
      weather: deriveWeather(sceneData.atmosphere),
    };
  }

  // ── Scene-aware environment matching (middle tier) ──────────────────────
  // If the ontology didn't match, scan for environment keywords before
  // falling through to generic lighting defaults.
  const sceneLower = scene.toLowerCase();

  // Sports venues
  if (/\b(court|arena|stadium|gym|field|pitch|track|rink|pool)\b/i.test(sceneLower)) {
    const isIndoor = /\b(indoor|indoors|inside|covered)\b/i.test(sceneLower);
    return {
      description: isIndoor
        ? 'indoor sports venue, overhead fluorescent or LED lighting, marked court lines'
        : 'outdoor sports venue, natural daylight, open sky backdrop',
      particles: isIndoor ? 'none' : 'light atmospheric haze',
      backgroundTreatment: isIndoor
        ? 'visible venue walls, spectator seating, sports equipment in background'
        : 'open sky, distant treeline or structures, field markings',
      environmentalContext: isIndoor
        ? 'indoor sports facility, echo-prone space, rubber court surface'
        : 'outdoor playing field, ambient crowd noise, open air',
      colorGrading: isIndoor
        ? 'slightly cool fluorescent tones, neutral whites'
        : 'natural outdoor daylight tones',
      timeOfDay: isIndoor ? 'artificial_lighting' : 'afternoon',
      weather: isIndoor ? 'indoor' : 'clear',
    };
  }

  // Generic indoor spaces
  if (/\b(indoor|indoors|inside)\b/i.test(sceneLower)) {
    return {
      description: 'interior space with ambient artificial lighting',
      particles: 'none',
      backgroundTreatment: 'visible room features, walls and furnishings',
      environmentalContext: 'enclosed indoor environment',
      colorGrading: 'warm interior tones, mixed artificial light',
      timeOfDay: 'artificial_lighting',
      weather: 'indoor',
    };
  }

  // Default atmosphere based on lighting style
  const defaults: Record<LightingStyle, AtmospherePlan> = {
    golden_hour: {
      description: 'warm amber haze, golden light suffusing the scene',
      particles: 'dust motes in sunbeams',
      backgroundTreatment: 'warm toned soft background',
      environmentalContext: 'outdoor late afternoon setting',
      colorGrading: 'warm golden tones, lifted shadows',
      timeOfDay: 'golden_hour_evening',
      weather: 'clear',
    },
    direct_flash: {
      description: 'dark surroundings lit by harsh flash, nightlife feel',
      particles: 'none',
      backgroundTreatment: 'dark flash falloff background',
      environmentalContext: 'nightlife or event context',
      colorGrading: 'high contrast, flash-lit skin tones',
      timeOfDay: 'night',
      weather: 'clear',
    },
    window_light: {
      description: 'soft natural light from window, calm interior',
      particles: 'dust motes in window beam',
      backgroundTreatment: 'softly lit interior background',
      environmentalContext: 'indoor domestic or studio setting',
      colorGrading: 'natural daylight tones, gentle warmth',
      timeOfDay: 'afternoon',
      weather: 'clear',
    },
    neon_night: {
      description: 'neon-lit urban nightscape, colored light pools',
      particles: 'light mist or rain haze',
      backgroundTreatment: 'bokeh neon signs and city lights',
      environmentalContext: 'urban nightlife street',
      colorGrading: 'cool shadows with neon color accents',
      timeOfDay: 'night',
      weather: 'clear',
    },
    studio: {
      description: 'controlled studio environment, clean backdrop',
      particles: 'none',
      backgroundTreatment: 'seamless studio backdrop',
      environmentalContext: 'professional photography studio',
      colorGrading: 'neutral balanced tones',
      timeOfDay: 'midday',
      weather: 'clear',
    },
    overcast: {
      description: 'flat diffused light, muted atmosphere',
      particles: 'light atmospheric haze',
      backgroundTreatment: 'muted toned background',
      environmentalContext: 'outdoor overcast day',
      colorGrading: 'desaturated, cool undertones',
      timeOfDay: 'midday',
      weather: 'overcast',
    },
  };

  return defaults[lightingStyle];
}

/**
 * Matches a scene description to the closest SCENE_ONTOLOGY key.
 *
 * @param scene - The cleaned scene description.
 * @returns The matching ontology key, or undefined if no match.
 */
function matchSceneToOntology(scene: string): string | undefined {
  const sceneLower = scene.toLowerCase();
  const ontologyKeys = Object.keys(SCENE_ONTOLOGY);

  // Direct key match
  for (const key of ontologyKeys) {
    if (sceneLower.includes(key.replace(/_/g, ' '))) {
      return key;
    }
  }

  // Keyword-based fuzzy matching
  const keywordMap: Record<string, string[]> = {
    tokyo_night_cafe: ['tokyo', 'neon', 'japanese cafe', 'ramen shop'],
    paris_golden_hour_street: ['paris', 'parisian', 'cobblestone', 'french street'],
    scandinavian_window_studio: ['scandinavian', 'minimal studio', 'nordic', 'window studio'],
    new_york_subway: ['subway', 'metro', 'underground station', 'new york'],
    luxury_hotel_lobby: ['hotel lobby', 'luxury hotel', 'grand lobby'],
    beach_sunset: ['beach', 'sunset beach', 'shoreline', 'ocean sunset'],
    london_rain_street: ['london', 'british street', 'rainy street', 'uk street'],
    korean_convenience_store: ['convenience store', 'korean store', 'konbini'],
    desert_dusk: ['desert', 'dusk desert', 'arid landscape', 'sand dunes'],
    cozy_bookshop: ['bookshop', 'bookstore', 'library', 'book cafe'],
    rooftop_bar: ['rooftop', 'rooftop bar', 'skyline bar', 'terrace bar'],
    greenhouse_botanical: ['greenhouse', 'botanical', 'garden', 'conservatory'],
  };

  for (const [key, keywords] of Object.entries(keywordMap)) {
    for (const keyword of keywords) {
      if (sceneLower.includes(keyword)) {
        return key;
      }
    }
  }

  return undefined;
}

/**
 * Derives time-of-day from scene lighting descriptors.
 *
 * @param lighting - Array of lighting descriptor strings.
 * @returns Time-of-day string.
 */
function deriveTimeOfDay(lighting: readonly string[]): string {
  const joined = lighting.join(' ').toLowerCase();
  if (joined.includes('golden') || joined.includes('sunset')) return 'golden_hour_evening';
  if (joined.includes('neon') || joined.includes('night')) return 'night';
  if (joined.includes('dawn') || joined.includes('morning')) return 'golden_hour_morning';
  if (joined.includes('overcast') || joined.includes('overhead')) return 'midday';
  return 'afternoon';
}

/**
 * Derives weather from atmosphere descriptors.
 *
 * @param atmosphere - Array of atmosphere descriptor strings.
 * @returns Weather string.
 */
function deriveWeather(atmosphere: readonly string[]): string {
  const joined = atmosphere.join(' ').toLowerCase();
  if (joined.includes('rain') || joined.includes('drizzle')) return 'rain';
  if (joined.includes('fog') || joined.includes('mist')) return 'fog';
  if (joined.includes('snow')) return 'snow';
  if (joined.includes('haze')) return 'haze';
  return 'clear';
}

// ─────────────────────────────────────────────
// Internal Helpers — Pose
// ─────────────────────────────────────────────

/**
 * Action keyword patterns for scene-aware pose selection.
 * Checked before falling back to mood defaults.
 */
const ACTION_POSES: ReadonlyArray<{ pattern: RegExp; pose: PoseLogic }> = [
  {
    pattern: /\b(playing|hitting|kicking|throwing|catching|batting|serving|spiking|smashing|dribbling|sprinting|tackling)\b/i,
    pose: {
      intent: 'dynamic athletic action, caught mid-play',
      bodyOrientation: 'angled_dynamic',
      headPosition: 'focused forward, chin level with intensity',
      eyeDirection: 'focused_on_action',
      handPlacement: 'hands engaged with sport equipment or in athletic motion',
      weightDistribution: 'weight_shifted_forward_on_balls_of_feet',
      microExpression: 'intense focus, brow slightly furrowed, competitive determination',
      motionState: 'frozen_action',
    },
  },
  {
    pattern: /\b(running|jogging|racing|marathon)\b/i,
    pose: {
      intent: 'mid-stride running motion, athletic form',
      bodyOrientation: 'frontal_leaning_forward',
      headPosition: 'head level, looking ahead',
      eyeDirection: 'focused_ahead',
      handPlacement: 'arms pumping at sides, fists loosely clenched',
      weightDistribution: 'weight_on_lead_foot_mid_stride',
      microExpression: 'determined exertion, controlled breathing',
      motionState: 'frozen_action',
    },
  },
  {
    pattern: /\b(dancing|danc|ballet|salsa|twirl)\b/i,
    pose: {
      intent: 'dynamic dance movement, expressive body lines',
      bodyOrientation: 'angled_dynamic',
      headPosition: 'head tilted with movement flow',
      eyeDirection: 'following_movement_arc',
      handPlacement: 'arms extended in dance form, expressive fingers',
      weightDistribution: 'weight_on_one_foot_pirouette',
      microExpression: 'joy and concentration, lips parted in exertion',
      motionState: 'frozen_action',
    },
  },
  {
    pattern: /\b(sitting|seated|reading|studying|working at desk)\b/i,
    pose: {
      intent: 'seated, engaged in quiet activity',
      bodyOrientation: 'three_quarter_turn',
      headPosition: 'head slightly bowed, focused downward',
      eyeDirection: 'looking_down_at_activity',
      handPlacement: 'hands holding object or resting on surface',
      weightDistribution: 'fully_settled_in_seat',
      microExpression: 'calm concentration, relaxed brow',
      motionState: 'static',
    },
  },
  {
    pattern: /\b(walking|strolling|wandering)\b/i,
    pose: {
      intent: 'captured mid-walk, natural stride',
      bodyOrientation: 'three_quarter_turn',
      headPosition: 'natural forward gaze',
      eyeDirection: 'looking_ahead_naturally',
      handPlacement: 'arms in natural walking swing',
      weightDistribution: 'weight_shifting_between_feet',
      microExpression: 'relaxed, natural expression',
      motionState: 'frozen_action',
    },
  },
  {
    pattern: /\b(cooking|chopping|stirring|baking|preparing food)\b/i,
    pose: {
      intent: 'engaged in food preparation, focused hands',
      bodyOrientation: 'three_quarter_turn',
      headPosition: 'head slightly bowed, focused on task',
      eyeDirection: 'focused_on_hands',
      handPlacement: 'hands active with kitchen tools or ingredients',
      weightDistribution: 'weight_even_standing_at_counter',
      microExpression: 'focused concentration, slight satisfaction',
      motionState: 'subtle_movement',
    },
  },
  {
    pattern: /\b(yoga|stretching|meditation|pilates)\b/i,
    pose: {
      intent: 'held yoga or stretch pose, balanced form',
      bodyOrientation: 'frontal',
      headPosition: 'head aligned with spine, serene',
      eyeDirection: 'eyes_closed_or_soft_focus',
      handPlacement: 'arms in pose-specific position, controlled',
      weightDistribution: 'balanced_centered_grounding',
      microExpression: 'serene focus, controlled breathing, inner calm',
      motionState: 'static',
    },
  },
];

/**
 * Builds a pose and body-language plan from scene context and mood.
 *
 * Priority: scene action keywords > mood defaults.
 *
 * @param mood - The selected emotional register.
 * @param scene - The cleaned scene description for action-keyword matching.
 * @returns A fully specified PoseLogic.
 */
function buildPoseLogic(mood: Mood, scene: string): PoseLogic {
  // Priority 1: Scene-aware pose from action keywords
  const sceneLower = scene.toLowerCase();
  for (const entry of ACTION_POSES) {
    if (entry.pattern.test(sceneLower)) {
      return entry.pose;
    }
  }

  // Priority 2: Default pose based on mood
  const poseMap: Record<Mood, PoseLogic> = {
    detached: {
      intent: 'standing with relaxed disengagement, looking away',
      bodyOrientation: 'three_quarter_turn',
      headPosition: 'slight head tilt away',
      eyeDirection: 'looking_away_left',
      handPlacement: 'one hand in pocket, other hanging loosely',
      weightDistribution: 'weight_shifted_to_one_hip',
      microExpression: 'neutral lips, relaxed brow, unfocused gaze',
      motionState: 'static',
    },
    confident: {
      intent: 'standing tall with commanding presence',
      bodyOrientation: 'frontal',
      headPosition: 'chin slightly raised',
      eyeDirection: 'direct_to_camera',
      handPlacement: 'hands at sides with purpose, fingers relaxed',
      weightDistribution: 'even_balanced_stance',
      microExpression: 'subtle jaw set, direct unwavering gaze, hint of knowing expression',
      motionState: 'static',
    },
    romantic: {
      intent: 'soft gentle posture, inviting presence',
      bodyOrientation: 'three_quarter_turn',
      headPosition: 'head tilted slightly, chin lowered',
      eyeDirection: 'soft_gaze_to_camera',
      handPlacement: 'one hand near face or neck, gentle touch',
      weightDistribution: 'weight_on_back_foot',
      microExpression: 'soft eyes, slightly parted lips, gentle warmth',
      motionState: 'subtle_movement',
    },
    calm: {
      intent: 'seated or leaning in relaxed contemplation',
      bodyOrientation: 'three_quarter_turn',
      headPosition: 'neutral head position, relaxed neck',
      eyeDirection: 'looking_down_slightly',
      handPlacement: 'hands resting naturally, open palms',
      weightDistribution: 'fully_settled_weight',
      microExpression: 'serene expression, relaxed forehead, calm eyes',
      motionState: 'static',
    },
    playful: {
      intent: 'caught mid-action or mid-laugh',
      bodyOrientation: 'angled_dynamic',
      headPosition: 'head thrown back slightly or tilted with energy',
      eyeDirection: 'direct_to_camera_with_sparkle',
      handPlacement: 'hands in motion, gesturing or reaching',
      weightDistribution: 'weight_forward_on_toes',
      microExpression: 'genuine smile reaching eyes, raised cheeks, dynamic energy',
      motionState: 'frozen_action',
    },
  };

  return poseMap[mood];
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * **Pass 4 — Inject Photography.**
 *
 * Expands the user's high-level creative intent into a granular,
 * physically-plausible photography plan using deterministic mappings
 * from {@link NBP_RULES} and the {@link SCENE_ONTOLOGY}.
 *
 * @param intent - The IntentIR from Pass 1.
 * @param identity - The IdentityIR from Pass 3 (used for identity-aware framing).
 * @returns A fully specified PhotographyPlanIR.
 *
 * @example
 * ```ts
 * import { injectPhotography } from '../compiler/inject-photography.js';
 *
 * const plan = injectPhotography(intent, identity);
 * // plan.camera.focalLength === 85 for '85mm_portrait' style
 * ```
 */
export function injectPhotography(
  intent: IntentIR,
  identity: IdentityIR,
): PhotographyPlanIR {
  // 1. Build camera plan from NBP_RULES.cameraPhysics
  const camera = buildCameraPlan(intent.cameraStyle);

  // 2. Build composition plan based on camera style
  const composition = buildCompositionPlan(intent.cameraStyle);

  // 3. Build lighting plan from NBP_RULES.lightingPhysics
  const lighting = buildLightingPlan(intent.lightingStyle);

  // 4. Build wardrobe plan from intent, scene keywords, or mood defaults
  const wardrobe = buildWardrobePlan(intent.wardrobe, intent.mood, intent.scene);

  // 5. Build atmosphere plan, enriched from scene ontology if matched
  const atmosphere = buildAtmospherePlan(intent.scene, intent.lightingStyle);

  // 6. Build pose logic from scene action keywords or mood defaults
  const poseLogic = buildPoseLogic(intent.mood, intent.scene);

  // Identity is passed through for downstream awareness
  // (e.g., composition framing adjustments for face-locked subjects)
  void identity;

  return {
    camera,
    composition,
    lighting,
    wardrobe,
    atmosphere,
    poseLogic,
  };
}
