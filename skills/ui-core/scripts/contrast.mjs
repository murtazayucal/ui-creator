#!/usr/bin/env node
// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// WCAG 2.2 contrast for one or more color pairs.
// Usage: node contrast.mjs <foreground> <background> [<foreground> <background> ...] [--json]
// Colors: #hex, oklch(), hsl(), rgb(). Quote values that contain spaces or parentheses.
import { parseColor, contrast, floor2 } from "./lib/color.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const colors = args.filter((a) => a !== "--json");

if (colors.length < 2 || colors.length % 2 !== 0) {
  console.log("Usage: node contrast.mjs <foreground> <background> [more pairs...] [--json]");
  process.exit(0);
}

const rows = [];
for (let i = 0; i < colors.length; i += 2) {
  const fg = parseColor(colors[i]);
  const bg = parseColor(colors[i + 1]);
  if (!fg || !bg) {
    rows.push({ foreground: colors[i], background: colors[i + 1], error: "could not parse color" });
    continue;
  }
  const r = contrast(fg, bg);
  rows.push({
    foreground: colors[i],
    background: colors[i + 1],
    ratio: floor2(r),
    text: r >= 4.5, // body text, AA
    largeText: r >= 3, // >= 24px, or >= 18.66px bold, AA
    ui: r >= 3, // non-text: icons, input borders, focus rings
    textAAA: r >= 7,
  });
}

if (json) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  for (const r of rows) {
    if (r.error) console.log(`${r.foreground} on ${r.background}: ${r.error}`);
    else
      console.log(
        `${r.foreground} on ${r.background}: ${r.ratio.toFixed(2)}:1  ` +
          `text ${r.text ? "PASS" : "FAIL"} (4.5)  large text / UI ${r.ui ? "PASS" : "FAIL"} (3.0)`
      );
  }
}
