// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// Builds docs/images/narrow.svg: a looping, vector walkthrough of the narrow view for the README:
// the frame docked beside the page marks what breaks at 375px, one click hands the list over, the
// layout comes back fixed, and the edge is dragged to a wider width. An illustration drawn to match
// the tool, not a screen recording. CSS animations only, no script, so it plays in an <img> on GitHub.
//   node tools/make-narrow-svg.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "docs", "images", "narrow.svg");
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const PAGE = "#e4e8ee";
const INK = "#18181b";
const SOFT = "#52525b";
const LIME = "#c8f031";
const TOOL = "#0c0c0e";
const RED = "#ff4d4f";
const text = (x, y, s, attrs = "") => `<text x="${x}" y="${y}" ${attrs}>${s}</text>`;
const stroke = (d, color, w = 1.7) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

const stats = [
  ["Bu ay tahsilat", "₺184.250", "+12%", "#10b981"],
  ["Bekleyen fatura", "23", "-4", "#f59e0b"],
  ["Vadesi geçen", "7", "+2", "#f43f5e"],
  ["Aktif müşteri", "142", "+9", "#0ea5e9"],
];

// ---- geometry: the panel is drawn at its wide size; a cover in the page's color hides its left part
// while it is narrow, and slides away as the edge is dragged ----
const PR = 1268; // panel right edge
const NL = 968; // panel left edge when narrow (stands for 375px)
const WL = 748; // panel left edge when wide (stands for 648px)
const SHIFT = WL - NL;

// ---- the page beside it, drawn at full width and scaled down ----
const rail = (x, y, h, color) => `<rect x="${x}" y="${y}" width="9" height="${h}" rx="4.5" fill="#d3d8e0"/><rect x="${x + 2.5}" y="${y + 2.5}" width="4" height="${h - 5}" rx="2" fill="${color}"/>`;
const deskCard = ([label, value, change, color], i) => {
  const x = 24 + i * 312;
  return `<g filter="url(#neu)"><rect x="${x}" y="150" width="296" height="116" rx="16" fill="${PAGE}"/></g>${rail(x + 18, 170, 76, color)}${text(x + 44, 190, label, `font-size="14" font-weight="500" fill="${SOFT}"`)}${text(x + 44, 242, value, `font-size="30" font-weight="700" fill="${INK}"`)}<rect x="${x + 236}" y="224" width="44" height="22" rx="11" fill="#dde1e8" stroke="#cdd2da"/>${text(x + 258, 239, change, `text-anchor="middle" font-size="12" font-weight="600" fill="#3f3f46"`)}`;
};
const rows = [
  ["FTR-2026-0412", "Yıldız Lojistik ve Taşımacılık A.Ş.", "₺48.250,50", "Bekliyor", "#f59e0b", "#92400e"],
  ["FTR-2026-0411", "Deniz Kafe", "₺1.890,00", "Gecikti", "#ef4444", "#b91c1c"],
  ["FTR-2026-0410", "Akın Mimarlık", "₺23.400,00", "Ödendi", "#10b981", "#065f46"],
  ["FTR-2026-0409", "Poyraz Yazılım", "₺7.650,75", "Gecikti", "#ef4444", "#b91c1c"],
  ["FTR-2026-0408", "Ege Organik Gıda", "₺12.980,00", "Bekliyor", "#f59e0b", "#92400e"],
  ["FTR-2026-0407", "Kuzey Eczanesi", "₺3.420,00", "Ödendi", "#10b981", "#065f46"],
];
const desk = `
<rect x="24" y="20" width="1232" height="52" rx="16" fill="${INK}"/>
<rect x="38" y="31" width="30" height="30" rx="8" fill="#8b5cf6"/>${text(53, 52, "F", `text-anchor="middle" font-size="15" font-weight="700" fill="#fff"`)}
${text(80, 52, "Faturam", `font-size="16" font-weight="700" fill="#fff"`)}
<rect x="1090" y="31" width="62" height="30" rx="10" fill="#fff"/>${text(1121, 51, "Panel", `text-anchor="middle" font-size="13" font-weight="600" fill="${INK}"`)}
${text(1166, 51, "Ayarlar", `font-size="13" font-weight="500" fill="#d4d4d8"`)}<circle cx="1232" cy="46" r="13" fill="#c4b5fd"/>
${text(24, 120, "Hoş geldiniz", `font-size="26" font-weight="700" fill="${INK}"`)}
<rect x="1128" y="94" width="128" height="38" rx="12" fill="${INK}"/>${text(1192, 118, "+  Yeni fatura", `text-anchor="middle" font-size="13" font-weight="600" fill="#fff"`)}
${stats.map(deskCard).join("")}
<g filter="url(#neu)"><rect x="24" y="290" width="1232" height="366" rx="16" fill="${PAGE}"/></g>
${text(48, 328, "Son faturalar", `font-size="16" font-weight="700" fill="${INK}"`)}
${rows
  .map((r, i) => {
    const y = 352 + i * 48;
    return `<line x1="24" y1="${y}" x2="1256" y2="${y}" stroke="#cdd2da"/>${text(48, y + 30, r[0], `font-size="13" fill="${SOFT}"`)}${text(220, y + 30, r[1], `font-size="13" font-weight="500" fill="${INK}"`)}${text(960, y + 30, r[2], `font-size="13" text-anchor="end" fill="${INK}"`)}<circle cx="1107" cy="${y + 25}" r="7" fill="#d3d8e0"/><circle cx="1107" cy="${y + 25}" r="3" fill="${r[4]}"/>${text(1122, y + 30, r[3], `font-size="12" font-weight="600" fill="${r[5]}"`)}`;
  })
  .join("")}`;

