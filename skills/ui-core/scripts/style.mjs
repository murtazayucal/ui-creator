#!/usr/bin/env node
// Query the catalog of design languages (data/styles.json).
//   node style.mjs                 list ids, names and one-line summaries
//   node style.mjs --id glass      the full record
//   node style.mjs --id glass,bento   several records, and whether the catalog lists them as a known mix
// Output is JSON.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = (x) => console.log(JSON.stringify(x, null, 2));

let data;
try {
  data = JSON.parse(fs.readFileSync(path.join(here, "..", "data", "styles.json"), "utf8"));
} catch {
  out({ ok: false, error: "cannot read data/styles.json" });
  process.exit(1);
}

const argv = process.argv.slice(2);
const i = argv.indexOf("--id");
const ids = i >= 0 && argv[i + 1] ? argv[i + 1].split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) : [];

if (!ids.length) {
  out({ ok: true, note: data.meta.note, styles: data.styles.map(({ id, name, summary, suits }) => ({ id, name, summary, suits })) });
} else {
  const found = ids.map((id) => data.styles.find((s) => s.id === id)).filter(Boolean);
  const unknown = ids.filter((id) => !data.styles.some((s) => s.id === id));
  const result = { ok: found.length > 0, note: data.meta.note, styles: found };
  if (unknown.length) result.unknown = unknown;
  if (found.length === 2) {
    const [a, b] = found;
    result.mix = a.mixes.includes(b.id) || b.mixes.includes(a.id)
      ? "listed as a common mix: take the layout or structure from one and the surface treatment from the other"
      : "not a common mix: pick one as the base and borrow a single trait from the other, and say which";
  }
  out(result);
  if (!found.length) process.exit(1);
}
