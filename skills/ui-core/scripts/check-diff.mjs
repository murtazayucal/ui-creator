#!/usr/bin/env node
// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// Classifies uncommitted changes against a git base so a styling pass can prove it left logic alone.
//   node check-diff.mjs [--project <path>] [--base <ref>]     (base defaults to HEAD)
// Verdict per file:
//   style-only   only class names, inline styles or stylesheets changed
//   markup       elements or attributes changed; no logic-looking line changed
//   logic        a line that looks like logic changed: review it
//   non-ui       a file that is not markup or styles changed
//   docs / new / deleted
// Heuristic: it compares the files with styling stripped out. It runs git read-only.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (n) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
};
const project = path.resolve(opt("project") ?? ".");
const base = opt("base") ?? "HEAD";
const out = (x) => console.log(JSON.stringify(x, null, 2));

const git = (...args) => execFileSync("git", ["-c", "core.quotepath=false", ...args], { cwd: project, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });

let changed, untracked;
try {
  git("rev-parse", "--verify", `${base}^{commit}`);
  changed = git("diff", "--name-status", "--relative", base).split("\n").filter(Boolean).map((l) => l.split("\t"));
  untracked = git("ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean);
} catch (e) {
  out({ error: "cannot compare against the base", base, detail: String(e.stderr || e.message).trim().split("\n")[0], hint: "The project needs a git repository with at least one commit. Commit or stash before a styling pass so there is a base to compare with." });
  process.exit(0);
}

const MARKUP = new Set([".tsx", ".jsx", ".vue", ".svelte", ".html", ".astro"]);
const STYLE = new Set([".css", ".scss", ".sass", ".less", ".pcss"]);
const DOCS = new Set([".md", ".mdx", ".txt"]);

// Find the index just past the bracket that closes the one at `open`, skipping strings.
function closeOf(text, open) {
  const pairs = { "{": "}", "(": ")" };
  const want = pairs[text[open]];
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      for (i++; i < text.length && text[i] !== ch; i++) if (text[i] === "\\") i++;
    } else if (ch === text[open]) depth++;
    else if (ch === want && --depth === 0) return i + 1;
  }
  return text.length;
}
const blankStrings = (s) => s.replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g, '""');

