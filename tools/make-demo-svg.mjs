// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// Builds docs/images/demo.svg: a looping, vector walkthrough of the explore command for the README.
// It is an illustration drawn to match the tool (pick an element, compare its variations, apply one),
// not a screen recording. CSS animations only, no script, so it plays inside an <img> on GitHub.
//   node tools/make-demo-svg.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "docs", "images", "demo.svg");
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const PAGE = "#e4e8ee";
const INK = "#18181b";
const SOFT = "#52525b";
const LIME = "#c8f031";
const TOOL = "#0c0c0e";

const stats = [
  { label: "Bu ay tahsilat", value: "₺184.250", change: "+12%", color: "#047857", lit: "#10b981" },
  { label: "Bekleyen fatura", value: "23", change: "-4", color: "#b45309", lit: "#f59e0b" },
  { label: "Vadesi geçen", value: "7", change: "+2", color: "#be123c", lit: "#f43f5e" },
  { label: "Aktif müşteri", value: "142", change: "+9", color: "#0369a1", lit: "#0ea5e9" },
];
const W = 296;
const H = 120;
const text = (x, y, s, attrs = "") => `<text x="${x}" y="${y}" ${attrs}>${s}</text>`;
const pill = (s) =>
  `<rect x="234" y="78" width="44" height="22" rx="11" fill="#dde1e8" stroke="#cdd2da"/>` +
  text(256, 93, s.change, `text-anchor="middle" font-size="12" font-weight="600" fill="#3f3f46"`);

// The stat card as it is, and three drafts of it. Each is 296x120 with its origin at the top left.
const current = (s) =>
  `<rect width="${W}" height="${H}" rx="16" fill="${PAGE}"/>` +
  text(20, 37, s.label, `font-size="14" font-weight="500" fill="${SOFT}"`) +
  `<circle cx="258" cy="33" r="17" fill="#dde1e8" stroke="#cdd2da"/><circle cx="258" cy="33" r="6.5" fill="none" stroke="${s.color}" stroke-width="2"/>` +
  text(20, 95, s.value, `font-size="30" font-weight="700" fill="${INK}"`) +
  pill(s);
const draftA = (s, i) =>
  `<rect width="${W}" height="${H}" rx="16" fill="${PAGE}"/><rect x="20" width="32" height="3" fill="#0e7490"/>` +
  text(20, 39, s.label.toUpperCase(), `font-family="${MONO}" font-size="11" font-weight="500" letter-spacing="1.4" fill="${SOFT}"`) +
  text(276, 39, `0${i + 1}`, `font-family="${MONO}" font-size="11" font-weight="600" text-anchor="end" fill="#155e75"`) +
  text(20, 95, s.value, `font-family="${MONO}" font-size="30" font-weight="500" fill="${INK}"`) +
  text(276, 95, s.change, `font-family="${MONO}" font-size="12" font-weight="600" text-anchor="end" fill="#3f3f46"`);
const draftB = (s) =>
  `<rect width="${W}" height="${H}" rx="16" fill="${PAGE}"/>` +
  `<rect x="18" y="20" width="10" height="80" rx="5" fill="#d3d8e0"/><rect x="21" y="23" width="4" height="74" rx="2" fill="${s.lit}" filter="url(#glow)"/>` +
  text(46, 41, s.label, `font-size="14" font-weight="500" fill="${SOFT}"`) +
  text(46, 93, s.value, `font-size="30" font-weight="700" fill="${INK}"`) +
  pill(s);
const draftC = (s) =>
  `<rect width="${W}" height="${H}" rx="16" fill="#14171c"/>` +
  `<circle cx="37" cy="36" r="16" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.14"/><circle cx="37" cy="36" r="6" fill="none" stroke="#fcd34d" stroke-width="2"/>` +
  text(64, 41, s.label, `font-size="14" font-weight="500" fill="#a1a1aa"`) +
  text(20, 96, s.value, `font-size="30" font-weight="700" fill="#67e8f9" filter="url(#glow)"`) +
  `<rect x="234" y="78" width="44" height="22" rx="11" fill="none" stroke="#ffffff" stroke-opacity="0.18"/>` +
  text(256, 93, s.change, `text-anchor="middle" font-size="12" font-weight="600" fill="#e4e4e7"`);

const cardX = (i) => 24 + i * 312;
const picked = 1; // the stat card the walkthrough picks
const s = stats[picked];

