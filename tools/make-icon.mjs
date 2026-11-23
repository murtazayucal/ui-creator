#!/usr/bin/env node
// Draws the plugin icon as a PNG with no dependencies.
//   node tools/make-icon.mjs [--variant monogram|cards|swatches|split]   -> .claude-plugin/icon.png (1024x1024)
//   The default, monogram, is the icon in use.
//   node tools/make-icon.mjs --sheet <file.png>                          -> all variants side by side, for choosing
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const opt = (n) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : null);

let W, H, px, ox, oy, sc;
const canvas = (w, h) => { W = w; H = h; px = new Float32Array(w * h * 4); ox = 0; oy = 0; sc = 1; };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
// Signed distance to a rounded rectangle; negative inside.
const sdf = (x, y, cx, cy, hw, hh, r) => {
  const qx = Math.abs(x - cx) - hw + r;
  const qy = Math.abs(y - cy) - hh + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};
// Rounded rectangle in 1024-unit icon coordinates; the current transform maps it onto the canvas.
function rect(x0, y0, w, h, r, color) {
  x0 = ox + x0 * sc; y0 = oy + y0 * sc; w *= sc; h *= sc; r = Math.min(r * sc, w / 2, h / 2);
  const [cr, cg, cb] = hex(color);
  const cx = x0 + w / 2;
  const cy = y0 + h / 2;
  for (let y = Math.max(0, Math.floor(y0 - 2)); y < Math.min(H, Math.ceil(y0 + h + 2)); y++) {
    for (let x = Math.max(0, Math.floor(x0 - 2)); x < Math.min(W, Math.ceil(x0 + w + 2)); x++) {
      const a = Math.min(1, Math.max(0, 0.5 - sdf(x + 0.5, y + 0.5, cx, cy, w / 2, h / 2, r)));
      if (a <= 0) continue;
      const i = (y * W + x) * 4;
      px[i] = cr * a + px[i] * (1 - a);
      px[i + 1] = cg * a + px[i + 1] * (1 - a);
      px[i + 2] = cb * a + px[i + 2] * (1 - a);
      px[i + 3] = a + px[i + 3] * (1 - a);
    }
  }
}