// ---- what is inside the frame ----
// A phone-sized rendering of the same page: w is the inner width it has, cols how the cards sit.
function phone(x0, w, { broken = false } = {}) {
  const pad = 12;
  const x = x0 + pad;
  const inner = w - pad * 2;
  let s = "";
  // Header: when broken, its content is wider than the capsule and the avatar hangs out.
  s += `<rect x="${x}" y="104" width="${inner}" height="36" rx="11" fill="${INK}"/><rect x="${x + 8}" y="111" width="22" height="22" rx="6" fill="#8b5cf6"/>${text(x + 19, 127, "F", `text-anchor="middle" font-size="11" font-weight="700" fill="#fff"`)}${text(x + 36, 127, "Faturam", `font-size="12" font-weight="700" fill="#fff"`)}`;
  const navRight = broken ? x + inner + 14 : x + inner - 34;
  s += `<rect x="${navRight - 98}" y="110" width="44" height="24" rx="8" fill="#fff"/>${text(navRight - 76, 126, "Panel", `text-anchor="middle" font-size="10.5" font-weight="600" fill="${INK}"`)}${text(navRight - 46, 126, "Ayarlar", `font-size="10.5" font-weight="500" fill="#d4d4d8"`)}<circle cx="${navRight + 16}" cy="122" r="10" fill="#c4b5fd"/>`;
  s += text(x, 170, "Hoş geldiniz", `font-size="18" font-weight="700" fill="${INK}"`);
  s += `<rect x="${x}" y="182" width="84" height="28" rx="9" fill="${PAGE}" stroke="#a1a1aa"/>${text(x + 42, 200, "Müşteri ekle", `text-anchor="middle" font-size="10.5" font-weight="500" fill="#27272a"`)}<rect x="${x + 90}" y="182" width="64" height="28" rx="9" fill="${PAGE}" stroke="#a1a1aa"/>${text(x + 122, 200, "Rapor al", `text-anchor="middle" font-size="10.5" font-weight="500" fill="#27272a"`)}`;
  const wideRow = inner > 300;
  s += wideRow
    ? `<rect x="${x + 160}" y="182" width="96" height="28" rx="9" fill="${INK}"/>${text(x + 208, 200, "+ Yeni fatura", `text-anchor="middle" font-size="10.5" font-weight="600" fill="#fff"`)}`
    : `<rect x="${x}" y="216" width="96" height="28" rx="9" fill="${INK}"/>${text(x + 48, 234, "+ Yeni fatura", `text-anchor="middle" font-size="10.5" font-weight="600" fill="#fff"`)}`;
  const top = wideRow ? 226 : 258;
  let bottom;
  if (broken) {
    // Four cards forced into one row: each too narrow for what it holds, the last one off the screen.
    stats.forEach(([label, value, , color], i) => {
      const cx = x + i * 80;
      s += `<g filter="url(#neuS)"><rect x="${cx}" y="${top}" width="72" height="84" rx="12" fill="${PAGE}"/></g>${rail(cx + 9, top + 12, 60, color)}${text(cx + 26, top + 26, label, `font-size="10.5" font-weight="500" fill="${SOFT}"`)}${text(cx + 26, top + 66, value, `font-size="22" font-weight="700" fill="${INK}"`)}`;
    });
    bottom = top + 84;
  } else {
    const cw = (inner - 10) / 2;
    stats.forEach(([label, value, change, color], i) => {
      const cx = x + (i % 2) * (cw + 10);
      const cy = top + Math.floor(i / 2) * 82;
      s += `<g filter="url(#neuS)"><rect x="${cx}" y="${cy}" width="${cw}" height="72" rx="12" fill="${PAGE}"/></g>${rail(cx + 10, cy + 11, 50, color)}${text(cx + 28, cy + 25, label, `font-size="10.5" font-weight="500" fill="${SOFT}"`)}${text(cx + 28, cy + 56, value, `font-size="${cw > 180 ? 22 : 15}" font-weight="700" fill="${INK}"`)}<rect x="${cx + cw - 42}" y="${cy + 42}" width="32" height="18" rx="9" fill="#dde1e8" stroke="#cdd2da"/>${text(cx + cw - 26, cy + 54.5, change, `text-anchor="middle" font-size="9.5" font-weight="600" fill="#3f3f46"`)}`;
    });
    bottom = top + 154;
  }
  const ty = bottom + 16;
  s += `<g filter="url(#neuS)"><rect x="${x}" y="${ty}" width="${inner}" height="420" rx="12" fill="${PAGE}"/></g>${text(x + 14, ty + 28, "Son faturalar", `font-size="13" font-weight="700" fill="${INK}"`)}<rect x="${x + 14}" y="${ty + 40}" width="${Math.min(170, inner - 28)}" height="26" rx="9" fill="#dde1e8" stroke="#a1a1aa"/>${text(x + 24, ty + 57, "Müşteri ara", `font-size="10.5" fill="#71717a"`)}`;
  rows.slice(0, 5).forEach((r, i) => {
    const y = ty + 80 + i * 34;
    s += `<line x1="${x}" y1="${y}" x2="${x + inner}" y2="${y}" stroke="#cdd2da"/>${text(x + 14, y + 22, r[0], `font-size="10.5" fill="${SOFT}"`)}${text(x + inner - 14, y + 22, r[2], `text-anchor="end" font-size="10.5" fill="${INK}"`)}`;
  });
  return { markup: s, x, inner, top };
}
const narrowX = NL + 8;
const narrowW = PR - 8 - narrowX;
const brokenPhone = phone(narrowX, narrowW, { broken: true });
const fixedPhone = phone(narrowX, narrowW);
const widePhone = phone(WL + 8, PR - 8 - (WL + 8));

