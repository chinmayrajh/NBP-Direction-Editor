// ─────────────────────────────────────────────────────────────────────────────
// NBP Director — DSL Module Barrel Export
// ─────────────────────────────────────────────────────────────────────────────
// Usage: import type { SceneDSL, CameraDSL, ... } from '@dsl/index.js';
// ─────────────────────────────────────────────────────────────────────────────

export type {
  // String literal unions
  TimeOfDay,
  Weather,
  FramingPreset,
  LensType,
  SensorType,
  LightSourceType,
  FalloffType,
  GarmentCategory,
  FitType,
  DistortionProfile,

  // DSL structures
  SceneDSL,
  CameraDSL,
  LightSource,
  LightingDSL,
  WardrobeDSL,
  RealismDSL,
  EditIntentDSL,
  CompiledDSL,
} from './types.js';
