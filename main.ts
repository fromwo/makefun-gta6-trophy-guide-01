// Leonida Platinum — the hand-in program for the gta6-trophy-guide-01 entry (Node 22,
// standard library only). The guide itself is app/: plain static files with no build step,
// served with app/ at the root so app/index.html opens in a desktop browser and works
// offline — it loads nothing over the network, and its 55 trophies and their guides live in
// app/data/trophies.json. This program copies app/ and screenshots/ from beside this file
// into the output directory and writes output/dossier.json with the vendored make.fun
// library (vendor/makefun-frontend.ts, unchanged: the scorer requires dossier.json to be
// byte for byte what its own copy of that library writes).
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (Inside the grader's container, MAKEFUN_OUTPUT_DIR is unset and /output is used.)

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's caps (reference/gate.json): text_max_bytes is the only one that shapes the
// dossier's bytes; the rest refuse an entry the scorer would refuse anyway — more than 4
// screenshots or one over 256 KiB, more than 993 files and directories in app/, or more
// than 48 MiB of app files (app/ shares /output's own 1000-entry cap with screenshots/
// and dossier.json, so the guide is kept small on purpose).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

// A short human-readable summary of what was handed in, so a local run can be checked
// at a glance without opening the dossier.
const shotFiles = existsSync(join(out, 'screenshots'))
  ? readdirSync(join(out, 'screenshots')).filter((f) => statSync(join(out, 'screenshots', f)).isFile())
  : [];
console.log(
  `handed in: app/ copied, ${shotFiles.length} screenshot(s) (${shotFiles.join(', ') || 'none'}), dossier.json written to ${out}`,
);
