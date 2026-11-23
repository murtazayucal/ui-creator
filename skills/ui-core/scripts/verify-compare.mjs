#!/usr/bin/env node
// Compares two page-check reports (before and after a change) and says what got better or worse.
// Usage: node verify-compare.mjs <before.json> <after.json>
// Each file holds one page-check result, or an array of them (several pages or viewport sizes).
import fs from "node:fs";

const [beforePath, afterPath] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const out = (x) => console.log(JSON.stringify(x, null, 2));
if (!beforePath || !afterPath) {
  out({ error: "usage: node verify-compare.mjs <before.json> <after.json>" });
  process.exit(0);
}
const load = (p) => {
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
    return Array.isArray(j) ? j : [j];
  } catch (e) {
    out({ error: `cannot read ${p}`, detail: e.message });
    process.exit(0);
  }
};
const keyOf = (r) => `${r.url ?? "?"} @ ${r.viewport?.width ?? "?"}px ${r.colorScheme ?? ""}`.trim();
const index = (runs) => new Map(runs.map((r) => [keyOf(r), r]));
const before = index(load(beforePath));
const after = index(load(afterPath));

const views = [];
const totals = { regressions: 0, improvements: 0, unchanged: 0 };
for (const key of new Set([...before.keys(), ...after.keys()])) {
  const b = before.get(key);
  const a = after.get(key);
  if (!b || !a) {
    views.push({ view: key, status: b ? "missing from after" : "missing from before" });
    continue;
  }
  const sev = Object.fromEntries([...(b.findings ?? []), ...(a.findings ?? [])].map((f) => [f.rule, f.severity]));
  const rules = [];
  for (const rule of new Set([...Object.keys(b.summary ?? {}), ...Object.keys(a.summary ?? {})])) {
    const was = b.summary?.[rule] ?? 0;
    const now = a.summary?.[rule] ?? 0;
    const change = now > was ? "worse" : now < was ? (now === 0 ? "fixed" : "better") : "same";
    totals[change === "worse" ? "regressions" : change === "same" ? "unchanged" : "improvements"]++;
    rules.push({
      rule,
      severity: sev[rule] ?? null,
      before: was,
      after: now,
      change,
      ...(change === "worse" ? { items: (a.findings ?? []).find((f) => f.rule === rule)?.items?.slice(0, 4) ?? [] } : {}),
    });
  }
  rules.sort((x, y) => (y.change === "worse") - (x.change === "worse") || (y.severity ?? 0) - (x.severity ?? 0));
  views.push({ view: key, rules });
}

const unmatched = views.filter((v) => v.status).length;
out({
  verdict: totals.regressions ? "regressions" : unmatched ? "incomplete" : totals.improvements ? "improved" : "no measurable change",
  totals,
  views,
  note: "Counts only cover what page-check measures. Compare the same pages at the same viewport sizes before and after; a view present on one side only is reported, not compared. A clean comparison does not replace looking at the page.",
});
