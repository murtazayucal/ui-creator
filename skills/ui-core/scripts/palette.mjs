#!/usr/bin/env node
// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// Query the palette library.
//   node palette.mjs --domain fintech [--mode light|dark] [--hue blue] [--chroma muted] [--source daisyui]
//                    [--limit 5] [--include-failing] [--table]
// Output is JSON unless --table is given.
//   node palette.mjs --search "pet"        free-text match on name, product type and notes
//   node palette.mjs --id daisyui-corporate   full record with every contrast check
//   node palette.mjs --domains             list known domains
//   node palette.mjs --stats               counts by source, mode and hue
// By default only modes with no failing text-contrast pair are returned.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(fs.readFileSync(path.join(here, "..", "data", f), "utf8"));

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
};
const out = (x) => console.log(typeof x === "string" ? x : JSON.stringify(x, null, 2));

// Lowercase and strip diacritics so "Sağlık" matches "saglik".
const norm = (s) =>
  String(s ?? "").replace(/İ/g, "i").replace(/ı/g, "i").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

// True when `needle` occurs at the start of a word, so "pet" does not match "appetite".
const startsWord = (hay, needle) => {
  for (let i = hay.indexOf(needle); i >= 0; i = hay.indexOf(needle, i + 1)) {
    if (i === 0 || !/[a-z0-9]/.test(hay[i - 1])) return true;
  }
  return false;
};

let lib, dom;
try {
  lib = load("palettes.json");
  // The palettes are kept in parts; palettes.json names them.
  if (Array.isArray(lib.parts)) lib.palettes = lib.parts.flatMap((f) => load(f).palettes);
  dom = load("domains.json");
} catch (e) {
  out({ error: "palette data not found or unreadable", detail: e.message });
  process.exit(0);
}
const { palettes, meta } = lib;

if (flag("domains")) {
  out(dom.domains.map((d) => ({ id: d.id, aliases: d.aliases, evidence: d.evidence, direction: d.direction })));
  process.exit(0);
}

if (flag("stats")) {
  const count = (fn) => palettes.reduce((a, p) => ((a[fn(p)] = (a[fn(p)] ?? 0) + 1), a), {});
  const modes = palettes.flatMap((p) => Object.values(p.modes));
  out({
    palettes: palettes.length,
    bySource: count((p) => p.source),
    modes: modes.length,
    cleanModes: modes.filter((m) => !m.textFailures.length).length,
    byPrimaryHue: count((p) => p.tags.hue),
  });
  process.exit(0);
}

const id = opt("id");
if (id) {
  const p = palettes.find((x) => x.id === id);
  out(p ? { ...p, sourceInfo: meta.sources[p.source] } : { error: `no palette with id ${id}` });
  process.exit(0);
}

const wantMode = opt("mode");
const wantHue = norm(opt("hue"));
const wantChroma = norm(opt("chroma"));
const wantSource = norm(opt("source"));
const search = norm(opt("search"));
const domainArg = norm(opt("domain"));
const limit = Math.max(1, parseInt(opt("limit") ?? "5", 10) || 5);
const includeFailing = flag("include-failing");

const domain = domainArg
  ? dom.domains.find((d) => d.id === domainArg || d.aliases.some((a) => norm(a) === domainArg)) ??
    dom.domains.find((d) => d.aliases.some((a) => domainArg.includes(norm(a)) || norm(a).includes(domainArg)))
  : null;

// One candidate per palette mode.
let cands = [];
for (const p of palettes) {
  for (const [scheme, m] of Object.entries(p.modes)) {
    if (wantMode && scheme !== wantMode) continue;
    if (!includeFailing && m.textFailures.length) continue;
    if (wantSource && p.source !== wantSource) continue;
    if (wantHue && p.tags.hue !== wantHue) continue;
    if (wantChroma && p.tags.chroma !== wantChroma) continue;
    const hay = norm(`${p.name} ${p.productType ?? ""} ${p.notes ?? ""}`);
    if (search && !startsWord(hay, search)) continue;

    let score = 0;
    const why = [];
    if (domain) {
      const type = norm(p.productType);
      if (type && domain.keywords.some((k) => type.includes(k))) { score += 3; why.push("product type matches domain"); }
      if (domain.hues.includes(p.tags.hue)) { score += 1; why.push(`primary hue ${p.tags.hue} fits`); }
      if (domain.chroma?.includes(p.tags.chroma)) { score += 0.5; why.push(`${p.tags.chroma} chroma fits`); }
      if (!wantMode && domain.scheme === scheme) score += 0.5;
    } else if (domainArg) {
      // Unknown domain: fall back to text match on the raw query.
      if (startsWord(hay, domainArg)) { score += 3; why.push("text match"); }
    }
    score -= m.textFailures.length;
    cands.push({ p, scheme, m, score, why });
  }
}

