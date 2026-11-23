#!/usr/bin/env node
// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// Confirms that an explore session left nothing behind in a project.
// Usage: node explore-check.mjs [--project <path>]
// Reports draft files, the copied helper, and any source line that still refers to them.
import fs from "node:fs";
import path from "node:path";

const i = process.argv.indexOf("--project");
const project = path.resolve(i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : ".");
const SKIP = new Set(["node_modules", ".git", "dist", "build", "out", ".next", ".nuxt", ".svelte-kit", "coverage", ".cache"]);
const CODE = /\.(tsx?|jsx?|mjs|vue|svelte|astro|html|css|scss)$/;
// Narrow on purpose: ordinary code has `ref.current.focus()` and `state.drafts.map(...)`.
const MARKERS = /ExploreSlot|explore-slot|ui-explore-slot|explore-dock|__explore__|data-ui-explore|\.drafts["'/]|\.drafts\.(jsx?|tsx?|vue|svelte)\b|\.current\.(vue|svelte|component)\b/;

const files = [];
const refs = [];
(function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(project, full).replace(/\\/g, "/");
    if (e.isDirectory()) {
      if (SKIP.has(e.name)) continue;
      if (e.name === "__explore__" || /\.drafts$/.test(e.name)) { files.push(rel + "/"); continue; }
      walk(full);
    } else if (/\.drafts\.\w+$/.test(e.name) || /\.current\.(vue|svelte|component\.ts)$/.test(e.name)) {
      files.push(rel);
    } else if (CODE.test(e.name) && fs.statSync(full).size < 1_000_000) {
      fs.readFileSync(full, "utf8").split("\n").forEach((line, n) => {
        if (MARKERS.test(line)) refs.push(`${rel}:${n + 1}`);
      });
    }
  }
})(project);

// The explore command records an open comparison here so a later session can pick it up.
const statePath = path.join(project, "design-system", "explore.json");
let pending = null;
if (fs.existsSync(statePath)) {
  try { pending = JSON.parse(fs.readFileSync(statePath, "utf8")); } catch { pending = { unreadable: true }; }
}
const leftovers = files.length > 0 || refs.length > 0;

console.log(
  JSON.stringify(
    {
      project: project.replace(/\\/g, "/"),
      clean: !leftovers && !pending,
      pending,
      leftoverFiles: files,
      leftoverReferences: refs.slice(0, 30),
      note: pending
        ? "A comparison is open (see pending). Ask the user whether to continue it or discard it before starting other UI work."
        : leftovers
          ? "Draft files or references remain but no comparison is recorded. Delete the files and remove the references, then run this again."
          : "No explore drafts, helper or references remain.",
    },
    null,
    2
  )
);