// What the scan marks on the broken layout: the header and the four cards.
const mark = (cls, n, x, y, w, h) => `<g class="${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${RED}" fill-opacity="0.09" stroke="${RED}" stroke-width="2"/><rect x="${x + 3}" y="${y + 3}" width="15" height="15" rx="4" fill="${RED}"/>${text(x + 10.5, y + 14.5, n, `text-anchor="middle" font-size="10" font-weight="700" fill="#fff"`)}</g>`;
const marks =
  mark("m1", 1, brokenPhone.x + 240, brokenPhone.top - 2, 40, 88) +
  mark("m2", 2, brokenPhone.x - 2, 102, brokenPhone.inner + 4, 40) +
  [0, 1, 2].map((i) => mark(`m${i + 3}`, i + 3, brokenPhone.x + i * 80 - 2, brokenPhone.top - 2, 76, 88)).join("");

// ---- the panel: its head and the frame ----
const HEAD_Y = 12;
const chip = (x, label, cls = "") =>
  text(x + 17, HEAD_Y + 24, label, `text-anchor="middle" font-family="${MONO}" font-size="11" font-weight="600" fill="#9a9aa5"`) +
  (cls ? `<g class="${cls}"><rect x="${x}" y="${HEAD_Y + 9}" width="34" height="22" rx="6" fill="${LIME}"/>${text(x + 17, HEAD_Y + 24, label, `text-anchor="middle" font-family="${MONO}" font-size="11" font-weight="600" fill="${TOOL}"`)}</g>` : "");
