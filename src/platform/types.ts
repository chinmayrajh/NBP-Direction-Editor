/**
 * @module platform/types
 * @description Platform abstraction interface for dual-build support
 * (standalone web app vs Chrome extension).
 */

export interface PlatformStorage {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface Platform {
  /** Whether we're running inside a Chrome extension. */
  readonly isExtension: boolean;
  /** Persistent key-value storage. */
  readonly storage: PlatformStorage;
  /** Insert prompt into the active Gemini tab (extension only). */
  insertPrompt?(text: string): Promise<{ success: boolean; error?: string }>;
  /** Check if the active tab is a Gemini page (extension only). */
  isOnGeminiPage?(): Promise<boolean>;
}
