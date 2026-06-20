/**
 * @module platform/index
 * @description Runtime detection and platform export.
 *
 * Detects whether we're in a Chrome extension or standalone web context
 * and exports the appropriate Platform implementation.
 */

import type { Platform } from './types.js';
import { WebPlatform } from './web.js';
import { ExtensionPlatform } from './extension.js';

/** Runtime check for Chrome extension context. */
export const isExtensionContext: boolean =
  typeof chrome !== 'undefined' && !!chrome?.runtime?.id;

/** The current platform — extension or web. */
export const platform: Platform = isExtensionContext
  ? new ExtensionPlatform()
  : new WebPlatform();

export type { Platform, PlatformStorage } from './types.js';