if (domainArg) cands = cands.filter((c) => c.score > 0);
cands.sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id));

// Pick results that differ in direction: within the best-scoring tier, one candidate per
// primary hue first; then fill by score. Relevance wins over variety across tiers.
const picked = [];
const seenHue = new Set();
const seenPalette = new Set();
const tierFloor = (cands[0]?.score ?? 0) - 1.5;
for (const c of cands) {
  if (picked.length >= limit || c.score < tierFloor) break;
  if (seenHue.has(c.p.tags.hue) || seenPalette.has(c.p.id)) continue;
  picked.push(c);
  seenHue.add(c.p.tags.hue);
  seenPalette.add(c.p.id);
}
for (const c of cands) {
  if (picked.length >= limit) break;
  if (seenPalette.has(c.p.id)) continue;
  picked.push(c);
  seenPalette.add(c.p.id);
}

const SHOW = ["background", "foreground", "card", "primary", "onPrimary", "secondary", "accent", "muted", "border", "destructive"];
const results = picked.map(({ p, scheme, m, why }) => ({
  id: p.id,
  name: p.name,
  mode: scheme,
  otherModes: Object.keys(p.modes).filter((s) => s !== scheme),
  source: p.source,
  license: meta.sources[p.source].license,
  roleModel: meta.sources[p.source].roleModel,
  tags: p.tags,
  why,
  roles: Object.fromEntries(SHOW.filter((r) => m.roles[r]).map((r) => [r, m.roles[r].hex])),
  lowestTextContrast: m.checks.filter((c) => c.kind === "text").sort((a, b) => a.ratio - b.ratio)[0] ?? null,
  textFailures: m.textFailures,
  uiWarnings: m.uiWarnings,
  notes: p.notes,
}));

const result = {
  query: { domain: domainArg || null, mode: wantMode, hue: wantHue || null, chroma: wantChroma || null, source: wantSource || null, search: search || null },
  domain: domain
    ? { id: domain.id, evidence: domain.evidence, direction: domain.direction, caution: domain.caution ?? null, evidenceKey: dom.meta.evidence }
    : domainArg
      ? { id: null, note: "Unknown domain; results are a text match only. Run --domains to see known ones." }
      : null,
  matched: cands.length,
  returned: results.length,
  results,
};

if (!flag("table")) {
  // One line per result keeps the output short enough to be read whole.
  const { results: rows, ...head } = result;
  const body = rows.map((r) => "    " + JSON.stringify(r)).join(",\n");
  console.log(JSON.stringify(head, null, 2).replace(/\n}$/, `,\n  "results": [\n${body}\n  ]\n}`));
} else {
  if (result.domain?.direction) out(`${result.domain.id} [evidence ${result.domain.evidence}]: ${result.domain.direction}`);
  if (result.domain?.caution) out(`caution: ${result.domain.caution}`);
  if (result.domain?.note) out(result.domain.note);
  out(`${result.returned} of ${result.matched} matching`);
  for (const r of results) {
    const low = r.lowestTextContrast;
    out(`\n${r.id}  (${r.name}, ${r.mode}, ${r.tags.hue}/${r.tags.chroma}, ${r.license})`);
    out("  " + Object.entries(r.roles).map(([k, v]) => `${k} ${v}`).join("  "));
    out(`  lowest text contrast: ${low ? `${low.pair} ${low.ratio}` : "n/a"}${r.textFailures.length ? "  FAILS: " + r.textFailures.join(", ") : ""}`);
  }
}
