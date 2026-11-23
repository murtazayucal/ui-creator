// Builds docs/images/styles.svg: a looping, vector tour of the twelve design languages in the Style
// window, for the README. An illustration drawn to match the tool, not a screen recording. CSS
// animations only, no script, so it plays inside an <img> on GitHub. Names and summaries come from
// skills/ui-core/data/styles.json.
//   node tools/make-styles-svg.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "docs", "images", "styles.svg");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "skills", "ui-core", "data", "styles.json"), "utf8")).styles;

const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const SERIF = "Georgia, 'Times New Roman', serif";
const LIME = "#c8f031";
const TOOL = "#0c0c0e";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const text = (x, y, s, attrs = "") => `<text x="${x}" y="${y}" ${attrs}>${s}</text>`;

// One small specimen per language, 168x100: a card with a title, a line of text and a button.
const PW = 168;
const PH = 100;
const specimen = ({ bg, before = "", card, title = {}, line, button, after = "", x = 18 }) =>
  `<rect width="${PW}" height="${PH}" fill="${bg}"/>${before}${card}` +
  text(x + 12, 40, title.text ?? "Aa Title", `font-size="13" font-weight="${title.weight ?? 700}" fill="${title.fill}" ${title.attrs ?? ""}`) +
  `<rect x="${x + 12}" y="48" width="${line.w ?? 76}" height="${line.h ?? 4}" rx="${line.rx ?? 2}" fill="${line.fill}"/>` +
  (button
    ? `<rect x="${x + 12}" y="60" width="46" height="18" rx="${button.rx}" fill="${button.fill}" ${button.attrs ?? ""}/>` +
      text(x + 35, 73, "Button", `text-anchor="middle" font-size="9" font-weight="600" fill="${button.text}" ${button.textAttrs ?? ""}`)
    : "") +
  after;
const box = (attrs, x = 18, w = 132) => `<rect x="${x}" y="14" width="${w}" height="72" ${attrs}/>`;
const SPECIMENS = {
  glass: specimen({ bg: "url(#gGlass)", card: box(`rx="12" fill="#fff" fill-opacity="0.22" stroke="#fff" stroke-opacity="0.55"`), title: { fill: "#fff" }, line: { fill: "#ffffffb3" }, button: { rx: 9, fill: "#ffffffd9", text: "#6d28d9" } }),
  neumorph: specimen({ bg: "#e4e8ee", card: `<g filter="url(#neuS)">${box(`rx="14" fill="#e4e8ee"`)}</g>`, title: { fill: "#3f3f46" }, line: { fill: "#b6bcc6" }, button: { rx: 9, fill: "#e4e8ee", text: "#52525b", attrs: `filter="url(#neuXS)"` } }),
  clay: specimen({ bg: "#fde7f0", card: `<g filter="url(#drop)">${box(`rx="22" fill="#c7d2fe"`)}</g>${box(`rx="22" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="2"`)}`, title: { fill: "#312e81" }, line: { fill: "#818cf8" }, button: { rx: 9, fill: "#fb7185", text: "#7f1d1d" } }),
  brutalist: specimen({ bg: "#fde047", before: `<rect x="23" y="19" width="132" height="72" fill="#000"/>`, card: box(`fill="#fff" stroke="#000" stroke-width="3"`), title: { fill: "#000", weight: 800, text: "AA TITLE" }, line: { fill: "#000", h: 5, rx: 0 }, button: { rx: 0, fill: "#22d3ee", text: "#000", attrs: `stroke="#000" stroke-width="2"` } }),
  minimal: specimen({ bg: "#ffffff", card: box(`rx="4" fill="#fff" stroke="#e4e4e7"`), title: { fill: "#18181b", weight: 600 }, line: { fill: "#cbd5e1" }, button: { rx: 4, fill: "#18181b", text: "#fff" } }),
  material: specimen({ bg: "#eef2f7", card: `<g filter="url(#drop)">${box(`rx="10" fill="#fff"`)}</g>`, title: { fill: "#18181b", weight: 600 }, line: { fill: "#cbd5e1" }, button: { rx: 9, fill: "#2563eb", text: "#fff" } }),
  bento: specimen({ bg: "#f1f5f9", card: box(`rx="14" fill="#fff"`, 14, 84), x: 14, title: { fill: "#18181b" }, line: { fill: "#cbd5e1", w: 44 }, button: { rx: 9, fill: "#0f172a", text: "#fff" }, after: `<rect x="104" y="14" width="50" height="33" rx="12" fill="#fb923c"/><rect x="104" y="53" width="50" height="33" rx="12" fill="#0f172a"/>` }),
  editorial: specimen({ bg: "#f8f5ef", card: `<rect x="18" y="16" width="132" height="1.5" fill="#1c1917"/><rect x="18" y="86" width="132" height="1" fill="#a8a29e"/>`, title: { fill: "#1c1917", attrs: `font-family="${SERIF}"`, weight: 700 }, line: { fill: "#a8a29e" }, after: text(30, 73, "Button", `font-family="${SERIF}" font-style="italic" font-size="10" font-weight="700" fill="#1c1917" text-decoration="underline"`) }),
  neon: specimen({ bg: "#0b1020", card: box(`rx="10" fill="#0f172a" stroke="#22d3ee" filter="url(#glowS)"`), title: { fill: "#67e8f9" }, line: { fill: "#334155" }, button: { rx: 9, fill: "#0f172a", text: "#f0abfc", attrs: `stroke="#e879f9" filter="url(#glowS)"` } }),
  pastel: specimen({ bg: "#f5f3ff", card: box(`rx="18" fill="#dcfce7"`), title: { fill: "#166534" }, line: { fill: "#86c79b" }, button: { rx: 9, fill: "#fed7aa", text: "#9a3412" } }),
  corporate: specimen({ bg: "#f3f4f6", card: box(`rx="3" fill="#fff" stroke="#d1d5db"`) + `<rect x="18" y="14" width="132" height="4" fill="#1d4ed8"/>`, title: { fill: "#111827", weight: 600 }, line: { fill: "#d1d5db" }, button: { rx: 3, fill: "#1d4ed8", text: "#fff" } }),
  terminal: specimen({ bg: "#0a0a0a", card: box(`fill="none" stroke="#a3e635" stroke-dasharray="3 3"`), title: { fill: "#d9f99d", weight: 500, attrs: `font-family="${MONO}"` }, line: { fill: "#4d7c0f", rx: 0 }, button: { rx: 0, fill: "#a3e635", text: "#0a0a0a", textAttrs: `font-family="${MONO}"` } }),
};
const CARE = new Set(["glass", "neumorph", "neon"]); // the tool marks these: they need contrast care
const styles = catalog.filter((s) => SPECIMENS[s.id]);
const N = styles.length;

