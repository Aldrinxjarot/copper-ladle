// The Copper Ladle — hand-in program for make.fun's best cooking game bounty.
//
// What it does, in order:
//   1. finds this repository (the folder main.ts sits in),
//   2. copies game/ and screenshots/ into the output folder, byte for byte,
//   3. asks the kit's buildDossier to describe that copy and writes the
//      result to dossier.json in the same folder.
//
// The grader runs it twice and expects both runs to write the same bytes, so
// nothing here depends on the clock, on randomness or on the working
// directory: every path is resolved from main.ts's own location, and the one
// environment value it reads (MAKEFUN_OUTPUT_DIR) only names the output
// folder when the grader is not the one running it.

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The caps the bounty's gate builds its own dossier with. Only
// text_max_bytes shapes the bytes; the rest make this program refuse an
// entry in the same places the gate would.
const GATE_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// The two halves of the entry a visitor can open or look at. Everything else
// the dossier needs is derived from these by buildDossier itself.
const HANDED_IN = ['game', 'screenshots'];

function repositoryRoot(): string {
  return dirname(fileURLToPath(import.meta.url));
}

function outputRoot(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  return fromEnv && fromEnv.length > 0 ? fromEnv : '/output';
}

// Copy one handed-in folder into the output, replacing whatever a previous
// run left there so a stale file can never leak into the dossier.
function copyHandedIn(root: string, out: string, name: string): void {
  const target = join(out, name);
  rmSync(target, { recursive: true, force: true });
  cpSync(join(root, name), target, { recursive: true });
}

function main(): void {
  const root = repositoryRoot();
  const out = outputRoot();
  mkdirSync(out, { recursive: true });
  for (const name of HANDED_IN) copyHandedIn(root, out, name);
  const dossier = buildDossier(out, GATE_CAPS);
  writeFileSync(join(out, 'dossier.json'), dossier);
}

main();