// ---- the page ----
const rows = [
  ["FTR-2026-0412", "Yıldız Lojistik ve Taşımacılık A.Ş.", "₺48.250,50", "28 Kas 2026", "Bekliyor", "#f59e0b", "#92400e"],
  ["FTR-2026-0411", "Deniz Kafe", "₺1.890,00", "20 Kas 2026", "Gecikti", "#ef4444", "#b91c1c"],
  ["FTR-2026-0410", "Akın Mimarlık", "₺23.400,00", "5 Ara 2026", "Ödendi", "#10b981", "#065f46"],
  ["FTR-2026-0409", "Poyraz Yazılım", "₺7.650,75", "18 Kas 2026", "Gecikti", "#ef4444", "#b91c1c"],
  ["FTR-2026-0408", "Ege Organik Gıda", "₺12.980,00", "12 Ara 2026", "Bekliyor", "#f59e0b", "#92400e"],
];
const page = `
<rect width="1280" height="720" fill="${PAGE}"/>
<rect x="24" y="20" width="1232" height="52" rx="16" fill="${INK}"/>
<rect x="38" y="31" width="30" height="30" rx="8" fill="#8b5cf6"/>${text(53, 52, "F", `text-anchor="middle" font-size="15" font-weight="700" fill="#fff"`)}
${text(80, 52, "Faturam", `font-size="16" font-weight="700" fill="#fff"`)}
<rect x="1090" y="31" width="62" height="30" rx="10" fill="#fff"/>${text(1121, 51, "Panel", `text-anchor="middle" font-size="13" font-weight="600" fill="${INK}"`)}
${text(1166, 51, "Ayarlar", `font-size="13" font-weight="500" fill="#d4d4d8"`)}<circle cx="1232" cy="46" r="13" fill="#c4b5fd"/>
${text(24, 120, "Hoş geldiniz", `font-size="26" font-weight="700" fill="${INK}"`)}
<rect x="1128" y="94" width="128" height="38" rx="12" fill="${INK}"/>${text(1192, 118, "+  Yeni fatura", `text-anchor="middle" font-size="13" font-weight="600" fill="#fff"`)}
${stats.map((st, i) => `<g transform="translate(${cardX(i)} 150)" filter="url(#neu)">${current(st)}</g>`).join("\n")}
<g class="settled" transform="translate(${cardX(picked)} 150)">${draftC(s)}</g>
<g filter="url(#neu)"><rect x="24" y="294" width="1232" height="322" rx="16" fill="${PAGE}"/></g>
${text(48, 332, "Son faturalar", `font-size="16" font-weight="700" fill="${INK}"`)}
<rect x="1010" y="310" width="222" height="34" rx="12" fill="#dde1e8" stroke="#a1a1aa"/>${text(1024, 332, "Müşteri ara", `font-size="13" fill="#71717a"`)}
<line x1="24" y1="358" x2="1256" y2="358" stroke="#cdd2da"/>
${["No", "Müşteri", "Tutar", "Vade", "Durum"].map((h, i) => text([48, 200, 930, 980, 1120][i], 380, h, `font-size="12" font-weight="500" fill="${SOFT}" ${i === 2 ? 'text-anchor="end"' : ""}`)).join("")}
${rows
  .map((r, i) => {
    const y = 394 + i * 44;
    return (
      `<line x1="24" y1="${y}" x2="1256" y2="${y}" stroke="#cdd2da"/>` +
      text(48, y + 28, r[0], `font-size="13" fill="${SOFT}"`) +
      text(200, y + 28, r[1], `font-size="13" font-weight="500" fill="${INK}"`) +
      text(930, y + 28, r[2], `font-size="13" text-anchor="end" fill="${INK}"`) +
      text(980, y + 28, r[3], `font-size="13" fill="${SOFT}"`) +
      `<circle cx="1127" cy="${y + 23}" r="7" fill="#d3d8e0"/><circle cx="1127" cy="${y + 23}" r="3" fill="${r[5]}"/>` +
      text(1142, y + 28, r[4], `font-size="12" font-weight="600" fill="${r[6]}"`)
    );
  })
  .join("\n")}`;

