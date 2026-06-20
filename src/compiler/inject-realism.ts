/**
 * @module compiler/inject-realism
 * @description **Pass 5 — Inject Realism.**
 *
 * Converts the PhotographyPlanIR into PromptModules and injects
 * realism tokens and imperfection tokens based on the user's
 * chosen levels. Uses deterministic mappings from NBP_RULES.
 *
 * This is a **pure function** — no side effects, no LLM calls.
 */

import type {
  IntentIR,
  IdentityIR,
  PhotographyPlanIR,
  PromptModules,
  RealismLevel,
  ImperfectionLevel,
} from '../ir/types.js';
import { NBP_RULES } from '../config/nbp-rules.js';

// ─────────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────────

/**
 * Serializes identity anchors into a prompt-ready identity lock string.
 *
 * @param identity - The identity IR with tiered anchors.
 * @returns A comma-separated string of identity-preservation tokens.
 */
export function buildIdentityLockString(identity: IdentityIR): string {
  const parts: string[] = [];

  // Tier 1 anchors — highest weight, always included
  for (const anchor of identity.tier1Anchors) {
    parts.push(`preserve ${anchor.trait}: ${anchor.value}`);
  }

  // Tier 2 anchors — included with slightly lower emphasis
  for (const anchor of identity.tier2Anchors) {
    parts.push(`maintain ${anchor.trait}: ${anchor.value}`);
  }

  // Biology summary as fallback prose anchor
  if (identity.biologySummary) {
    parts.push(identity.biologySummary);
  }

  return parts.join(', ');
}

/**
 * Builds the camera system prompt string from camera physics data.
 *
 * @param plan - The photography plan with camera configuration.
 * @returns Camera system prompt tokens.
 */
function buildCameraSystemString(plan: PhotographyPlanIR): string {
  const cam = plan.camera;
  const spec = NBP_RULES.cameraPhysics[cam.style];

  const sensorLabel = spec.sensor.toLowerCase().includes('sensor')
    ? spec.sensor
    : `${spec.sensor} sensor`;

  const parts: string[] = [
    `shot on ${spec.focalLength} lens`,
    `${spec.aperture} aperture`,
    sensorLabel,
    ...spec.characteristics,
  ];

  if (cam.filmStock) {
    parts.push(`${cam.filmStock} film stock`);
  }

  if (cam.iso) {
    parts.push(`ISO ${cam.iso}`);
  }

  return parts.join(', ');
}

/**
 * Builds the lighting system prompt string from lighting physics data.
 *
 * @param plan - The photography plan with lighting configuration.
 * @returns Lighting system prompt tokens.
 */
function buildLightingSystemString(plan: PhotographyPlanIR): string {
  const light = plan.lighting;
  const parts: string[] = [
    light.keyLight,
    light.fillLight,
    light.ambientLight,
    `${light.colorTemperature}K color temperature`,
    `${light.contrastRatio} contrast ratio`,
    `${light.shadowQuality} shadows`,
  ];

  if (light.rimLight) {
    parts.push(light.rimLight);
  }

  return parts.filter((p) => p !== 'none').join(', ');
}

/**
 * Builds the wardrobe physics prompt string.
 *
 * @param plan - The photography plan with wardrobe configuration.
 * @returns Wardrobe prompt tokens with material physics.
 */
function buildWardrobePhysicsString(plan: PhotographyPlanIR): string {
  const ward = plan.wardrobe;
  const parts: string[] = [
    ward.description,
    `${ward.material} fabric`,
    `${ward.fit} fit`,
    ward.textureDetail,
    ...ward.physicsTokens,
  ];

  if (ward.accessories && ward.accessories.length > 0) {
    parts.push(ward.accessories.join(', '));
  }

  return parts.join(', ');
}

/**
 * Builds the pose choreography prompt string.
 *
 * @param plan - The photography plan with pose logic.
 * @returns Pose and body language prompt tokens.
 */
function buildPoseChoreographyString(plan: PhotographyPlanIR): string {
  const pose = plan.poseLogic;
  return [
    pose.intent,
    `${pose.bodyOrientation} body orientation`,
    `${pose.headPosition} head position`,
    `${pose.eyeDirection} eye direction`,
    pose.handPlacement,
    pose.weightDistribution,
    pose.microExpression,
    `${pose.motionState} motion`,
  ].join(', ');
}

/**
 * Builds the atmosphere prompt string.
 *
 * @param plan - The photography plan with atmosphere configuration.
 * @returns Atmosphere and environment prompt tokens.
 */
function buildAtmosphereString(plan: PhotographyPlanIR): string {
  const atmo = plan.atmosphere;
  return [
    atmo.description,
    atmo.particles !== 'none' ? atmo.particles : '',
    atmo.backgroundTreatment,
    atmo.colorGrading,
    `${atmo.timeOfDay} time of day`,
    `${atmo.weather} weather`,
  ].filter((p) => p.length > 0).join(', ');
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * **Pass 5 — Inject Realism.**
 *
 * Converts the PhotographyPlanIR into PromptModules and injects
 * realism and imperfection tokens scaled by the user's chosen levels.
 *
 * @param plan - The photography plan IR from Pass 4.
 * @param identity - The identity IR from Pass 3.
 * @param intent - The normalized intent IR from Pass 1.
 * @returns Fully assembled PromptModules with realism/imperfection tokens.
 */
export function injectRealism(
  plan: PhotographyPlanIR,
  identity: IdentityIR,
  intent: IntentIR,
): PromptModules {
  // Clamp levels to valid range for indexing
  const realismLevel = Math.max(1, Math.min(5, intent.realismLevel)) as RealismLevel;
  const imperfectionLevel = Math.max(1, Math.min(5, intent.imperfectionLevel)) as ImperfectionLevel;

  // Get deterministic realism and imperfection tokens
  const realismTokens = NBP_RULES.realismTokens[realismLevel];
  const imperfectionTokens = NBP_RULES.imperfectionTokens[imperfectionLevel];

  // Build negative prompt from defaults
  const negativePrompt: string[] = [...NBP_RULES.negativePromptDefaults];

  return {
    sceneDescription: intent.scene,
    identityLock: buildIdentityLockString(identity),
    cameraSystem: buildCameraSystemString(plan),
    lightingSystem: buildLightingSystemString(plan),
    wardrobePhysics: buildWardrobePhysicsString(plan),
    poseChoreography: buildPoseChoreographyString(plan),
    edgeActivity: plan.composition.depthLayers.join(', '),
    atmosphere: buildAtmosphereString(plan),
    realismTokens: realismTokens.join(', '),
    imperfectionTokens: imperfectionTokens.join(', '),
    negativePrompt,
  };
}
