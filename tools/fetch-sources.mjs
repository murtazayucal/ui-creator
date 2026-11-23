#!/usr/bin/env node
// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// Downloads the raw palette sources into .cache/sources/ (git-ignored).
// Run this, then `node tools/build-palettes.mjs`.
// The files are data; build-palettes.mjs parses them as text and never executes them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DAISY = "5.8.2";
const gh = "https://raw.githubusercontent.com";
const cdn = `https://cdn.jsdelivr.net/npm/daisyui@${DAISY}`;

const DAISY_THEMES = `abyss acid aqua autumn black bumblebee business caramellatte cmyk coffee corporate cupcake
cyberpunk dark dim dracula emerald fantasy forest garden halloween lemonade light lofi luxury night nord pastel
retro silk sunset synthwave valentine winter wireframe`.split(/\s+/);

const files = [
  ["uiuxpromax/colors.csv", `${gh}/nextlevelbuilder/ui-ux-pro-max-skill/main/src/ui-ux-pro-max/data/colors.csv`],
  ["uiuxpromax/LICENSE", `${gh}/nextlevelbuilder/ui-ux-pro-max-skill/main/LICENSE`],
  ["tweakcn/theme-presets.ts", `${gh}/jnsahaj/tweakcn/main/utils/theme-presets.ts`],
  ["tweakcn/LICENSE", `${gh}/jnsahaj/tweakcn/main/LICENSE`],
  ["catppuccin/palette.json", `${gh}/catppuccin/palette/main/palette.json`],
  ["catppuccin/LICENSE", `${gh}/catppuccin/palette/main/LICENSE`],
  ["daisyui/LICENSE", `${cdn}/LICENSE`],
  ...DAISY_THEMES.map((t) => [`daisyui/${t}.css`, `${cdn}/theme/${t}.css`]),
];

let failed = 0;
for (const [rel, url] of files) {
  const dest = path.join(root, ".cache", "sources", rel);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  } catch (e) {
    failed++;
    console.log(`FAILED ${rel}: ${e.message}`);
  }
}
console.log(`${files.length - failed} of ${files.length} files downloaded`);
