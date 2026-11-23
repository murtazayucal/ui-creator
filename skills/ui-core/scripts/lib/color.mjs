// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// Zero-dependency color utilities: parsing, sRGB <-> OKLCH, WCAG 2.x contrast.
// OKLab matrices: Björn Ottosson, "A perceptual color space for image processing" (public domain / MIT).

const clamp01 = (x) => Math.min(1, Math.max(0, x));

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function linearToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (lin, eps = 1e-4) => lin.every((c) => c >= -eps && c <= 1 + eps);

/** OKLCH -> sRGB (0..1). Out-of-gamut colors keep L and H; chroma is reduced until they fit. */
export function oklchToSrgb([L, C, H]) {
  const h = (H * Math.PI) / 180;
  const at = (c) => oklabToLinear([L, c * Math.cos(h), c * Math.sin(h)]);
  let lin = at(C);
  if (!inGamut(lin)) {
    let lo = 0;
    let hi = C;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(at(mid))) lo = mid;
      else hi = mid;
    }
    lin = at(lo);
  }
  return lin.map((c) => clamp01(toGamma(clamp01(c))));
}

/** sRGB (0..1) -> [L, C, H]; H is 0 for achromatic colors. */
export function srgbToOklch(rgb) {
  const [L, a, b] = linearToOklab(rgb.map(toLinear));
  const C = Math.hypot(a, b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, C < 1e-4 ? 0 : H];
}

function hslToSrgb(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

const num = (t, pctScale = 1) => (t.endsWith("%") ? (parseFloat(t) / 100) * pctScale : parseFloat(t));

/** Parse a CSS color string to sRGB (0..1). Alpha is ignored. Returns null if unsupported. */
export function parseColor(input) {
  if (typeof input !== "string") return null;
  const s = input.trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  }
  m = s.match(/^(oklch|hsla?|rgba?)\(([^)]+)\)$/);
  if (!m) return null;
  const parts = m[2].split("/")[0].trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length < 3) return null;
  let out;
  if (m[1] === "oklch") out = oklchToSrgb([num(parts[0]), num(parts[1], 0.4), parseFloat(parts[2])]);
  else if (m[1].startsWith("hsl")) out = hslToSrgb(((parseFloat(parts[0]) % 360) + 360) % 360, num(parts[1]), num(parts[2]));
  else out = parts.slice(0, 3).map((p) => (p.endsWith("%") ? parseFloat(p) / 100 : parseFloat(p) / 255));
  return out.some(Number.isNaN) ? null : out.map(clamp01);
}

export function toHex(rgb) {
  return "#" + rgb.map((c) => Math.round(clamp01(c) * 255).toString(16).padStart(2, "0")).join("");
}

/** WCAG 2.x relative luminance of an sRGB color (0..1 channels). */
export function luminance(rgb) {
  const [r, g, b] = rgb.map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio, unrounded. */
export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Round down to 2 decimals so a reported ratio never overstates the real one. */
export const floor2 = (x) => Math.floor(x * 100) / 100;

const HUES = [
  [10, "pink"], [35, "red"], [65, "orange"], [115, "yellow"], [165, "green"],
  [200, "teal"], [232, "cyan"], [272, "blue"], [288, "indigo"], [320, "purple"], [360, "pink"],
];

/** Coarse description of a color from its OKLCH values. Thresholds are this project's own. */
export function describe([L, C, H]) {
  const chroma = C < 0.03 ? "neutral" : C < 0.09 ? "muted" : C < 0.17 ? "moderate" : "vivid";
  const hue = chroma === "neutral" ? "neutral" : HUES.find(([max]) => H < max)[1];
  const warm = ["red", "orange", "yellow", "pink"].includes(hue);
  const cool = ["green", "teal", "cyan", "blue", "indigo", "purple"].includes(hue);
  return { hue, chroma, temperature: warm ? "warm" : cool ? "cool" : "neutral" };
}
