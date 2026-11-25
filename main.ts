// Dapur Senja — the entry program (Node 22, standard library only).
// It hands the game in: copies game/ and screenshots/ from this repository
// into the grader's /output and writes /output/dossier.json with the kit's
// vendored library, so the judge reads exactly the files that were graded.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The gate's caps, from the kit's RULES.txt: the dossier text holds at most
// 160 KiB of source, at most 4 screenshots of 256 KiB each, game/ at most
// 993 entries and 48 MiB. Passing them here makes this program fail where
// the scorer would refuse the entry, instead of handing in a bad dossier.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
console.log(`Dapur Senja handed in to ${outDir}`);