// ---- the tool: dock, pick frames, bar ----
const dock = `
<g transform="translate(16 660)">
  <rect width="334" height="44" rx="12" fill="${TOOL}" stroke="#2e2e34"/>
  <circle cx="20" cy="22" r="3.5" fill="${LIME}"/>
  <rect class="dockLit" x="34" y="6" width="112" height="32" rx="8" fill="${LIME}"/>
  ${text(48, 27, "Pick element", `class="dockText" font-size="13" font-weight="600"`)}
  ${text(162, 27, "Style", `font-size="13" font-weight="600" fill="#ececf1"`)}
  ${text(214, 27, "My library", `font-size="13" font-weight="600" fill="#ececf1"`)}
  <circle cx="298" cy="22" r="1.8" fill="#ececf1"/><circle cx="306" cy="22" r="1.8" fill="#ececf1"/><circle cx="314" cy="22" r="1.8" fill="#ececf1"/>
</g>`;
const frame = (cls, x, y, w, h, name) => `
<g class="${cls}">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${LIME}" fill-opacity="0.10" stroke="${LIME}" stroke-width="2.5"/>
  <rect x="${x - 1}" y="${y - 26}" width="${name.length * 7.4 + 16}" height="22" rx="4" fill="${LIME}"/>
  ${text(x + 7, y - 10, name, `font-family="${MONO}" font-size="12" font-weight="600" fill="${TOOL}"`)}
</g>`;

const keys = [
  ["current", "kCur", 62],
  ["A", "kA", 28],
  ["B", "kB", 28],
  ["C", "kC", 28],
];
let kx = 118;
const keycaps = keys
  .map(([label, cls, w]) => {
    const x = kx;
    kx += w + 3;
    return (
      text(x + w / 2, 28, label, `text-anchor="middle" font-family="${MONO}" font-size="12" font-weight="600" fill="#9a9aa5"`) +
      `<g class="${cls}"><rect x="${x}" y="11" width="${w}" height="26" rx="6" fill="${LIME}"/>${text(x + w / 2, 28, label, `text-anchor="middle" font-family="${MONO}" font-size="12" font-weight="600" fill="${TOOL}"`)}</g>`
    );
  })
  .join("");
const bar = `
<g class="bar"><g transform="translate(330 646)">
  <rect width="620" height="48" rx="12" fill="${TOOL}" stroke="#2e2e34"/>
  <circle cx="20" cy="24" r="3.5" fill="${LIME}"/>
  ${text(34, 28, "StatCard", `font-family="${MONO}" font-size="12" font-weight="600" fill="#ececf1"`)}
  <rect x="114" y="8" width="160" height="32" rx="9" fill="#1a1a1e"/>
  ${keycaps}
  <rect x="290" y="8" width="212" height="32" rx="8" fill="#1a1a1e" stroke="#2e2e34"/>
  ${text(302, 28, "more futuristic", `font-size="13" fill="#ececf1"`)}
  <line x1="398" y1="8" x2="398" y2="40" stroke="#2e2e34"/>
  ${text(450, 28, "+ New variations", `text-anchor="middle" font-size="12" font-weight="600" fill="#ececf1"`)}
  <rect x="516" y="8" width="96" height="32" rx="8" fill="${LIME}"/>
  ${text(564, 28, "Apply", `class="applyText" text-anchor="middle" font-size="13" font-weight="700" fill="${TOOL}"`)}
  <g class="applied"><rect x="516" y="8" width="96" height="32" rx="8" fill="#ffc53d"/>${text(564, 28, "✓ Applied", `text-anchor="middle" font-size="13" font-weight="700" fill="${TOOL}"`)}</g>
</g></g>`;

// ---- the close-up: the picked element alone, and its drafts listed beside it ----
const drafts = [
  ["A", "Instrument panel", draftA(s, picked), "i1", "rA"],
  ["B", "Lit rail", draftB(s), "i2", "rB"],
  ["C", "Night panel", draftC(s), "i3", "rC"],
];
const list = drafts
  .map(([key, name, body, cls, ring], i) => {
    const y = 196 + i * 134;
    return `
<g class="${cls}"><g transform="translate(830 ${y})">
  <rect class="${ring}" x="-10" y="-10" width="${W * 0.86 + 20}" height="${H * 0.86 + 20}" rx="22" fill="none" stroke="${LIME}" stroke-width="2.5"/>
  <g transform="scale(0.86)">${body}</g>
  <rect x="${W * 0.86 + 26}" y="26" width="26" height="26" rx="6" fill="#1a1a1e" stroke="#2e2e34"/>
  <g class="${ring}"><rect x="${W * 0.86 + 26}" y="26" width="26" height="26" rx="6" fill="${LIME}"/></g>
  ${text(W * 0.86 + 39, 44, key, `text-anchor="middle" font-family="${MONO}" font-size="13" font-weight="700" fill="#ececf1"`)}
  <g class="${ring}">${text(W * 0.86 + 39, 44, key, `text-anchor="middle" font-family="${MONO}" font-size="13" font-weight="700" fill="${TOOL}"`)}</g>
  ${text(W * 0.86 + 26, 76, name, `font-size="13" font-weight="500" fill="#c9c9d2"`)}
</g></g>`;
  })
  .join("");
