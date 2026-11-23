#!/usr/bin/env node
// Static UI audit: scans source files for machine-detectable UX, accessibility and consistency issues.
// Usage: node audit.mjs [path] [--table] [--max-locations 8]
// Output is JSON unless --table is given. Findings are heuristics from text patterns: verify before fixing.
// Rule metadata lives in ../data/rules.json; this file holds only the detectors.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const table = argv.includes("--table");
const maxIdx = argv.indexOf("--max-locations");
const maxLoc = maxIdx >= 0 ? Math.max(1, parseInt(argv[maxIdx + 1], 10) || 8) : 8;
const target = path.resolve(argv.find((a, i) => !a.startsWith("--") && (maxIdx < 0 || i !== maxIdx + 1)) ?? ".");

let rules;
try {
  rules = JSON.parse(fs.readFileSync(path.join(here, "..", "data", "rules.json"), "utf8")).rules;
} catch (e) {
  console.log(JSON.stringify({ error: "rules.json not found or unreadable", detail: e.message }));
  process.exit(0);
}
const ruleById = Object.fromEntries(rules.map((r) => [r.id, r]));

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "out", ".next", ".nuxt", ".svelte-kit", "coverage", ".cache", ".turbo", "vendor", "public"]);
const MARKUP = new Set([".tsx", ".jsx", ".vue", ".svelte", ".html", ".astro"]);
const STYLE = new Set([".css", ".scss", ".less"]);
const SCRIPT = new Set([".ts", ".js", ".mjs"]);

const files = [];
(function walk(p) {
  let st;
  try { st = fs.statSync(p); } catch { return; }
  if (st.isFile()) {
    const ext = path.extname(p);
    if ((MARKUP.has(ext) || STYLE.has(ext) || SCRIPT.has(ext)) && st.size < 1_000_000 && !/\.(min|d)\.\w+$/.test(p)) files.push(p);
    return;
  }
  for (const name of fs.readdirSync(p)) {
    if (SKIP_DIRS.has(name) || name.startsWith(".")) continue;
    walk(path.join(p, name));
  }
})(target);

const base = fs.existsSync(target) && fs.statSync(target).isDirectory() ? target : path.dirname(target);
const found = {}; // ruleId -> { locations: [], values: Map }
const add = (id, file, line, value) => {
  const f = (found[id] ??= { locations: [], values: new Map() });
  f.locations.push(`${path.relative(base, file).replace(/\\/g, "/") || path.basename(file)}:${line}`);
  if (value) f.values.set(value, (f.values.get(value) ?? 0) + 1);
};

const lineAt = (text, idx) => text.slice(0, idx).split("\n").length;
// An opening tag, tolerating "=>" inside attribute expressions.
const tagRe = (names) => new RegExp(`<(${names})\\b((?:=>|[^>])*)>`, "g");
const EMOJI = /\p{Extended_Pictographic}/u;
const SYMBOL_OK = /[©®™←-⇿✓✔✕✖•‼⁉]/;

let hasAnimation = false;
let hasReducedMotion = false;

