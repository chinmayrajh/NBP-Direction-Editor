/**
 * @module utils/browser-logger
 * @description Browser-safe compiler logger for the NBP Director.
 *
 * Stores pass records in memory (no `node:fs` dependency).
 * Use this when running the compiler in a browser environment.
 */

// ─────────────────────────────────────────────
// CompilerLogger Interface
// ─────────────────────────────────────────────

/**
 * Minimal logger contract for the compiler pipeline.
 *
 * Implemented by both the Node.js Logger (filesystem I/O)
 * and the BrowserLogger (in-memory, no `node:fs`).
 *
 * The orchestrator accepts any CompilerLogger implementation,
 * enabling browser-safe compilation.
 */
export interface CompilerLogger {
  /** Record a successful compiler pass. */
  logPass(passName: string, input: unknown, output: unknown): void;
  /** Record a compiler pass error. */
  logError(passName: string, error: unknown): void;
  /** Return a human-readable summary of all recorded passes. */
  getSummary(): string;
}

// ─────────────────────────────────────────────
// BrowserLogger (in-memory, no node:fs)
// ─────────────────────────────────────────────

/** In-memory pass record for the BrowserLogger. */
export interface BrowserPassRecord {
  readonly passName: string;
  readonly success: boolean;
  readonly durationMs: number;
  readonly errorMessage?: string;
}

/**
 * Browser-safe compiler logger that stores pass records in memory.
 *
 * Use this when running the compiler in a browser environment where
 * `node:fs` is unavailable. Pass records are stored in an array
 * and can be accessed via {@link getRecords} for UI rendering.
 *
 * @example
 * ```ts
 * import { BrowserLogger } from '../utils/browser-logger.js';
 *
 * const logger = new BrowserLogger();
 * runPipeline(inputs, { logger });
 * console.log(logger.getSummary());
 * console.log(logger.getRecords()); // structured data for UI
 * ```
 */
export class BrowserLogger implements CompilerLogger {
  private readonly records: BrowserPassRecord[] = [];
  private readonly startTime = Date.now();
  private passStart = Date.now();

  logPass(passName: string, _input: unknown, _output: unknown): void {
    const now = Date.now();
    this.records.push({
      passName,
      success: true,
      durationMs: now - this.passStart,
    });
    this.passStart = now;
  }

  logError(passName: string, error: unknown): void {
    const now = Date.now();
    this.records.push({
      passName,
      success: false,
      durationMs: now - this.passStart,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    this.passStart = now;
  }

  getSummary(): string {
    const totalMs = Date.now() - this.startTime;
    const passed = this.records.filter((r) => r.success).length;
    const failed = this.records.filter((r) => !r.success).length;

    const lines = [
      `NBP Director — Browser Compilation`,
      `Total passes: ${this.records.length}`,
      `Duration: ${totalMs}ms`,
      `Result: ${passed} passed, ${failed} failed`,
      '',
      ...this.records.map(
        (r) => `  ${r.success ? '✓' : '✗'}  ${r.passName.padEnd(28)} ${r.durationMs}ms`,
      ),
    ];
    return lines.join('\n');
  }

  /** Returns structured pass records for UI rendering. */
  getRecords(): readonly BrowserPassRecord[] {
    return this.records;
  }

  /** Returns total pipeline duration in milliseconds. */
  getTotalDuration(): number {
    return Date.now() - this.startTime;
  }
}
