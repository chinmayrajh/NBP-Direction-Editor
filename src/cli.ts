/**
 * @module cli
 * @description NBP Director Command-Line Interface.
 *
 * Parses command-line arguments and runs the full compilation pipeline
 * through the orchestrator.
 *
 * Usage:
 * ```
 * npx tsx src/cli.ts --scene "woman on rooftop at golden hour" \
 *   --camera 85mm_portrait \
 *   --lighting golden_hour \
 *   --mood confident \
 *   --realism 4 \
 *   --imperfection 3 \
 *   --edit-mode preserve_enhance
 * ```
 *
 * Output:
 *   - Prints the merged prompt to stdout.
 *   - Writes the full JSON output to `output.json`.
 */

import { writeFileSync } from 'node:fs';
import { runPipeline } from './compiler/orchestrator.js';
import { Logger } from './utils/logger.js';
import type { DirectorInputs } from './ir/project.js';
import type {
  CameraStyle,
  LightingStyle,
  Mood,
  EditMode,
} from './ir/types.js';

// ─────────────────────────────────────────────
// Argument Parsing
// ─────────────────────────────────────────────

/**
 * Parsed CLI arguments.
 */
interface CliArgs {
  scene: string;
  camera: CameraStyle;
  lighting: LightingStyle;
  mood: Mood;
  realism: number;
  imperfection: number;
  editMode: EditMode;
}

/**
 * Parses command-line arguments from `process.argv`.
 *
 * Supports the following flags:
 * - `--scene <text>`         (required)
 * - `--camera <style>`       (default: '85mm_portrait')
 * - `--lighting <style>`     (default: 'golden_hour')
 * - `--mood <mood>`          (default: 'confident')
 * - `--realism <1-5>`        (default: 4)
 * - `--imperfection <1-5>`   (default: 3)
 * - `--edit-mode <mode>`     (default: 'preserve_enhance')
 *
 * @returns Parsed CliArgs object.
 * @throws If the required `--scene` argument is missing.
 */
function parseArgs(): CliArgs {
  const args = process.argv.slice(2);

  let scene = '';
  let camera: CameraStyle = '85mm_portrait';
  let lighting: LightingStyle = 'golden_hour';
  let mood: Mood = 'confident';
  let realism = 4;
  let imperfection = 3;
  let editMode: EditMode = 'preserve_enhance';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--scene':
        scene = next ?? '';
        i++;
        break;
      case '--camera':
        camera = (next ?? '85mm_portrait') as CameraStyle;
        i++;
        break;
      case '--lighting':
        lighting = (next ?? 'golden_hour') as LightingStyle;
        i++;
        break;
      case '--mood':
        mood = (next ?? 'confident') as Mood;
        i++;
        break;
      case '--realism':
        realism = parseInt(next ?? '4', 10);
        i++;
        break;
      case '--imperfection':
        imperfection = parseInt(next ?? '3', 10);
        i++;
        break;
      case '--edit-mode':
        editMode = (next ?? 'preserve_enhance') as EditMode;
        i++;
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      default:
        // Unknown arg — ignore silently
        break;
    }
  }

  if (!scene) {
    console.error('Error: --scene is required.\n');
    printUsage();
    process.exit(1);
  }

  return { scene, camera, lighting, mood, realism, imperfection, editMode };
}

/**
 * Prints usage information to stderr.
 */
function printUsage(): void {
  console.error(`
NBP Director — Closed-Loop AI Photography Prompt Compiler

Usage:
  npx tsx src/cli.ts --scene <description> [options]

Required:
  --scene <text>           Scene description (e.g. "woman on rooftop at sunset")

Options:
  --camera <style>         Camera style (default: 85mm_portrait)
                           Values: iphone, 35mm_street, 85mm_portrait,
                                   retro_ccd, cinema_lens, luxury_editorial
  --lighting <style>       Lighting style (default: golden_hour)
                           Values: golden_hour, direct_flash, window_light,
                                   neon_night, studio, overcast
  --mood <mood>            Mood (default: confident)
                           Values: detached, confident, romantic, calm, playful
  --realism <1-5>          Realism level (default: 4)
  --imperfection <1-5>     Imperfection level (default: 3)
  --edit-mode <mode>       Edit mode (default: preserve_enhance)
                           Values: preserve_enhance, new_scene, wardrobe_swap,
                                   lighting_edit, editorial_upgrade,
                                   cinematic_upgrade, ugc_realism
  --help, -h               Show this help message
`);
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

/**
 * Main CLI entry point.
 */
function main(): void {
  const cliArgs = parseArgs();

  // Build DirectorInputs from CLI args
  const inputs: DirectorInputs = {
    referenceImages: [],
    coreScene: cliArgs.scene,
    editMode: cliArgs.editMode,
    cameraStyle: cliArgs.camera,
    lightingStyle: cliArgs.lighting,
    mood: cliArgs.mood,
    realismLevel: cliArgs.realism,
    imperfectionLevel: cliArgs.imperfection,
    priorities: [],
    negativeConstraints: '',
  };

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  NBP Director — Compiling prompt...');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Scene:        ${cliArgs.scene}`);
  console.log(`  Camera:       ${cliArgs.camera}`);
  console.log(`  Lighting:     ${cliArgs.lighting}`);
  console.log(`  Mood:         ${cliArgs.mood}`);
  console.log(`  Realism:      ${cliArgs.realism}`);
  console.log(`  Imperfection: ${cliArgs.imperfection}`);
  console.log(`  Edit Mode:    ${cliArgs.editMode}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Run the full pipeline
  const project = runPipeline(inputs, { logger: new Logger() });

  // Print the merged prompt
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  FINAL MERGED PROMPT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (project.output.editablePrompt) {
    console.log(project.output.editablePrompt);
  } else {
    console.error('Pipeline failed — no prompt generated.');
  }

  // Print negative prompt
  if (project.aiPipeline.finalPromptIR) {
    const negatives = project.aiPipeline.finalPromptIR.modules.negativePrompt;
    if (negatives.length > 0) {
      console.log('\n───────────────────────────────────────────────────────────────');
      console.log('  NEGATIVE PROMPT');
      console.log('───────────────────────────────────────────────────────────────\n');
      console.log(negatives.join(', '));
    }
  }

  // Print stats
  console.log('\n───────────────────────────────────────────────────────────────');
  console.log('  STATS');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  Token count:    ${project.aiPipeline.finalPromptIR?.tokenCount ?? 'N/A'}`);
  console.log(`  Compression:    ${project.aiPipeline.finalPromptIR?.compressionApplied ? 'Yes' : 'No'}`);
  console.log(`  Dropped tokens: ${project.aiPipeline.finalPromptIR?.droppedTokens.length ?? 0}`);
  console.log(`  Confidence:`);
  console.log(`    Identity:       ${project.confidence.identity.toFixed(2)}`);
  console.log(`    Realism:        ${project.confidence.realism.toFixed(2)}`);
  console.log(`    Composition:    ${project.confidence.composition.toFixed(2)}`);
  console.log(`    Controllability: ${project.confidence.controllability.toFixed(2)}`);
  console.log(`  Pipeline:       ${project.generationState.status}`);
  console.log(`  Duration:       ${project.generationState.elapsedMs ?? 0}ms`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Write full JSON output
  const outputPath = 'output.json';
  writeFileSync(outputPath, JSON.stringify(project, null, 2), 'utf-8');
  console.log(`Full output written to: ${outputPath}`);
}

// Run
main();