const widthLabel = (cls, s) => `<g class="${cls}">${text(NL + 16, HEAD_Y + 25, s, `font-family="${MONO}" font-size="12" font-weight="700" fill="#ececf1"`)}</g>`;
const status = (cls, color, words, extra = "") => `<g class="${cls}"><circle cx="${NL + 20}" cy="${HEAD_Y + 51}" r="3.5" fill="${color}"/>${text(NL + 30, HEAD_Y + 55, words, `font-size="11.5" font-weight="500" fill="#ececf1"`)}${extra}</g>`;
const panel = `
<rect x="${WL}" y="${HEAD_Y}" width="${PR - WL}" height="68" rx="12" fill="${TOOL}" stroke="#2e2e34"/>
<rect x="${WL}" y="88" width="${PR - WL}" height="620" rx="24" fill="${TOOL}"/>
<g clip-path="url(#frame)">
  <rect x="${WL + 8}" y="96" width="${PR - WL - 16}" height="604" fill="${PAGE}"/>
  <g class="lBroken">${brokenPhone.markup}${marks}</g>
  <g class="lFixed">${fixedPhone.markup}</g>
  <g class="lWide">${widePhone.markup}</g>
</g>`;
const headMoving = `
<g class="slide">
  ${widthLabel("w1", "375px")}${widthLabel("w2", "512px")}${widthLabel("w3", "648px")}
  <rect x="${NL + 66}" y="${HEAD_Y + 6}" width="150" height="28" rx="8" fill="#1a1a1e"/>
  ${chip(NL + 69, "320")}${chip(NL + 105, "375", "chipOn")}${chip(NL + 141, "768")}${chip(NL + 177, "1024")}
  ${status("sIssues", RED, "1 overflowing · 4 not fitting")}
  ${status("sSent", "#ffc53d", "Sent, working…")}
  ${status("sClean", LIME, "Nothing overflowing or cut off")}
</g>
<g transform="translate(${PR - 62} ${HEAD_Y + 8})">${stroke("M12 3v4 M12 17v4 M3 12h4 M17 12h4 M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6z", "#9a9aa5")}</g>
<g transform="translate(${PR - 34} ${HEAD_Y + 8})">${stroke("M6 6l12 12 M18 6L6 18", "#9a9aa5")}</g>
<g class="sIssues"><rect x="${PR - 100}" y="${HEAD_Y + 38}" width="92" height="24" rx="7" fill="${LIME}"/>${text(PR - 54, HEAD_Y + 54.5, "✓ Fix these", `text-anchor="middle" font-size="11.5" font-weight="700" fill="${TOOL}"`)}</g>`;

// ---- the tool's bar, on the page side ----
const BAR_W = 508;
const bar = `
<g class="barSlide"><g transform="translate(${(NL - 16 - BAR_W) / 2} 652)">
  <rect width="${BAR_W}" height="44" rx="12" fill="${TOOL}" stroke="#2e2e34"/>
  <circle cx="18" cy="22" r="3.5" fill="${LIME}"/>
  ${text(30, 26, "StatCard", `font-family="${MONO}" font-size="12" font-weight="600" fill="#ececf1"`)}
  <rect x="104" y="7" width="146" height="30" rx="9" fill="#1a1a1e"/>
  ${text(134, 26, "current", `text-anchor="middle" font-family="${MONO}" font-size="11.5" font-weight="600" fill="#9a9aa5"`)}
  ${text(178, 26, "A", `text-anchor="middle" font-family="${MONO}" font-size="11.5" font-weight="600" fill="#9a9aa5"`)}
  <rect x="192" y="10" width="26" height="24" rx="6" fill="${LIME}"/>${text(205, 26, "B", `text-anchor="middle" font-family="${MONO}" font-size="11.5" font-weight="600" fill="${TOOL}"`)}
  ${text(233, 26, "C", `text-anchor="middle" font-family="${MONO}" font-size="11.5" font-weight="600" fill="#9a9aa5"`)}
  <line x1="260" y1="11" x2="260" y2="33" stroke="#2e2e34"/>
  <rect x="270" y="8" width="28" height="28" rx="8" fill="${LIME}"/>
  <g transform="translate(270 8)">${stroke("M10 5h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z M13 20h2", TOOL)}</g>
  <g transform="translate(300 8)">${stroke("M6 9h10 M20 9h2 M6 19h4 M14 19h8 M18 7v4 M12 17v4", "#9a9aa5")}</g>
  <g transform="translate(330 8)">${stroke("M7 11V7h4 M21 11V7h-4 M7 17v4h4 M21 17v4h-4 M12 12h4v4h-4z", "#9a9aa5")}</g>
  <line x1="368" y1="11" x2="368" y2="33" stroke="#2e2e34"/>
  <rect x="378" y="7" width="92" height="30" rx="8" fill="${LIME}"/>${text(424, 26, "✓ Apply B", `text-anchor="middle" font-size="12.5" font-weight="700" fill="${TOOL}"`)}
  <circle cx="482" cy="22" r="1.7" fill="#ececf1"/><circle cx="488.500" cy="22" r="1.7" fill="#ececf1"/><circle cx="495" cy="22" r="1.7" fill="#ececf1"/>
</g></g>`;