const hero = `
<g class="hero">
  <rect x="-6" y="-2" width="${W + 12}" height="${H + 14}" rx="20" fill="#000" fill-opacity="0.35" filter="url(#soft)"/>
  <g class="hCur">${current(s)}</g>
  <g class="hA">${draftA(s, picked)}</g>
  <g class="hB">${draftB(s)}</g>
  <g class="hC">${draftC(s)}</g>
  <rect width="${W}" height="${H}" rx="16" fill="none" stroke="#ffffff" stroke-opacity="0.16"/>
</g>`;
const caption = (cls, n, words) => `
<g class="${cls}"><g transform="translate(640 122)">
  <rect x="${-(words.length * 9.6 + 64) / 2}" y="-27" width="${words.length * 9.6 + 64}" height="42" rx="21" fill="${TOOL}" stroke="#2e2e34"/>
  ${text(0, 0, `<tspan fill="${LIME}" font-family="${MONO}" font-weight="700">${n}</tspan>  ${words}`, `text-anchor="middle" font-size="17" font-weight="600" fill="#ececf1"`)}
</g></g>`;
const cursor = `
<g class="cursor">
  <circle class="ripple" r="22" fill="none" stroke="${LIME}" stroke-width="3"/>
  <path d="M0 0v19l5.2-4.6 3.4 8 3.4-1.5-3.4-7.8H15z" fill="#fff" stroke="${TOOL}" stroke-width="1.4" stroke-linejoin="round"/>
</g>`;