for (const file of files) {
  const ext = path.extname(file);
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");
  const markup = MARKUP.has(ext);
  const style = STYLE.has(ext);

  if (/@keyframes|\banimate-[a-z]|\btransition\b|\btransition-/.test(text)) hasAnimation = true;
  if (/prefers-reduced-motion|motion-reduce:|motion-safe:|useReducedMotion/.test(text)) hasReducedMotion = true;

  // ---- line-based detectors ----
  lines.forEach((line, i) => {
    const n = i + 1;
    if (line.includes("audit-ignore")) return;

    if (/\boutline-none\b/.test(line) && !/focus-visible:|focus:(ring|outline|border|shadow)|focus-within:/.test(line)) add("focus-removed", file, n);
    if (style && /outline\s*:\s*(none|0)\b/.test(line)) add("focus-removed", file, n);
    if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/.test(line)) add("zoom-locked", file, n);
    if (/\btransition-all\b|transition\s*:\s*all\b/.test(line)) add("transition-all", file, n);
    if (/tabIndex=\{\s*[1-9]|tabindex=["'][1-9]/.test(line)) add("positive-tabindex", file, n);

    for (const m of line.matchAll(/-\[(\d+(?:\.\d+)?)(px|rem|em)\]/g)) add("arbitrary-value", file, n, `${m[1]}${m[2]}`);

    for (const m of line.matchAll(/text-\[(\d+(?:\.\d+)?)px\]|font-size\s*:\s*(\d+(?:\.\d+)?)px|fontSize\s*:\s*["']?(\d+(?:\.\d+)?)(?:px)?["']?/g)) {
      const px = parseFloat(m[1] ?? m[2] ?? m[3]);
      if (px > 0 && px < 12) add("small-text", file, n, `${px}px`);
    }

    // Hard-coded colors: anywhere in markup; in stylesheets only outside custom-property declarations.
    if (markup || (style && !/^\s*--[\w-]+\s*:/.test(line) && !/^\s*(\/\/|\/?\*)/.test(line))) {
      for (const m of line.matchAll(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
        const before = line.slice(0, m.index);
        if (/(href|id|key|htmlFor|to)=["'{][^"'}]*$/.test(before) || /url\([^)]*$/.test(before) || /&$/.test(before)) continue;
        add("hardcoded-color", file, n, m[0].toLowerCase());
      }
      for (const m of line.matchAll(/\b(?:rgba?|hsla?)\(\s*\d[^)]*\)/g)) add("hardcoded-color", file, n, m[0].replace(/\s+/g, ""));
    }

    if (markup || SCRIPT.has(ext)) {
      if (/["'`>]\s*(Something went wrong|An error occurred|Invalid input|Oops)\b/i.test(line)) add("generic-error-copy", file, n);
    }
    if (markup && EMOJI.test(line.replace(new RegExp(SYMBOL_OK, "g"), "")) && !/^\s*(\/\/|\{?\/\*|\*)/.test(line)) add("emoji-icon", file, n);
    if (/from-(purple|violet|indigo|fuchsia)-\d+.*\bto-(blue|pink|indigo|purple|violet|cyan)-\d+|#667eea|#764ba2/i.test(line) || (/bg-clip-text/.test(line) && /text-transparent/.test(line)))
      add("default-gradient", file, n);
  });

  if (!markup) continue;

  // ---- tag-based detectors ----
  for (const m of text.matchAll(tagRe("html"))) if (!/\blang=/.test(m[2])) add("html-no-lang", file, lineAt(text, m.index));

  for (const m of text.matchAll(tagRe("img|Image"))) {
    if (!/\balt\b/.test(m[2]) && !/\{\.\.\./.test(m[2]) && !/aria-hidden/.test(m[2])) add("img-no-alt", file, lineAt(text, m.index));
  }

  for (const m of text.matchAll(tagRe("div|span|li|p|td|tr|section|article|img"))) {
    const a = m[2];
    if (/\bon[Cc]lick\b|@click\b|on:click\b/.test(a) && !/\brole=|\btab[Ii]ndex\b|onKey(Down|Up|Press)/.test(a)) add("click-on-noninteractive", file, lineAt(text, m.index));
  }

  for (const m of text.matchAll(/<button\b((?:=>|[^>])*)>([\s\S]*?)<\/button>/g)) {
    const [, attrs, inner] = m;
    const line = lineAt(text, m.index);
    if (!/aria-label|aria-labelledby|\btitle=|\{\.\.\./.test(attrs)) {
      // Text left after removing child tags; a bare {expression} may render text, so it counts as a name.
      const rest = inner.replace(/<(?:=>|[^>])*>/g, "").trim();
      if (rest === "") add("button-no-name", file, line);
    }
    const cls = attrs.match(/class(?:Name)?=["'{`]([^"'`}]*)/)?.[1] ?? "";
    const tiny = /\bsize-(?:[1-5]|\[(?:\d|1\d|2[0-3])px\])(?!\S)/.test(cls) || (/\bh-[1-5](?!\S)/.test(cls) && /\bw-[1-5](?!\S)/.test(cls));
    if (tiny && !/\b(p|px|py|min-h|min-w)-/.test(cls)) add("small-target", file, line);
  }

  for (const m of text.matchAll(tagRe("input|textarea|Input|Textarea"))) {
    const a = m[2];
    if (/\bplaceholder=/.test(a) && !/\bid=|aria-label|aria-labelledby|\{\.\.\./.test(a) && !/type=["'](hidden|submit|button|search)["']/.test(a))
      add("placeholder-as-label", file, lineAt(text, m.index));
  }

  // ---- file-level: data views ----
  if (/\b(useQuery|useSWR|useInfiniteQuery)\s*\(|\bfetch\s*\(/.test(text) && /\.map\s*\(/.test(text)) {
    const at = lineAt(text, text.search(/\b(useQuery|useSWR|useInfiniteQuery)\s*\(|\bfetch\s*\(/));
    if (!/isLoading|isPending|isFetching|\bloading\b|Skeleton|Suspense|Spinner/.test(text) || !/isError|\berror\b|catch\s*\(|ErrorBoundary/.test(text)) add("no-loading-error-state", file, at);
    if (!/\.length\s*(===?|<|>|!==?)\s*\d|!\w+(\?)?\.length|\bempty\b|Empty[A-Z]?\w*/.test(text)) add("no-empty-state", file, at);
  }
}

if (hasAnimation && !hasReducedMotion && files.length) found["no-reduced-motion"] = { locations: ["(project-wide)"], values: new Map() };

const findings = Object.entries(found)
  .map(([id, f]) => {
    const r = ruleById[id];
    const top = [...f.values.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([value, count]) => ({ value, count }));
    return {
      rule: id,
      severity: r.severity,
      category: r.category,
      title: r.title,
      count: f.locations.length,
      files: new Set(f.locations.map((l) => l.replace(/:\d+$/, ""))).size,
      fix: r.fix,
      source: r.source,
      ...(top.length ? { distinctValues: f.values.size, topValues: top } : {}),
      locations: f.locations.slice(0, maxLoc),
      ...(f.locations.length > maxLoc ? { moreLocations: f.locations.length - maxLoc } : {}),
    };
  })
  .sort((a, b) => b.severity - a.severity || b.count - a.count);

const result = {
  target: target.replace(/\\/g, "/"),
  filesScanned: files.length,
  summary: [4, 3, 2, 1].reduce((a, s) => ((a[`severity${s}`] = findings.filter((f) => f.severity === s).length), a), {}),
  findings,
  notChecked: rules.filter((r) => r.kind !== "static").map((r) => ({ rule: r.id, kind: r.kind, severity: r.severity, title: r.title })),
  note: "Static findings are text heuristics; confirm each before fixing. A clean result means no automatically detectable issues were found, not that the UI is accessible.",
};

if (!table) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`${result.filesScanned} files scanned in ${result.target}`);
  console.log(`rule groups by severity: 4:${result.summary.severity4} 3:${result.summary.severity3} 2:${result.summary.severity2} 1:${result.summary.severity1}\n`);
  for (const f of findings) {
    console.log(`[${f.severity}] ${f.title}  (${f.rule}, ${f.count} in ${f.files} file${f.files > 1 ? "s" : ""})`);
    if (f.topValues) console.log(`    values: ${f.topValues.map((v) => `${v.value}×${v.count}`).join("  ")}`);
    console.log(`    ${f.locations.join("  ")}${f.moreLocations ? `  +${f.moreLocations} more` : ""}`);
    console.log(`    fix: ${f.fix}`);
  }
  console.log(`\nnot checked by this scan: ${result.notChecked.length} rules (${result.notChecked.filter((r) => r.kind === "rendered").length} need a browser, ${result.notChecked.filter((r) => r.kind === "judgment").length} need judgment)`);
}
