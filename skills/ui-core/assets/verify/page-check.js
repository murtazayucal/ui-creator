// Rendered-page checks for the rules a source scan cannot test. Evaluate this file's text in the page once:
// it defines window.__uiPageCheck and returns a first report. Call __uiPageCheck() again after each resize
// or theme switch; evaluate the file again after a full page reload. Read-only: it changes nothing in the page.
// Covers: text contrast, target size, horizontal overflow, content spilling out of its box, clipped text, small text, names of controls
// and images, heading order, document language and title. Measures the page as it is now, at the
// current viewport size and theme: run it once per size and theme you care about.
window.__uiPageCheck = () => {
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  // Any CSS color -> [r, g, b, a] with channels 0..255 and alpha 0..1, via the browser's own parser.
  const rgba = (css) => {
    if (cache.has(css)) return cache.get(css);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    const a = d[3] / 255;
    const out = a === 0 ? [0, 0, 0, 0] : [d[0], d[1], d[2], a];
    cache.set(css, out);
    return out;
  };
  const over = (top, bottom) => {
    const a = top[3];
    return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat(1);
  };
  const lum = (c) => {
    const f = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

  // Background actually behind an element: composite ancestors until one is opaque.
  const backgroundOf = (el) => {
    const layers = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return null; // gradient or image: not measurable here
      const c = rgba(cs.backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] === 1) break;
    }
    let bg = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
    return bg;
  };

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none" && parseFloat(cs.opacity) > 0;
  };
  const label = (el) => {
    const cls = typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
    const txt = (el.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim().slice(0, 40);
    return `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${cls}${txt ? ` "${txt}"` : ""}`;
  };
  const size = (el) => {
    const r = el.getBoundingClientRect();
    return `${Math.round(r.width)}x${Math.round(r.height)}`;
  };

  const found = {};
  const add = (rule, severity, item) => {
    const f = (found[rule] ??= { rule, severity, count: 0, items: [] });
    f.count++;
    if (f.items.length < 6) f.items.push(item);
  };

  const all = [...document.querySelectorAll("body *")].filter((el) => !el.closest("[data-ui-explore-outline]")).slice(0, 6000);
  const shown = all.filter(visible);
  const vw = document.documentElement.clientWidth;

  // --- document ---
  if (!document.documentElement.lang) add("html-no-lang", 3, "<html> has no lang");
  if (!document.title.trim()) add("no-title", 3, "document has no <title>");
  if (document.documentElement.scrollWidth > vw + 1) {
    const wide = shown.filter((el) => el.getBoundingClientRect().right > vw + 1 && !el.contains(document.querySelector("main")));
    add("reflow", 3, `page scrolls horizontally at ${vw}px: content is ${document.documentElement.scrollWidth}px wide; e.g. ${wide.slice(0, 3).map(label).join("; ")}`);
  }

  // --- content wider than its box (spills over neighbours); report the innermost element only ---
  const spills = (el) => {
    const cs = getComputedStyle(el);
    return cs.display !== "inline" && cs.overflowX === "visible" && el.scrollWidth > el.clientWidth + 1;
  };
  for (const el of shown) {
    if (el.clientWidth > 0 && spills(el) && ![...el.children].some((c) => c.clientWidth > 0 && spills(c)))
      add("content-overflow", 3, `${label(el)} holds ${el.scrollWidth}px of content in a ${el.clientWidth}px box`);
  }

  // --- text ---
  const pairs = new Map();
  let unmeasured = 0;
  for (const el of shown) {
    if (!["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) {
      const cs = getComputedStyle(el);
      const px = parseFloat(cs.fontSize);
      if (px < 12) add("small-text", 2, `${label(el)} is ${px}px`);
      const bg = backgroundOf(el);
      if (!bg) { unmeasured++; continue; }
      const fg = over(rgba(cs.color), bg);
      const r = ratio(fg, bg);
      const large = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
      const min = large ? 3 : 4.5;
      if (r < min && !el.closest("[disabled], [aria-disabled='true']")) {
        const key = `${hex(fg)} on ${hex(bg)}`;
        const p = pairs.get(key) ?? { ratio: Math.floor(r * 100) / 100, min, count: 0, example: label(el) };
        p.count++;
        pairs.set(key, p);
      }
      if ((cs.overflowX === "hidden" || cs.overflowX === "clip") && el.scrollWidth > el.clientWidth + 1 && cs.textOverflow !== "ellipsis" && cs.whiteSpace === "nowrap")
        add("clipped-text", 2, `${label(el)} is cut off with no ellipsis`);
    }
  }
  for (const [key, p] of [...pairs].sort((a, b) => a[1].ratio - b[1].ratio)) {
    const f = (found["text-contrast"] ??= { rule: "text-contrast", severity: 3, count: 0, items: [] });
    f.count += p.count;
    if (f.items.length < 8) f.items.push(`${key} = ${p.ratio}:1 (needs ${p.min}), ${p.count} element${p.count > 1 ? "s" : ""}, e.g. ${p.example}`);
  }

  // --- controls ---
  const controls = shown.filter((el) => el.matches("a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=tab], [role=checkbox], [role=switch], [tabindex]:not([tabindex='-1'])"));
  const touch = vw <= 480;
  let under44 = 0;
  for (const el of controls) {
    const r = el.getBoundingClientRect();
    const inline = el.tagName === "A" && getComputedStyle(el).display === "inline" && (el.parentElement?.innerText || "").trim().length > (el.innerText || "").trim().length;
    if (!inline && (r.width < 24 || r.height < 24)) add("target-size", 3, `${label(el)} is ${size(el)}`);
    else if (touch && !inline && (r.width < 44 || r.height < 44)) under44++;

    const named = (el.innerText || "").trim() || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.getAttribute("title") || el.querySelector("img[alt]:not([alt=''])") || el.querySelector("svg title");
    if (el.matches("input, select, textarea")) {
      const type = el.getAttribute("type");
      if (!["submit", "button", "reset", "image"].includes(type) && !(el.labels && el.labels.length) && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby") && !el.getAttribute("title"))
        add("control-no-label", 3, `${label(el)} has no label`);
    } else if (!named && !(el.tagName === "INPUT")) add("control-no-name", 3, `${label(el)} (${size(el)}) has no accessible name`);
  }
  if (under44) add("touch-target", 2, `${under44} control${under44 > 1 ? "s" : ""} smaller than 44px at a ${vw}px-wide viewport`);

  for (const img of shown.filter((el) => el.tagName === "IMG" && !el.hasAttribute("alt"))) add("img-no-alt", 3, label(img));

  // --- headings ---
  const heads = shown.filter((el) => /^H[1-6]$/.test(el.tagName));
  const h1 = heads.filter((h) => h.tagName === "H1").length;
  if (heads.length && h1 !== 1) add("heading-structure", 2, `${h1} <h1> elements; expected one`);
  heads.reduce((prev, h) => {
    const level = +h.tagName[1];
    if (prev && level > prev + 1) add("heading-structure", 2, `${label(h)} jumps from h${prev} to h${level}`);
    return level;
  }, 0);

  const findings = Object.values(found).sort((a, b) => b.severity - a.severity || b.count - a.count);
  return {
    url: location.pathname + location.search,
    viewport: { width: vw, height: document.documentElement.clientHeight },
    colorScheme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    measured: { elements: shown.length, textUnmeasured: unmeasured, controls: controls.length },
    summary: findings.reduce((a, f) => ((a[f.rule] = f.count), a), {}),
    findings,
    notChecked: ["focus indicator visibility and order (tab through the page)", "hover and active states", "text over images or gradients (" + unmeasured + " elements)", "dialogs, menus and other content that is not open now", "meaning carried by color alone", "quality of alt text and labels"],
  };
};
window.__uiPageCheck();
