/**
 * @module utils/logger
 * @description Compiler Observability for the NBP Director.
 *
 * Provides a Logger class that creates per-run log directories,
 * records each compiler pass's input/output as JSON files, captures
 * errors, and generates human-readable run summaries.
 *
 * Also provides a browser-safe {@link BrowserLogger} that stores
 * pass records in memory (no filesystem access).
 *
 * Designed for debugging the multi-pass prompt compiler pipeline.
 */

import { mkdirSync, writeFileSync, readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// ─────────────────────────────────────────────
// CompilerLogger Interface (browser-safe contract)
// ─────────────────────────────────────────────

/**
 * Minimal logger contract for the compiler pipeline.
 *
 * Implemented by both the Node.js {@link Logger} (filesystem I/O)
 * and the {@link BrowserLogger} (in-memory, no `node:fs`).
 *
 * The orchestrator accepts any `CompilerLogger` implementation,
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
interface BrowserPassRecord {
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
 * import { BrowserLogger } from '../utils/logger.js';
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

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/** Metadata recorded for each compiler pass. */
interface PassRecord {
  readonly passName: string;
  readonly timestamp: string;
  readonly durationMs: number;
  readonly inputFile: string;
  readonly outputFile: string;
  readonly success: boolean;
  readonly errorMessage?: string;
}

// ─────────────────────────────────────────────
// Logger Class (Node.js filesystem-based)
// ─────────────────────────────────────────────

/**
 * Compiler observability logger.
 *
 * Creates a unique run directory under `logs/run_XXX/` (auto-incrementing)
 * and writes per-pass JSON snapshots for debugging and replay.
 *
 * **Note**: This class uses `node:fs` and cannot run in the browser.
 * For browser environments, use {@link BrowserLogger} instead.
 *
 * @example
 * ```ts
 * import { Logger } from '../utils/logger.js';
 *
 * const logger = new Logger();
 * logger.logPass('BannedWordsPass', inputIR, outputIR);
 * logger.logPass('RealismInjectionPass', outputIR, finalIR);
 * console.log(logger.getSummary());
 * ```
 */
export class Logger implements CompilerLogger {
  /** Absolute path to this run's log directory. */
  public readonly runDir: string;

  /** Run number for this logger instance. */
  public readonly runNumber: number;

  /** Ordered list of pass records. */
  private readonly passRecords: PassRecord[] = [];

  /** Start time of the run. */
  private readonly runStartTime: number;

  /**
   * Creates a new Logger instance with an auto-incrementing run directory.
   *
   * @param baseDir - Base directory for all logs. Defaults to `logs` in CWD.
   */
  constructor(baseDir: string = 'logs') {
    this.runStartTime = Date.now();
    this.runNumber = Logger.getNextRunNumber(baseDir);
    this.runDir = join(baseDir, `run_${String(this.runNumber).padStart(3, '0')}`);

    // Create the run directory (and base if needed)
    mkdirSync(this.runDir, { recursive: true });

    // Write run metadata
    const runMeta = {
      runNumber: this.runNumber,
      startTime: new Date(this.runStartTime).toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
    };
    writeFileSync(
      join(this.runDir, '_run_meta.json'),
      JSON.stringify(runMeta, null, 2),
      'utf-8',
    );
  }

  /**
   * Logs a compiler pass by writing its input and output IR as JSON files.
   *
   * @param passName - Name of the compiler pass (e.g., 'BannedWordsPass').
   * @param input - The IR before this pass ran.
   * @param output - The IR after this pass ran.
   */
  logPass(passName: string, input: unknown, output: unknown): void {
    const timestamp = new Date().toISOString();
    const passIndex = String(this.passRecords.length + 1).padStart(2, '0');
    const prefix = `${passIndex}_${passName}`;

    const inputFile = `${prefix}_input.json`;
    const outputFile = `${prefix}_output.json`;

    const startMs = performance.now();

    // Write input snapshot
    writeFileSync(
      join(this.runDir, inputFile),
      JSON.stringify(input, null, 2),
      'utf-8',
    );

    // Write output snapshot
    writeFileSync(
      join(this.runDir, outputFile),
      JSON.stringify(output, null, 2),
      'utf-8',
    );

    const durationMs = Math.round(performance.now() - startMs);

    this.passRecords.push({
      passName,
      timestamp,
      durationMs,
      inputFile,
      outputFile,
      success: true,
    });

    // Update the pass manifest
    this.writeManifest();
  }

  /**
   * Logs a compiler pass error.
   *
   * @param passName - Name of the compiler pass that failed.
   * @param error - The error that occurred.
   */
  logError(passName: string, error: unknown): void {
    const timestamp = new Date().toISOString();
    const passIndex = String(this.passRecords.length + 1).padStart(2, '0');
    const prefix = `${passIndex}_${passName}`;

    const errorFile = `${prefix}_error.json`;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Write error detail
    writeFileSync(
      join(this.runDir, errorFile),
      JSON.stringify(
        {
          passName,
          timestamp,
          error: errorMessage,
          stack: errorStack,
        },
        null,
        2,
      ),
      'utf-8',
    );

    this.passRecords.push({
      passName,
      timestamp,
      durationMs: 0,
      inputFile: '',
      outputFile: errorFile,
      success: false,
      errorMessage,
    });

    // Update the pass manifest
    this.writeManifest();
  }

  /**
   * Returns a human-readable text summary of all passes in this run.
   *
   * @returns A formatted string overview suitable for console output.
   */
  getSummary(): string {
    const lines: string[] = [];
    const totalDuration = Date.now() - this.runStartTime;

    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push(`║  NBP Director — Compiler Run #${this.runNumber}`);
    lines.push(`║  Directory: ${this.runDir}`);
    lines.push(`║  Total passes: ${this.passRecords.length}`);
    lines.push(`║  Total duration: ${totalDuration}ms`);
    lines.push('╠══════════════════════════════════════════════════════════════╣');

    for (const record of this.passRecords) {
      const status = record.success ? '✓' : '✗';
      const errorSuffix = record.errorMessage ? ` — ${record.errorMessage}` : '';
      lines.push(
        `║  ${status}  ${record.passName.padEnd(30)} ${record.durationMs}ms${errorSuffix}`,
      );
    }

    const successCount = this.passRecords.filter((r) => r.success).length;
    const failCount = this.passRecords.filter((r) => !r.success).length;

    lines.push('╠══════════════════════════════════════════════════════════════╣');
    lines.push(`║  Result: ${successCount} passed, ${failCount} failed`);
    lines.push('╚══════════════════════════════════════════════════════════════╝');

    return lines.join('\n');
  }

  // ─────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────

  /**
   * Writes the current pass manifest to disk.
   */
  private writeManifest(): void {
    writeFileSync(
      join(this.runDir, '_manifest.json'),
      JSON.stringify(this.passRecords, null, 2),
      'utf-8',
    );
  }

  /**
   * Determines the next run number by scanning existing run directories.
   *
   * @param baseDir - The base logs directory.
   * @returns The next run number (1-based).
   */
  static getNextRunNumber(baseDir: string): number {
    if (!existsSync(baseDir)) {
      return 1;
    }

    const entries = readdirSync(baseDir);
    let maxNum = 0;

    for (const entry of entries) {
      const match = entry.match(/^run_(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }

    return maxNum + 1;
  }
}
