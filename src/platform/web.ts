/**
 * @module platform/web
 * @description Web platform implementation using localStorage.
 * Used when running as a standalone web app (not a Chrome extension).
 */

import type { Platform, PlatformStorage } from './types.js';

class WebStorage implements PlatformStorage {
  async get(key: string): Promise<string | undefined> {
    try {
      return localStorage.getItem(key) ?? undefined;
    } catch {
      return undefined;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage unavailable
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch {
      // localStorage unavailable
    }
  }
}

export class WebPlatform implements Platform {
  readonly isExtension = false;
  readonly storage = new WebStorage();
}