const VARIANTS = {
  // A row of cards with one picked out and shown in a different layout.
  cards() {
    rect(0, 0, 1024, 1024, 224, "#0f172a");
    const top = 300, h = 424, w = 216, gap = 44;
    const left = (1024 - (3 * w + 2 * gap)) / 2;
    const card = (i) => left + i * (w + gap);
    for (const i of [0, 2]) {
      rect(card(i), top, w, h, 36, "#1e293b");
      rect(card(i) + 28, top + 28, w - 56, 150, 20, "#334155");
      rect(card(i) + 28, top + 212, w - 56, 26, 13, "#475569");
      rect(card(i) + 28, top + 258, w - 110, 26, 13, "#334155");
      rect(card(i) + 28, top + h - 80, w - 56, 52, 18, "#334155");
    }
    rect(card(1) - 16, top - 52, w + 32, h + 104, 56, "#38bdf8");
    rect(card(1) - 4, top - 40, w + 8, h + 80, 44, "#0f172a");
    rect(card(1), top - 36, w, h + 72, 40, "#f8fafc");
    rect(card(1), top - 36, w, 190, 40, "#7dd3fc");
    rect(card(1), top + 60, w, 94, 0, "#7dd3fc");
    rect(card(1) + 28, top + 196, w - 56, 30, 15, "#0f172a");
    rect(card(1) + 28, top + 248, w - 96, 24, 12, "#94a3b8");
    rect(card(1) + 28, top + 292, w - 130, 24, 12, "#cbd5e1");
    rect(card(1) + 28, top + h - 52, w - 56, 60, 20, "#0369a1");
  },
  // Four palette swatches, one selected: the palette library.
  swatches() {
    rect(0, 0, 1024, 1024, 224, "#f8fafc");
    const s = 300, gap = 48, x0 = (1024 - 2 * s - gap) / 2, y0 = x0;
    const cells = [["#0f172a", 0, 0], ["#0369a1", 1, 0], ["#f59e0b", 0, 1], ["#38bdf8", 1, 1]];
    rect(x0 + s + gap - 22, y0 - 22, s + 44, s + 44, 94, "#0f172a");
    rect(x0 + s + gap - 10, y0 - 10, s + 20, s + 20, 82, "#f8fafc");
    for (const [c, i, j] of cells) rect(x0 + i * (s + gap), y0 + j * (s + gap), s, s, 72, c);
    // Contrast sample on the selected swatch: a light bar and a short one.
    rect(x0 + s + gap + 56, y0 + 150, 188, 34, 17, "#f8fafc");
    rect(x0 + s + gap + 56, y0 + 206, 120, 28, 14, "#bae6fd");
  },
  // "UI" letterforms built from rounded bars.
  monogram() {
    rect(0, 0, 1024, 1024, 224, "#0c4a6e");
    const top = 300, h = 424, t = 104;
    // U: a tall rounded shape with a tall rounded cut-out, both clipped flat at the top.
    rect(214, top - 200, 344, h + 200, 150, "#f8fafc");
    rect(214 + t, top - 200, 344 - 2 * t, h + 200 - t, 70, "#0c4a6e");
    rect(204, top - 210, 364, 210, 0, "#0c4a6e");
    // I
    rect(662, top, t, h, 28, "#f8fafc");
    // Accent dot above the I
    rect(662 - 6, top - 150, t + 12, t + 12, 60, "#38bdf8");
  },
  // Before and after: scattered blocks on the left, an ordered layout on the right.
  split() {
    rect(0, 0, 1024, 1024, 224, "#0f172a");
    rect(504, 190, 16, 644, 8, "#334155");
    // Before: uneven, misaligned, grey.
    rect(150, 250, 250, 110, 12, "#475569");
    rect(196, 392, 164, 36, 6, "#334155");
    rect(132, 458, 290, 30, 6, "#334155");
    rect(214, 520, 120, 44, 6, "#475569");
    rect(160, 600, 96, 150, 10, "#334155");
    rect(290, 632, 150, 96, 10, "#475569");
    // After: aligned to one edge, clear hierarchy, one accent action.
    rect(584, 250, 300, 150, 28, "#7dd3fc");
    rect(584, 436, 300, 40, 20, "#f8fafc");
    rect(584, 500, 220, 30, 15, "#94a3b8");
    rect(584, 550, 160, 30, 15, "#64748b");
    rect(584, 660, 300, 90, 28, "#0ea5e9");
  },
};

function encode(file) {
  const raw = Buffer.alloc(H * (W * 4 + 1));
  for (let y = 0; y < H; y++) {
    const row = y * (W * 4 + 1);
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const a = px[i + 3];
      for (let c = 0; c < 3; c++) raw[row + 1 + x * 4 + c] = a > 0 ? Math.round(Math.min(1, px[i + c] / a) * 255) : 0;
      raw[row + 1 + x * 4 + 3] = Math.round(a * 255);
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, png);
  console.log(`${file} ${W}x${H} ${(png.length / 1024).toFixed(0)} KB`);
}

const sheet = opt("sheet");
if (sheet) {
  const names = Object.keys(VARIANTS);
  const cell = 420, pad = 40;
  canvas(pad + names.length * (cell + pad), cell + 2 * pad);
  rect(0, 0, W, H, 0, "#e2e8f0");
  names.forEach((name, i) => {
    ox = pad + i * (cell + pad); oy = pad; sc = cell / 1024;
    VARIANTS[name]();
  });
  encode(path.resolve(sheet));
  console.log("order, left to right:", names.join(", "));
} else {
  const name = opt("variant") ?? "monogram"; // the chosen icon
  if (!VARIANTS[name]) {
    console.log(`unknown variant "${name}". Known: ${Object.keys(VARIANTS).join(", ")}`);
    process.exit(0);
  }
  canvas(1024, 1024);
  VARIANTS[name]();
  encode(path.join(root, ".claude-plugin", "icon.png"));
}