// Remove everything that only affects styling.
function stripStyling(text) {
  let t = text;
  // class="..." / className="..." / :class="..."
  t = t.replace(/\b(?:class|className)\s*=\s*(["'])(?:\\.|(?!\1).)*\1/gs, "class");
  // className={...} and style={...}: blank string literals inside the expression, drop style objects.
  for (const re of [/\b(?:class|className)\s*=\s*\{/g, /\bstyle\s*=\s*\{/g]) {
    let m;
    let outText = "";
    let last = 0;
    re.lastIndex = 0;
    while ((m = re.exec(t))) {
      const open = m.index + m[0].length - 1;
      const end = closeOf(t, open);
      const isStyle = m[0].startsWith("style");
      outText += t.slice(last, m.index) + (isStyle ? "style" : "class={" + blankStrings(t.slice(open + 1, end - 1)) + "}");
      last = end;
      re.lastIndex = end;
    }
    t = outText + t.slice(last);
  }
  t = t.replace(/\bstyle\s*=\s*(["'])(?:\\.|(?!\1).)*\1/gs, "style");
  // Class-composing helpers anywhere: cn(), clsx(), cva(), twMerge(), tv(), classNames().
  const helper = /\b(?:cn|clsx|cva|twMerge|twJoin|tv|classNames|cx)\s*\(/g;
  let m;
  let outText = "";
  let last = 0;
  while ((m = helper.exec(t))) {
    const open = m.index + m[0].length - 1;
    const end = closeOf(t, open);
    outText += t.slice(last, open) + blankStrings(t.slice(open, end));
    last = end;
    helper.lastIndex = end;
  }
  t = outText + t.slice(last);
  // <style> blocks in single-file components and HTML.
  t = t.replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, "<style/>");
  // Put each opening tag on one line, so wrapping its attributes onto separate lines is not a change.
  t = t.replace(/<[A-Za-z][\w.:-]*\b(?:=>|[^<>])*>/g, (tag) => tag.replace(/\s+/g, " ").replace(/\s+(\/?>)$/, "$1"));
  return t;
}

const lineKey = (l) => l.replace(/\s+/g, " ").trim();
const LOGIC = /\b(use[A-Z]\w*\s*\(|fetch\s*\(|await\b|function\b|=>|\bif\s*\(|\belse\b|\bfor\s*\(|\bwhile\s*\(|\bswitch\s*\(|\breturn\b(?!\s*[(<])|\bimport\b|\bexport\b|\b(const|let|var)\b|set[A-Z]\w*\s*\(|\.(map|filter|reduce|find|sort)\s*\(|\bon[A-Z]\w*\s*=|\b(try|catch|throw)\b|@click|v-if|v-for|\{#if|\{#each)/;

function compareMarkup(oldText, newText) {
  const a = stripStyling(oldText);
  const b = stripStyling(newText);
  if (a.replace(/\s+/g, "") === b.replace(/\s+/g, "")) return { verdict: "style-only" };
  const count = (text) => text.split("\n").map(lineKey).filter(Boolean).reduce((m, l) => m.set(l, (m.get(l) ?? 0) + 1), new Map());
  const ca = count(a);
  const cb = count(b);
  const diff = (x, y) => [...x].flatMap(([l, n]) => Array(Math.max(0, n - (y.get(l) ?? 0))).fill(l));
  const removed = diff(ca, cb);
  const added = diff(cb, ca);
  // A handler line that only gained or lost a plain string attribute (aria-label="…") is not a logic change:
  // compare the logic-looking lines with string-valued attributes removed, and keep only the unmatched ones.
  const sig = (l) => l.replace(/\s[\w:@.-]+=(["'])[^"']*\1/g, "");
  const rem = removed.filter((l) => LOGIC.test(l));
  const add = added.filter((l) => LOGIC.test(l));
  const pool = add.map(sig);
  const logic = [];
  for (const l of rem) {
    const i = pool.indexOf(sig(l));
    if (i >= 0) pool[i] = null;
    else logic.push("- " + l);
  }
  add.forEach((l, i) => pool[i] !== null && logic.push("+ " + l));
  return {
    verdict: logic.length ? "logic" : "markup",
    removedLines: removed.length,
    addedLines: added.length,
    ...(logic.length ? { logicLines: logic.slice(0, 12), ...(logic.length > 12 ? { moreLogicLines: logic.length - 12 } : {}) } : { sample: [...removed.slice(0, 3).map((l) => "- " + l), ...added.slice(0, 3).map((l) => "+ " + l)] }),
  };
}

const files = [];
for (const [status, file, renamedTo] of changed) {
  const rel = renamedTo ?? file;
  const ext = path.extname(rel).toLowerCase();
  if (status.startsWith("D")) { files.push({ file: rel, verdict: "deleted" }); continue; }
  if (status.startsWith("A")) { files.push({ file: rel, verdict: "new" }); continue; }
  if (DOCS.has(ext) || rel.startsWith("design-system/")) { files.push({ file: rel, verdict: "docs" }); continue; }
  if (STYLE.has(ext)) { files.push({ file: rel, verdict: "style-only" }); continue; }
  if (!MARKUP.has(ext)) { files.push({ file: rel, verdict: "non-ui" }); continue; }
  let oldText, newText;
  try {
    oldText = git("show", `${base}:./${file}`);
    newText = fs.readFileSync(path.join(project, rel), "utf8");
  } catch (e) {
    files.push({ file: rel, verdict: "unreadable", detail: String(e.message).split("\n")[0] });
    continue;
  }
  files.push({ file: rel, ...compareMarkup(oldText, newText) });
}
for (const rel of untracked) {
  const ext = path.extname(rel).toLowerCase();
  files.push({ file: rel, verdict: DOCS.has(ext) || rel.startsWith("design-system/") ? "docs" : "new" });
}

const summary = files.reduce((a, f) => ((a[f.verdict] = (a[f.verdict] ?? 0) + 1), a), {});
const review = files.filter((f) => ["logic", "non-ui", "deleted", "unreadable"].includes(f.verdict)).map((f) => f.file);
out({
  project: project.replace(/\\/g, "/"),
  base,
  filesChanged: files.length,
  summary,
  needsReview: review,
  files,
  note: "'logic' and 'non-ui' are prompts to review, not proof of a problem: adding a loading branch is a legitimate logic change, but it needs the user's agreement. 'style-only' is strong evidence that behavior is unchanged; 'markup' changes can still affect behavior (removed elements, changed attributes).",
});
