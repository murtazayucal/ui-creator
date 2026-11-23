#!/usr/bin/env node
// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// Builds skills/ui-core/data/palettes.json from the raw sources in .cache/sources/.
// Sources are parsed as text only; nothing downloaded is executed.
// Usage: node tools/build-palettes.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseColor, toHex, srgbToOklch, contrast, floor2, describe } from "../skills/ui-core/scripts/lib/color.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, ".cache", "sources");
const OUT = path.join(root, "skills", "ui-core", "data", "palettes.json");
const RETRIEVED = "2026-11-23";

const SOURCES = {
  uiuxpromax: {
    project: "ui-ux-pro-max-skill",
    url: "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill",
    version: "main",
    license: "MIT",
    copyright: "Copyright (c) 2024 Next Level Builder",
    roleModel: "shadcn",
    note: "One palette per product type. Its own data-provenance file does not attest that every pair was measured; contrast here is recomputed.",
  },
  tweakcn: {
    project: "tweakcn",
    url: "https://github.com/jnsahaj/tweakcn",
    version: "main",
    license: "Apache-2.0",
    copyright: "See the tweakcn LICENSE file",
    roleModel: "shadcn",
    note: "shadcn theme presets. 'accent' is a subtle hover surface here, not a brand accent.",
  },
  daisyui: {
    project: "daisyUI",
    url: "https://github.com/saadeghi/daisyui",
    version: "5.8.2",
    license: "MIT",
    copyright: "Copyright (c) 2020 Pouya Saadeghi",
    roleModel: "daisyui",
    note: "Roles mapped by this project: background=base-100, card=base-200, border=base-300, destructive=error. 'accent' is a brand accent.",
  },
  catppuccin: {
    project: "Catppuccin palette",
    url: "https://github.com/catppuccin/palette",
    version: null, // filled from palette.json
    license: "MIT",
    copyright: "Copyright (c) 2021 Catppuccin",
    roleModel: "mapped",
    note: "Catppuccin defines 26 named colors, not UI roles. The role mapping is this project's choice (primary=mauve, secondary=blue, accent=peach).",
  },
};

// [text role, surface role]; AA body text needs 4.5:1.
const TEXT_PAIRS = [
  ["foreground", "background"],
  ["cardForeground", "card"],
  ["onPrimary", "primary"],
  ["onSecondary", "secondary"],
  ["onAccent", "accent"],
  ["mutedForeground", "background"],
  ["onDestructive", "destructive"],
];
// Non-text pairs; 3:1. Reported as warnings, not failures.
const UI_PAIRS = [["primary", "background"]];

const problems = [];
const round = (x, d) => Number(x.toFixed(d));

function buildMode(rawRoles, where) {
  const roles = {};
  const rgb = {};
  for (const [role, value] of Object.entries(rawRoles)) {
    if (value == null || value === "") continue;
    const c = parseColor(value);
    if (!c) {
      problems.push(`${where}: cannot parse ${role}="${value}"`);
      continue;
    }
    const [L, C, H] = srgbToOklch(c);
    rgb[role] = c;
    roles[role] = { hex: toHex(c), oklch: [round(L, 3), round(C, 3), round(H, 1)] };
  }
  if (!rgb.background || !rgb.foreground || !rgb.primary) return null;
  const checks = [];
  const run = (pairs, kind, min) => {
    for (const [a, b] of pairs) {
      if (!rgb[a] || !rgb[b]) continue;
      const r = contrast(rgb[a], rgb[b]);
      checks.push({ pair: `${a}/${b}`, kind, min, ratio: floor2(r), pass: r >= min });
    }
  };
  run(TEXT_PAIRS, "text", 4.5);
  run(UI_PAIRS, "ui", 3);
  return {
    roles,
    checks,
    textFailures: checks.filter((c) => c.kind === "text" && !c.pass).map((c) => c.pair),
    uiWarnings: checks.filter((c) => c.kind === "ui" && !c.pass).map((c) => c.pair),
  };
}

const schemeOf = (hexOrCss) => (srgbToOklch(parseColor(hexOrCss))[0] > 0.6 ? "light" : "dark");

function finish(p) {
  if (!Object.keys(p.modes).length) {
    problems.push(`${p.id}: no usable mode, skipped`);
    return null;
  }
  const mode = p.modes.light ?? p.modes.dark;
  p.tags = describe(mode.roles.primary.oklch);
  return p;
}