const caption = (cls, n, words) => `
<g class="${cls}"><g transform="translate(${(NL - 16) / 2} 596)">
  <rect x="${-(words.length * 8.9 + 60) / 2}" y="-26" width="${words.length * 8.9 + 60}" height="40" rx="20" fill="${TOOL}" stroke="#2e2e34"/>
  ${text(0, 0, `<tspan fill="${LIME}" font-family="${MONO}" font-weight="700">${n}</tspan>  ${words}`, `text-anchor="middle" font-size="16" font-weight="600" fill="#ececf1"`)}
</g></g>`;
const cursor = `
<g class="cursor">
  <circle class="ripple" r="20" fill="none" stroke="${LIME}" stroke-width="3"/>
  <path d="M0 0v19l5.2-4.6 3.4 8 3.4-1.5-3.4-7.8H15z" fill="#fff" stroke="${TOOL}" stroke-width="1.4" stroke-linejoin="round"/>
</g>`;

const T = "16s";
const at = (x, y) => `transform:translate(${x}px,${y}px)`;
const S1 = ((NL - 16) / 1280).toFixed(4); // the page beside the narrow frame
const S2 = ((WL - 16) / 1280).toFixed(4); // and beside the wide one
const DRAG = "0%,60%{TRANS0}78%,95%{TRANS1}100%{TRANS0}";
const drag = (a, b) => DRAG.replaceAll("TRANS0", a).replaceAll("TRANS1", b);
const pop = (i) => `@keyframes m${i}{0%,${4 + i * 2}%{opacity:0;transform:scale(.6)}${6 + i * 2}%,45%{opacity:1;transform:scale(1)}47%,100%{opacity:0;transform:scale(1)}}`;
const css = `
text{font-family:${SANS}}
.cover,.slide,.grip,.desk,.barSlide,.lBroken,.lFixed,.lWide,.sIssues,.sSent,.sClean,.w1,.w2,.w3,.chipOn,.c1,.c2,.c3,.cursor,.ripple,.m1,.m2,.m3,.m4,.m5{animation-duration:${T};animation-iteration-count:infinite;animation-timing-function:ease-in-out}
.m1,.m2,.m3,.m4,.m5,.ripple{transform-box:fill-box;transform-origin:center}
.cover{animation-name:slide}.slide{animation-name:slide}.grip{animation-name:slide}.desk{animation-name:desk}.barSlide{animation-name:barSlide}
.lBroken{animation-name:lBroken}.lFixed{animation-name:lFixed}.lWide{animation-name:lWide}
.sIssues{animation-name:sIssues}.sSent{animation-name:sSent}.sClean{animation-name:sClean}
.w1{animation-name:w1}.w2{animation-name:w2}.w3{animation-name:w3}.chipOn{animation-name:w1}
.c1{animation-name:c1}.c2{animation-name:c2}.c3{animation-name:c3}
.cursor{animation-name:cursor}.ripple{animation-name:ripple}
${[1, 2, 3, 4, 5].map((i) => `.m${i}{animation-name:m${i}}`).join("")}
@keyframes slide{${drag("transform:translateX(0)", `transform:translateX(${SHIFT}px)`)}}
@keyframes desk{${drag(`transform:scale(${S1})`, `transform:scale(${S2})`)}}
@keyframes barSlide{${drag("transform:translateX(0)", `transform:translateX(${SHIFT / 2}px)`)}}
@keyframes lBroken{0%,45%{opacity:1}47%,99%{opacity:0}100%{opacity:1}}
@keyframes lFixed{0%,45%{opacity:0}47%,66.8%{opacity:1}67%,100%{opacity:0}}
@keyframes lWide{0%,66.8%{opacity:0}67%,97%{opacity:1}100%{opacity:0}}
@keyframes sIssues{0%,5%{opacity:0}7%,31%{opacity:1}31.5%,100%{opacity:0}}
@keyframes sSent{0%,31%{opacity:0}31.5%,45%{opacity:1}47%,100%{opacity:0}}
@keyframes sClean{0%,45%{opacity:0}47%,97%{opacity:1}100%{opacity:0}}
@keyframes w1{0%,63%{opacity:1}63.5%,99%{opacity:0}100%{opacity:1}}
@keyframes w2{0%,63%{opacity:0}63.5%,71%{opacity:1}71.5%,100%{opacity:0}}
@keyframes w3{0%,71%{opacity:0}71.5%,99%{opacity:1}100%{opacity:0}}
${[1, 2, 3, 4, 5].map(pop).join("\n")}
@keyframes c1{0%,3%{opacity:0}6%,28%{opacity:1}31%,100%{opacity:0}}
@keyframes c2{0%,31%{opacity:0}34%,55%{opacity:1}58%,100%{opacity:0}}
@keyframes c3{0%,58%{opacity:0}61%,93%{opacity:1}96%,100%{opacity:0}}
@keyframes cursor{0%{opacity:0;${at(1130, 360)}}16%{opacity:0;${at(1130, 360)}}19%{opacity:1;${at(1130, 360)}}28%,36%{opacity:1;${at(PR - 50, HEAD_Y + 52)}}54%,60%{opacity:1;${at(NL - 2, 398)}}78%,84%{opacity:1;${at(WL - 2, 398)}}88%,100%{opacity:0;${at(WL - 2, 398)}}}
@keyframes ripple{0%,30.4%{opacity:0;transform:scale(.2)}30.6%{opacity:.95;transform:scale(.2)}33.5%{opacity:0;transform:scale(1)}59.4%{opacity:0;transform:scale(.2)}59.6%{opacity:.95;transform:scale(.2)}62.5%{opacity:0;transform:scale(1)}100%{opacity:0;transform:scale(1)}}
`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-label="The narrow view: a phone-width frame beside the page marks what overflows, one click hands the list over, the layout is fixed, and the frame is dragged wider">
<defs>
  <filter id="neu" x="-10%" y="-20%" width="120%" height="140%"><feDropShadow dx="6" dy="6" stdDeviation="6" flood-color="#c3c8d0"/><feDropShadow dx="-6" dy="-6" stdDeviation="6" flood-color="#ffffff"/></filter>
  <filter id="neuS" x="-15%" y="-25%" width="130%" height="150%"><feDropShadow dx="3" dy="3" stdDeviation="3" flood-color="#c3c8d0"/><feDropShadow dx="-3" dy="-3" stdDeviation="3" flood-color="#ffffff"/></filter>
  <clipPath id="frame"><rect x="${WL + 8}" y="96" width="${PR - WL - 16}" height="604" rx="16"/></clipPath>
  <clipPath id="stage"><rect width="1280" height="720" rx="14"/></clipPath>
</defs>
<style>${css}</style>
<g clip-path="url(#stage)">
<rect width="1280" height="720" fill="${PAGE}"/>
${panel}
<g class="cover"><rect x="-400" y="0" width="${NL + 400}" height="720" fill="${PAGE}"/><rect x="${NL}" y="${HEAD_Y}" width="14" height="68" rx="7" fill="${TOOL}"/><rect x="${NL}" y="88" width="8" height="620" rx="4" fill="${TOOL}"/></g>
<g class="desk">${desk}</g>
<g class="grip"><rect x="${NL - 3}" y="370" width="5" height="56" rx="2.5" fill="${LIME}" stroke="${TOOL}" stroke-width="1.5"/></g>
${headMoving}
${bar}
${caption("c1", "1", "It finds what breaks at each width")}
${caption("c2", "2", "One click hands the list to Claude")}
${caption("c3", "3", "Drag the edge to try any width")}
${cursor}
</g>
</svg>
`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, svg);
console.log(out, `${(svg.length / 1024).toFixed(1)} kB`);
