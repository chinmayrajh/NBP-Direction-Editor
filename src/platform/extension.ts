/**
 * @module platform/extension
 * @description Chrome Extension platform implementation.
 * Uses chrome.storage.local for persistence and chrome.runtime
 * for message passing to content scripts.
 */

import type { Platform, PlatformStorage } from './types.js';

class ExtensionStorage implements PlatformStorage {
  async get(key: string): Promise<string | undefined> {
    try {
      const result = await chrome.storage.local.get(key);
      const value = result[key];
      return typeof value === 'string' ? value : undefined;
    } catch {
      // Fallback to localStorage if chrome.storage unavailable
      try {
        return localStorage.getItem(key) ?? undefined;
      } catch {
        return undefined;
      }
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Both unavailable
      }
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await chrome.storage.local.remove(key);
    } catch {
      try {
        localStorage.removeItem(key);
      } catch {
        // Both unavailable
      }
    }
  }
}

export class ExtensionPlatform implements Platform {
  readonly isExtension = true;
  readonly storage = new ExtensionStorage();

  async insertPrompt(text: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await chrome.runtime.sendMessage({
        type: 'INSERT_PROMPT',
        prompt: text,
      });
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  async isOnGeminiPage(): Promise<boolean> {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'IS_GEMINI_TAB' });
      return response?.isGemini ?? false;
    } catch {
      return false;
    }
  }
}