// ---------- ui-ux-pro-max (CSV) ----------
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function importUiUxProMax() {
  const rows = parseCsv(fs.readFileSync(path.join(SRC, "uiuxpromax", "colors.csv"), "utf8"));
  const header = rows.shift();
  const col = (name) => header.indexOf(name);
  const map = {
    primary: "Primary", onPrimary: "On Primary", secondary: "Secondary", onSecondary: "On Secondary",
    accent: "Accent", onAccent: "On Accent", background: "Background", foreground: "Foreground",
    card: "Card", cardForeground: "Card Foreground", muted: "Muted", mutedForeground: "Muted Foreground",
    border: "Border", destructive: "Destructive", onDestructive: "On Destructive", ring: "Ring",
  };
  const out = [];
  for (const r of rows) {
    if (r.length < header.length) continue;
    const raw = Object.fromEntries(Object.entries(map).map(([k, h]) => [k, r[col(h)]]));
    const id = `uiuxpromax-${r[col("No")].padStart(3, "0")}`;
    const mode = buildMode(raw, id);
    const p = { id, name: r[col("Product Type")], source: "uiuxpromax", productType: r[col("Product Type")], notes: r[col("Notes")], modes: {} };
    if (mode) p.modes[schemeOf(raw.background)] = mode;
    out.push(finish(p));
  }
  return out;
}

// ---------- tweakcn (TypeScript object literal, parsed as text) ----------
function parseLiteral(text) {
  let i = 0;
  const ws = () => {
    for (;;) {
      while (/\s/.test(text[i] ?? "")) i++;
      if (text.startsWith("//", i)) i = text.indexOf("\n", i) + 1 || text.length;
      else if (text.startsWith("/*", i)) i = text.indexOf("*/", i) + 2;
      else return;
    }
  };
  const str = () => {
    const q = text[i++];
    let s = "";
    while (i < text.length && text[i] !== q) {
      if (text[i] === "\\") i++;
      s += text[i++];
    }
    i++;
    return s;
  };
  const value = () => {
    ws();
    const ch = text[i];
    if (ch === "{") {
      i++;
      const obj = {};
      for (;;) {
        ws();
        if (text[i] === "}") { i++; return obj; }
        const key = /["'`]/.test(text[i]) ? str() : text.slice(i, (i = i + text.slice(i).search(/[^\w$-]/)));
        ws();
        if (text[i] !== ":") throw new Error(`expected ':' at ${i}`);
        i++;
        obj[key] = value();
        ws();
        if (text[i] === ",") i++;
      }
    }
    if (ch === "[") {
      i++;
      const arr = [];
      for (;;) {
        ws();
        if (text[i] === "]") { i++; return arr; }
        arr.push(value());
        ws();
        if (text[i] === ",") i++;
      }
    }
    if (/["'`]/.test(ch)) return str();
    const start = i;
    while (i < text.length && !/[,}\]\s]/.test(text[i])) i++;
    return text.slice(start, i);
  };
  return value();
}

function importTweakcn() {
  const text = fs.readFileSync(path.join(SRC, "tweakcn", "theme-presets.ts"), "utf8");
  const start = text.indexOf("{", text.indexOf("defaultPresets"));
  const presets = parseLiteral(text.slice(start));
  const map = {
    background: "background", foreground: "foreground", card: "card", cardForeground: "card-foreground",
    primary: "primary", onPrimary: "primary-foreground", secondary: "secondary", onSecondary: "secondary-foreground",
    accent: "accent", onAccent: "accent-foreground", muted: "muted", mutedForeground: "muted-foreground",
    border: "border", destructive: "destructive", onDestructive: "destructive-foreground", ring: "ring",
  };
  const out = [];
  for (const [key, preset] of Object.entries(presets)) {
    const id = `tweakcn-${key}`;
    const p = { id, name: preset.label ?? key, source: "tweakcn", modes: {} };
    for (const scheme of ["light", "dark"]) {
      const styles = preset.styles?.[scheme];
      if (!styles) continue;
      const raw = Object.fromEntries(Object.entries(map).map(([k, t]) => [k, styles[t]]));
      const mode = buildMode(raw, `${id}/${scheme}`);
      if (mode) p.modes[scheme] = mode;
      else problems.push(`${id}/${scheme}: missing background, foreground or primary; mode skipped`);
    }
    out.push(finish(p));
  }
  return out;
}

// ---------- daisyUI (CSS custom properties) ----------
function importDaisyui() {
  const dir = path.join(SRC, "daisyui");
  const out = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".css")).sort()) {
    const css = fs.readFileSync(path.join(dir, file), "utf8");
    const v = {};
    for (const m of css.matchAll(/--color-([a-z0-9-]+)\s*:\s*([^;]+);/g)) v[m[1]] = m[2].trim();
    const name = file.replace(".css", "");
    const id = `daisyui-${name}`;
    const raw = {
      background: v["base-100"], foreground: v["base-content"], card: v["base-200"], cardForeground: v["base-content"],
      primary: v.primary, onPrimary: v["primary-content"], secondary: v.secondary, onSecondary: v["secondary-content"],
      accent: v.accent, onAccent: v["accent-content"], muted: v["base-200"], border: v["base-300"],
      destructive: v.error, onDestructive: v["error-content"],
      neutral: v.neutral, onNeutral: v["neutral-content"], info: v.info, success: v.success, warning: v.warning,
    };
    const declared = css.match(/color-scheme\s*:\s*(light|dark)/)?.[1];
    const mode = buildMode(raw, id);
    const p = { id, name: name[0].toUpperCase() + name.slice(1), source: "daisyui", modes: {} };
    if (mode) p.modes[declared ?? schemeOf(raw.background)] = mode;
    out.push(finish(p));
  }
  return out;
}