// ---- the Style window (left) ----
const TW = 168;
const TH = 134;
const tileAt = (i) => ({ x: 66 + (i % 4) * (TW + 12), y: 116 + Math.floor(i / 4) * (TH + 12) });
const tiles = styles
  .map((s, i) => {
    const { x, y } = tileAt(i);
    return `
<g transform="translate(${x} ${y})">
  <g clip-path="url(#tile)"><use href="#p-${s.id}"/><rect y="${PH}" width="${TW}" height="${TH - PH}" fill="#1a1a1e"/></g>
  <rect width="${TW}" height="${TH}" rx="10" fill="none" stroke="#2e2e34" stroke-width="1.5"/>
  ${text(12, 122, esc(s.name), `font-size="12" font-weight="600" fill="#ececf1"`)}
  ${CARE.has(s.id) ? text(TW - 10, 122, "contrast care", `text-anchor="end" font-size="8.5" font-weight="600" fill="#ffc53d"`) : ""}
  <g class="s${i}">
    <rect x="-3" y="-3" width="${TW + 6}" height="${TH + 6}" rx="13" fill="none" stroke="${LIME}" stroke-width="3"/>
    <rect x="${TW - 30}" y="8" width="22" height="22" rx="6" fill="${LIME}"/>${text(TW - 19, 24, "1", `text-anchor="middle" font-family="${MONO}" font-size="12" font-weight="700" fill="${TOOL}"`)}
  </g>
</g>`;
  })
  .join("");
const windowBox = `
<rect x="40" y="36" width="760" height="648" rx="16" fill="${TOOL}" stroke="#2e2e34"/>
${text(66, 76, "Choose a design language", `font-size="18" font-weight="700" fill="#ececf1"`)}
${text(66, 98, "Pick one, or two to mix", `font-size="13" fill="#9a9aa5"`)}
<rect x="712" y="56" width="64" height="32" rx="8" fill="${TOOL}" stroke="#2e2e34"/>${text(744, 77, "Close", `text-anchor="middle" font-size="13" font-weight="600" fill="#ececf1"`)}
${tiles}
<line x1="40" y1="566" x2="800" y2="566" stroke="#2e2e34"/>
<rect x="66" y="584" width="470" height="40" rx="8" fill="#1a1a1e" stroke="#2e2e34"/>${text(80, 609, "or describe it in your own words", `font-size="13" fill="#9a9aa5"`)}
<rect x="546" y="584" width="96" height="40" rx="8" fill="${TOOL}" stroke="#2e2e34"/>${text(594, 609, "This page", `text-anchor="middle" font-size="13" font-weight="600" fill="#ececf1"`)}
<rect x="652" y="584" width="124" height="40" rx="8" fill="${LIME}"/>${text(714, 609, "Pick an element", `text-anchor="middle" font-size="13" font-weight="700" fill="${TOOL}"`)}
${text(66, 656, "Twelve built in. Anything else: say it in a sentence.", `font-size="12" fill="#9a9aa5"`)}`;