const T = "16s";
const at = (x, y) => `transform:translate(${x}px,${y}px)`;
const home = `${at(cardX(picked), 150)} scale(1)`;
const css = `
text{font-family:${SANS}}
.dim,.hero,.i1,.i2,.i3,.bar,.c1,.c2,.c3,.cursor,.ripple,.fTable,.fCard,.dockLit,.settled,.applied,.hCur,.hA,.hB,.hC,.rA,.rB,.rC,.kCur,.kA,.kB,.kC{animation-duration:${T};animation-iteration-count:infinite;animation-timing-function:ease-in-out}
.dockText{fill:#ececf1;animation:dockText ${T} infinite step-end}
.ripple{transform-box:fill-box;transform-origin:center}
.dim{animation-name:dim}.hero{animation-name:hero}.bar{animation-name:bar}
.i1{animation-name:i1}.i2{animation-name:i2}.i3{animation-name:i3}
.c1{animation-name:c1}.c2{animation-name:c2}.c3{animation-name:c3}
.cursor{animation-name:cursor}.ripple{animation-name:ripple}
.fTable{animation-name:fTable}.fCard{animation-name:fCard}.dockLit{animation-name:dockLit}
.settled{animation-name:settled}.applied{animation-name:applied}
.hCur,.kCur{animation-name:vCur}.hA,.kA,.rA{animation-name:vA}.hB,.kB,.rB{animation-name:vB}.hC,.kC,.rC{animation-name:vC}
@keyframes dim{0%,22.5%{opacity:0}27.5%,90%{opacity:.93}95%,100%{opacity:0}}
@keyframes hero{0%,22.4%{opacity:0;${home}}22.5%{opacity:1;${home}}30%,89%{opacity:1;${at(150, 228)} scale(2)}94%{opacity:1;${home}}95%,100%{opacity:0;${home}}}
@keyframes vCur{0%,49%{opacity:1}51%,100%{opacity:0}}
@keyframes vA{0%,49%{opacity:0}51%,61.5%{opacity:1}63.5%,100%{opacity:0}}
@keyframes vB{0%,61.5%{opacity:0}63.5%,74%{opacity:1}76%,100%{opacity:0}}
@keyframes vC{0%,74%{opacity:0}76%,100%{opacity:1}}
@keyframes i1{0%,33%{opacity:0;transform:translateX(40px)}37%,89%{opacity:1;transform:translateX(0)}92%,100%{opacity:0;transform:translateX(0)}}
@keyframes i2{0%,37%{opacity:0;transform:translateX(40px)}41%,89%{opacity:1;transform:translateX(0)}92%,100%{opacity:0;transform:translateX(0)}}
@keyframes i3{0%,41%{opacity:0;transform:translateX(40px)}45%,89%{opacity:1;transform:translateX(0)}92%,100%{opacity:0;transform:translateX(0)}}
@keyframes bar{0%,27%{opacity:0;transform:translateY(20px)}31%,89%{opacity:1;transform:translateY(0)}93%,100%{opacity:0;transform:translateY(0)}}
@keyframes c1{0%,2%{opacity:0}5%,21%{opacity:1}24%,100%{opacity:0}}
@keyframes c2{0%,29%{opacity:0}32%,76%{opacity:1}79%,100%{opacity:0}}
@keyframes c3{0%,79%{opacity:0}82%,91%{opacity:1}94%,100%{opacity:0}}
@keyframes dockLit{0%,6.4%{opacity:0}6.6%,19%{opacity:1}19.5%,100%{opacity:0}}
@keyframes dockText{0%{fill:#ececf1}6.5%{fill:${TOOL}}19.2%{fill:#ececf1}}
@keyframes fTable{0%,10%{opacity:0}11%,14%{opacity:1}15%,100%{opacity:0}}
@keyframes fCard{0%,15%{opacity:0}16%,23%{opacity:1}25%,100%{opacity:0}}
@keyframes settled{0%,93.5%{opacity:0}94%,98%{opacity:1}100%{opacity:0}}
@keyframes applied{0%,85.4%{opacity:0}85.6%,100%{opacity:1}}
@keyframes cursor{0%{opacity:0;${at(180, 560)}}3%{opacity:1;${at(180, 560)}}6.25%,8%{opacity:1;${at(84, 688)}}12.5%{opacity:1;${at(330, 440)}}16.25%,22%{opacity:1;${at(cardX(picked) + 170, 222)}}23.5%,79%{opacity:0;${at(980, 590)}}81%{opacity:1;${at(980, 590)}}84.5%,88%{opacity:1;${at(898, 676)}}90%,100%{opacity:0;${at(898, 676)}}}
@keyframes ripple{0%,6.2%{opacity:0;transform:scale(.2)}6.3%{opacity:.95;transform:scale(.2)}8.6%{opacity:0;transform:scale(1)}18.6%{opacity:0;transform:scale(.2)}18.75%{opacity:.95;transform:scale(.2)}21%{opacity:0;transform:scale(1)}85.2%{opacity:0;transform:scale(.2)}85.4%{opacity:.95;transform:scale(.2)}87.8%{opacity:0;transform:scale(1)}100%{opacity:0;transform:scale(1)}}
`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-label="Walkthrough: pick an element on the page, compare three variations of it, apply one">
<defs>
  <filter id="neu" x="-10%" y="-20%" width="120%" height="140%"><feDropShadow dx="6" dy="6" stdDeviation="6" flood-color="#c3c8d0"/><feDropShadow dx="-6" dy="-6" stdDeviation="6" flood-color="#ffffff"/></filter>
  <filter id="glow" x="-200%" y="-50%" width="500%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="soft" x="-20%" y="-30%" width="140%" height="170%"><feGaussianBlur stdDeviation="12"/></filter>
  <clipPath id="stage"><rect width="1280" height="720" rx="14"/></clipPath>
</defs>
<style>${css}</style>
<g clip-path="url(#stage)">
${page}
${frame("fTable", 20, 290, 1240, 330, "InvoiceTable")}
${frame("fCard", cardX(picked) - 4, 146, W + 8, H + 8, "StatCard")}
${dock}
<rect class="dim" width="1280" height="720" fill="#08080a"/>
${hero}
${list}
${bar}
${caption("c1", "1", "Pick any element on your page")}
${caption("c2", "2", "Compare variations of it, live")}
${caption("c3", "3", "Apply the one you like")}
${cursor}
</g>
</svg>
`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, svg);
console.log(out, `${(svg.length / 1024).toFixed(1)} kB`);