// ---------- Catppuccin (JSON) ----------
function importCatppuccin() {
  const data = JSON.parse(fs.readFileSync(path.join(SRC, "catppuccin", "palette.json"), "utf8"));
  SOURCES.catppuccin.version = data.version ?? null;
  const out = [];
  for (const [key, flavor] of Object.entries(data)) {
    if (!flavor?.colors) continue;
    const c = (n) => flavor.colors[n]?.hex;
    const raw = {
      background: c("base"), foreground: c("text"), card: c("mantle"), cardForeground: c("text"),
      primary: c("mauve"), onPrimary: c("base"), secondary: c("blue"), onSecondary: c("base"),
      accent: c("peach"), onAccent: c("base"), muted: c("surface0"), mutedForeground: c("subtext0"),
      border: c("surface1"), destructive: c("red"), onDestructive: c("base"), ring: c("lavender"),
      success: c("green"), warning: c("yellow"), info: c("sky"),
    };
    const id = `catppuccin-${key}`;
    const mode = buildMode(raw, id);
    const p = { id, name: `Catppuccin ${flavor.name}`, source: "catppuccin", modes: {} };
    if (mode) p.modes[flavor.dark ? "dark" : "light"] = mode;
    out.push(finish(p));
  }
  return out;
}

// ---------- build ----------
const palettes = [...importUiUxProMax(), ...importTweakcn(), ...importDaisyui(), ...importCatppuccin()].filter(Boolean);

const ids = new Set();
for (const p of palettes) {
  if (ids.has(p.id)) problems.push(`duplicate id ${p.id}`);
  ids.add(p.id);
}

for (const s of Object.values(SOURCES)) s.retrieved = RETRIEVED;
const head = {
  schema: 1,
  generated: RETRIEVED,
  contrast: "WCAG 2.2 ratio, rounded down to 2 decimals. Text pairs need 4.5, UI pairs 3.",
  sources: SOURCES,
};
// The plugin directory holds any file over 256 KiB for a reviewer, so the palettes are written in
// parts of at most 200 kB each, and palettes.json is the index that names them.
const LIMIT = 200_000;
const parts = [[]];
let size = 0;
for (const p of palettes) {
  const n = JSON.stringify(p).length + 6;
  if (size + n > LIMIT && parts.at(-1).length) {
    parts.push([]);
    size = 0;
  }
  parts.at(-1).push(p);
  size += n;
}
const dataDir = path.dirname(OUT);
fs.mkdirSync(dataDir, { recursive: true });
for (const f of fs.readdirSync(dataDir)) if (/^palettes-\d+\.json$/.test(f)) fs.unlinkSync(path.join(dataDir, f));
const names = parts.map((_, i) => `palettes-${i + 1}.json`);
parts.forEach((rows, i) => fs.writeFileSync(path.join(dataDir, names[i]), `{\n  "palettes": [\n${rows.map((p) => "    " + JSON.stringify(p)).join(",\n")}\n  ]\n}\n`));
fs.writeFileSync(OUT, `{\n  "meta": ${JSON.stringify(head)},\n  "parts": ${JSON.stringify(names)}\n}\n`);

// ---------- report ----------
const by = (fn) => palettes.reduce((a, p) => ((a[fn(p)] = (a[fn(p)] ?? 0) + 1), a), {});
const modes = palettes.flatMap((p) => Object.entries(p.modes).map(([scheme, m]) => ({ p, scheme, m })));
console.log("palettes:", palettes.length, by((p) => p.source));
console.log("modes:", modes.length, modes.reduce((a, x) => ((a[x.scheme] = (a[x.scheme] ?? 0) + 1), a), {}));
console.log("modes with no text failures:", modes.filter((x) => !x.m.textFailures.length).length);
console.log("palettes with at least one clean mode:", palettes.filter((p) => Object.values(p.modes).some((m) => !m.textFailures.length)).length);
const clean = {};
for (const x of modes) {
  const k = x.p.source;
  clean[k] ??= [0, 0];
  clean[k][1]++;
  if (!x.m.textFailures.length) clean[k][0]++;
}
console.log("clean modes / modes by source:", clean);
const failPairs = {};
for (const x of modes) for (const f of x.m.textFailures) failPairs[f] = (failPairs[f] ?? 0) + 1;
console.log("failing pair counts:", failPairs);
console.log("primary hue:", by((p) => p.tags.hue));
console.log("size:", (fs.statSync(OUT).size / 1024).toFixed(0) + " KB");
console.log("problems:", problems.length);
for (const p of problems.slice(0, 30)) console.log("  -", p);