// ---- the close-up (right): the chosen language, large, with its name and what it is ----
const wrap = (s, max = 46) => {
  const lines = [""];
  for (const w of s.split(" ")) {
    if ((lines[lines.length - 1] + " " + w).trim().length > max) lines.push(w);
    else lines[lines.length - 1] = (lines[lines.length - 1] + " " + w).trim();
  }
  return lines;
};
const SCALE = 2.3;
const HX = 846;
const HY = 150;
const closeUp = styles
  .map(
    (s, i) => `
<g class="s${i}">
  <g transform="translate(${HX} ${HY}) scale(${SCALE})" clip-path="url(#specimen)"><use href="#p-${s.id}"/></g>
  ${text(HX, 436, esc(s.name), `font-size="28" font-weight="700" fill="#ececf1"`)}
  ${wrap(s.summary).map((l, k) => text(HX, 468 + k * 22, esc(l), `font-size="15" fill="#c9c9d2"`)).join("")}
</g>`
  )
  .join("");
const side = `
${text(HX, 122, "YOUR COMPONENT, IN THAT LANGUAGE", `font-family="${MONO}" font-size="11" font-weight="600" letter-spacing="1.4" fill="${LIME}"`)}
<rect x="${HX}" y="${HY}" width="${PW * SCALE}" height="${PH * SCALE}" rx="16" fill="none" stroke="#2e2e34" stroke-width="1.5"/>
${closeUp}
<line x1="${HX}" y1="560" x2="${HX + PW * SCALE}" y2="560" stroke="#2e2e34"/>
${text(HX, 590, "A style sets the shape: surface, edge, depth, corners, type.", `font-size="13" fill="#9a9aa5"`)}
${text(HX, 612, "The colors stay your project's own.", `font-size="13" fill="#9a9aa5"`)}
${text(HX, 648, "Contrast and state rules still apply to every draft.", `font-size="13" fill="#9a9aa5"`)}`;

// ---- timing: each language holds for one twelfth of the loop ----
const T = N * 1.6;
const pc = (n) => `${Math.max(0, Math.min(100, n)).toFixed(2)}%`;
const step = 100 / N;
const shows = styles
  .map((_, i) => {
    const a = i * step;
    const b = a + step;
    if (i === 0) return `@keyframes s0{0%,${pc(b - 0.6)}{opacity:1}${pc(b + 0.6)},99.4%{opacity:0}100%{opacity:1}}`;
    if (i === N - 1) return `@keyframes s${i}{0%,${pc(a - 0.6)}{opacity:0}${pc(a + 0.6)},99.4%{opacity:1}100%{opacity:0}}`;
    return `@keyframes s${i}{0%,${pc(a - 0.6)}{opacity:0}${pc(a + 0.6)},${pc(b - 0.6)}{opacity:1}${pc(b + 0.6)},100%{opacity:0}}`;
  })
  .join("\n");
const spot = (i) => {
  const { x, y } = tileAt(i % N);
  return `transform:translate(${x + 104}px,${y + 78}px)`;
};
const moves =
  `@keyframes cursor{` +
  styles.map((_, i) => `${pc(i * step)},${pc((i + 1) * step - 2.4)}{${spot(i)}}`).join("") +
  `100%{${spot(0)}}}`;
const css = `
text{font-family:${SANS}}
${styles.map((_, i) => `.s${i}{animation:s${i} ${T}s infinite ease-in-out}`).join("")}
.cursor{animation:cursor ${T}s infinite ease-in-out}
${shows}
${moves}
`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-label="The Style window: twelve design languages, each shown on a sample component">
<defs>
  <linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="0.5" stop-color="#ec4899"/><stop offset="1" stop-color="#f59e0b"/></linearGradient>
  <filter id="neuS" x="-20%" y="-30%" width="140%" height="160%"><feDropShadow dx="4" dy="4" stdDeviation="4" flood-color="#c3c8d0"/><feDropShadow dx="-4" dy="-4" stdDeviation="4" flood-color="#ffffff"/></filter>
  <filter id="neuXS" x="-30%" y="-50%" width="160%" height="200%"><feDropShadow dx="2" dy="2" stdDeviation="1.5" flood-color="#c3c8d0"/><feDropShadow dx="-2" dy="-2" stdDeviation="1.5" flood-color="#ffffff"/></filter>
  <filter id="drop" x="-20%" y="-30%" width="140%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity="0.18"/></filter>
  <filter id="glowS" x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <clipPath id="tile"><rect width="${TW}" height="${TH}" rx="10"/></clipPath>
  <clipPath id="specimen"><rect width="${PW}" height="${PH}" rx="7"/></clipPath>
  <clipPath id="stage"><rect width="1280" height="720" rx="14"/></clipPath>
  ${styles.map((s) => `<g id="p-${s.id}">${SPECIMENS[s.id]}</g>`).join("\n  ")}
</defs>
<style>${css}</style>
<g clip-path="url(#stage)">
<rect width="1280" height="720" fill="#08080a"/>
${windowBox}
${side}
<g class="cursor"><path d="M0 0v19l5.2-4.6 3.4 8 3.4-1.5-3.4-7.8H15z" fill="#fff" stroke="${TOOL}" stroke-width="1.4" stroke-linejoin="round"/></g>
</g>
</svg>
`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, svg);
console.log(out, `${(svg.length / 1024).toFixed(1)} kB`, `${N} styles, ${T}s loop`);
