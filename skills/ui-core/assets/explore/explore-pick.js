// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// Shared by the explore bar and the dock: lets the user click an element and reports what it is.
// Plain JavaScript, no framework. In a development build it names the component that rendered the
// element on React, Vue 3, Svelte 5 and Angular; otherwise it reports only the tag, text and classes.
import { exploreConfig } from "./explore-config.js";

const { port, token } = exploreConfig;
const OWN = "[data-ui-explore-bar], [data-ui-explore-preview], [data-ui-explore-dock], [data-ui-explore-scope], [data-ui-explore-styles], [data-ui-explore-menu], [data-ui-explore-focus], [data-ui-explore-tweak]";

// One look for everything the tool draws on the page, so it reads as an instrument laid over the app and
// not as part of it: near-black panels, hairline edges, small radii, one accent color, mono for names.
// The colors are CSS variables, so the user can change the tool's theme while it is on screen.
export const UI = {
  bg: "var(--uix-bg)", raised: "var(--uix-raised)", line: "var(--uix-line)", text: "var(--uix-text)", muted: "var(--uix-muted)",
  accent: "var(--uix-accent)", onAccent: "var(--uix-onAccent)", warn: "var(--uix-warn)", danger: "var(--uix-danger)",
  font: "system-ui, sans-serif", mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  shadow: "var(--uix-shadow)",
  glow: "color-mix(in srgb, var(--uix-accent) 22%, transparent)",
};
// In the light theme the accent is a dark shade with white text on it, so it also works as text and as a dot.
const THEMES = {
  dark: { bg: "#0c0c0e", raised: "#1a1a1e", line: "#2e2e34", text: "#ececf1", muted: "#9a9aa5", onAccent: "#0c0c0e", warn: "#ffc53d", danger: "#ff7a7a", shadow: "0 10px 30px rgb(0 0 0 / 0.35), 0 0 0 1px rgb(255 255 255 / 0.04)" },
  light: { bg: "#ffffff", raised: "#f0f0f3", line: "#d4d4dc", text: "#18181b", muted: "#5d5d68", onAccent: "#ffffff", warn: "#b45309", danger: "#c81e1e", shadow: "0 10px 30px rgb(0 0 0 / 0.16), 0 0 0 1px rgb(0 0 0 / 0.06)" },
};
export const ACCENTS = {
  lime: { dark: "#c8f031", light: "#4d7c0f" },
  sky: { dark: "#5cc8ff", light: "#0369a1" },
  violet: { dark: "#b79cff", light: "#6d28d9" },
  orange: { dark: "#ffa24a", light: "#c2410c" },
};
/** Who made the tool; shown at the foot of its Settings. Part of the copyright notice the license asks to keep. */
export const CREDIT = { name: "ui-creator", author: "Murtaza Mehdi Yucal", url: "https://github.com/murtazayucal/ui-creator" };
const PREFS_KEY = "ui-explore-prefs";
const valid = (p) => ({ theme: THEMES[p?.theme] ? p.theme : "dark", accent: ACCENTS[p?.accent] ? p.accent : "lime" });
/** The user's own settings for the tool (theme, accent). Kept in this browser only. */
export function getPrefs() {
  try {
    return valid(JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}"));
  } catch {
    return valid({});
  }
}
function paint(p) {
  if (typeof document === "undefined") return;
  let s = document.querySelector("style[data-ui-explore-theme]");
  if (!s) {
    s = document.createElement("style");
    s.setAttribute("data-ui-explore-theme", "");
    document.head.append(s);
  }
  const t = { ...THEMES[p.theme], accent: ACCENTS[p.accent][p.theme] };
  s.textContent = `:root{${Object.entries(t).map(([k, v]) => `--uix-${k}:${v}`).join(";")}}`;
}
export function setPrefs(next) {
  const p = valid({ ...getPrefs(), ...next });
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    // Private mode: the choice holds until the page reloads.
  }
  paint(p);
  return p;
}
paint(getPrefs());
const ICONS = {
  phone: "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M11 18h2",
  save: "M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z",
  trash: "M5 7h14 M10 7V4h4v3 M7 7l1 13h8l1-13",
  target: "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6z",
  style: "M12 3l2.2 5.3L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.7z",
  library: "M5 4v16 M10 4v16 M14 5l5 15",
  check: "M5 12l5 5 9-10",
  plus: "M12 5v14 M5 12h14",
  close: "M6 6l12 12 M18 6L6 18",
  focus: "M4 9V5h4 M20 9V5h-4 M4 15v4h4 M20 15v4h-4 M10 10h4v4h-4z",
  menu: "M5 11.2v1.6 M12 11.2v1.6 M19 11.2v1.6",
  page: "M4 5h16v14H4z M4 9h16",
  sliders: "M4 7h10 M18 7h2 M4 17h4 M12 17h8 M16 5v4 M10 15v4",
  back: "M15 6l-6 6 6 6",
};
/** A 16px line icon as an <svg> element. */
export function icon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [k, v] of Object.entries({ viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" })) svg.setAttribute(k, v);
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", ICONS[name] ?? "");
  svg.append(path);
  svg.style.flex = "none";
  return svg;
}
const T = {
  scopeTitle: "Inside this element",
  scopeHint: "Click a part on the page or below to leave it out",
  scopeGo: "Continue",
  scopeCancel: "Cancel",
  scopeOut: "left out",
  ...exploreConfig.labels,
};
// The comparison's own wrappers are skipped so the component underneath is reported.
const HELPERS = new Set(["ExploreSlot", "ExploreSlotLegacy", "ExploreSlotInner", "ExploreSlotComponent", "ExploreDock"]);

export const inFrame = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("ui-explore-frame");

export const signal = (body) =>
  fetch(`http://127.0.0.1:${port}/signal`, { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ token, ...body }) }).then((r) => r.ok);

// { up: the listener server answers, listening: the agent is waiting for a click right now }
const DOWN = { up: false, listening: false };
export const ping = () =>
  port
    ? fetch(`http://127.0.0.1:${port}/ping?token=${token}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => (j?.ok ? { up: true, listening: !!j.listening } : DOWN))
        .catch(() => DOWN)
    : Promise.resolve(DOWN);

const baseName = (file) => String(file ?? "").split(/[\\/]/).pop().replace(/\.(current\.)?(vue|svelte|jsx?|tsx?)$/, "");
const clean = (name) => String(name ?? "").replace(/Current(Component)?$/, "$1").replace(/^_+/, "");

// A draft lives in "<Name>.drafts/<key>.<ext>": report it as the component it is a draft of.
const draftOf = (file) => (String(file ?? "").match(/([^\\/]+)\.drafts[\\/][^\\/]+$/) || [])[1] || null;

// ---- one function per framework: element -> { name, id, file } of the nearest component, or null ----
function reactOwner(el) {
  const k = Object.keys(el).find((x) => x.startsWith("__reactFiber$") || x.startsWith("__reactInternalInstance$"));
  for (let f = k ? el[k] : null; f; f = f.return) {
    const t = f.type;
    if (!t || typeof t === "string") continue;
    const fn = typeof t === "function" ? t : t.render || t.type || null;
    const name = t.displayName || (fn && (fn.displayName || fn.name)) || null;
    if (name && name.length > 1 && !HELPERS.has(name)) return { name: clean(name), id: t, file: null };
  }
  return null;
}
function vueOwner(el) {
  for (let i = el.__vueParentComponent; i; i = i.parent) {
    const t = i.type;
    const name = draftOf(t?.__file) || t?.__name || t?.name || baseName(t?.__file);
    if (name && !HELPERS.has(name) && !/\.current$/.test(name)) return { name: clean(name), id: t, file: t.__file ?? null };
    // A ".current" file is the component being explored: report it under its real name.
    if (name && /\.current$/.test(name)) return { name: name.replace(/\.current$/, ""), id: t, file: t.__file ?? null };
  }
  return null;
}
function svelteOwner(el) {
  const file = el.__svelte_meta?.loc?.file;
  if (!file) return null;
  const name = draftOf(file) || baseName(file);
  return HELPERS.has(name) ? null : { name, id: file, file };
}
// Vue 2 marks only the root element of a component, with the outermost instance that renders there.
function vue2Root(el) {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) if (n.__vue__) return n.__vue__;
  return null;
}
function vue2Owner(el) {
  for (let vm = vue2Root(el); vm; vm = vm.$parent) {
    const o = vm.$options || {};
    const file = o.__file ?? null;
    const name = draftOf(file) || o.name || o._componentTag || baseName(file);
    if (!name || HELPERS.has(name)) continue;
    return { name: clean(name.replace(/\.current$/, "")), id: vm.constructor, file };
  }
  return null;
}
function angularOwner(el) {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    // Skip the comparison's own layers: the slot, the draft being shown and the moved original.
    if (!n.tagName.includes("-") || n.tagName === "UI-EXPLORE-SLOT" || /-(DRAFT-[A-Z]|CURRENT)$/.test(n.tagName)) continue;
    const cls = window.ng?.getComponent?.(n)?.constructor?.name;
    // Fall back to the selector: "app-product-card" -> "ProductCard".
    const fromTag = n.tagName.toLowerCase().replace(/^app-/, "").replace(/-current$/, "").replace(/-draft-[a-z]$/, "").replace(/(^|-)(\w)/g, (_, _d, c) => c.toUpperCase());
    return { name: clean(cls) || fromTag, id: n.tagName, file: null, tag: n.tagName.toLowerCase() };
  }
  return null;
}

function ownerOf(el) {
  if (!el || el.nodeType !== 1) return null;
  if (Object.keys(el).some((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"))) return { framework: "react", ...(reactOwner(el) ?? {}) };
  if (el.__vueParentComponent) return { framework: "vue", ...(vueOwner(el) ?? {}) };
  if (el.__svelte_meta) return { framework: "svelte", ...(svelteOwner(el) ?? {}) };
  if (vue2Root(el)) return { framework: "vue", ...(vue2Owner(el) ?? {}) };
  const ng = angularOwner(el);
  if (ng && (window.ng || document.querySelector("[ng-version]"))) return { framework: "angular", ...ng };
  return null;
}

export function describe(el) {
  const o = ownerOf(el);
  let instances = null;
  if (o?.id) {
    if (o.framework === "angular") {
      instances = document.querySelectorAll(o.tag).length;
    } else {
      // Count the outermost elements of each instance: same component, parent belongs to another one.
      const same = (n) => n && ownerOf(n)?.id === o.id;
      instances = [...document.querySelectorAll("body *")].slice(0, 6000).filter((n) => same(n) && !same(n.parentElement)).length;
    }
  }
  return {
    framework: o?.framework ?? null,
    component: o?.name ?? null,
    file: o?.file ?? null,
    instances,
    tag: el.tagName.toLowerCase(),
    text: (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80),
    classes: (typeof el.className === "string" ? el.className : "").slice(0, 160),
  };
}
// For checking the picker by hand from the browser console.
if (typeof window !== "undefined") window.__uiExploreDescribe = describe;

// Components rendered inside `el` other than the one that owns it: [{ name, file, els }], els being the
// outermost element of each instance. This is what the user can leave out of a restyle.
function partsOf(el) {
  const self = ownerOf(el)?.id ?? null;
  const groups = new Map();
  for (const n of [...el.querySelectorAll("*")].slice(0, 4000)) {
    if (n.closest(OWN) || n.hasAttribute("data-ui-explore-badge")) continue;
    const o = ownerOf(n);
    if (!o?.id || !o.name || o.id === self) continue;
    const parent = n.parentElement && ownerOf(n.parentElement);
    if (parent?.id === o.id) continue; // not the outermost element of this instance
    // A wrapper element the comparison adds belongs to no instance of its own.
    if (n.hasAttribute("data-ui-explore")) continue;
    // Icons and other small presentational helpers are not worth a decision.
    const r = n.getBoundingClientRect();
    if (r.width < 48 || r.height < 48) continue;
    const key = o.framework === "angular" ? o.tag : o.name;
    if (!groups.has(key)) groups.set(key, { name: o.name, file: o.file ?? null, els: [] });
    groups.get(key).els.push(n);
  }
  return [...groups.values()].slice(0, 8);
}

function box(style, attrs = {}) {
  const d = document.createElement("div");
  Object.assign(d.style, style);
  for (const [k, v] of Object.entries(attrs)) d.setAttribute(k, v);
  return d;
}

// After a click on an element that contains other components: the user says which of them the restyle
// may touch, by clicking them on the page itself or in the panel. Calls done(parts) or cancel().
function chooseParts(el, parts, done, cancel) {
  const state = parts.map(() => true);
  const layer = box({ position: "fixed", inset: "0", zIndex: "2147483100", pointerEvents: "none" }, { "data-ui-explore-scope": "" });
  const frame = box({ position: "fixed", border: `2px solid ${UI.accent}`, borderRadius: "6px", pointerEvents: "none" });
  layer.append(frame);
  const veils = parts.flatMap((p, i) =>
    p.els.map((target) => {
      const v = document.createElement("button");
      v.type = "button";
      Object.assign(v.style, { position: "fixed", padding: "0", margin: "0", border: "0", borderRadius: "6px", cursor: "pointer", pointerEvents: "auto", background: "transparent", font: `600 11px/16px ${UI.mono}`, textAlign: "left" });
      const tag = box({ position: "absolute", left: "6px", top: "6px", display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 7px", borderRadius: "4px", whiteSpace: "nowrap" });
      v.append(tag);
      v.addEventListener("click", () => toggle(i));
      layer.append(v);
      return { i, target, v, tag };
    })
  );

  const panel = box({ position: "fixed", left: "0", right: "0", bottom: "16px", margin: "0 auto", width: "fit-content", maxWidth: "calc(100vw - 24px)", boxSizing: "border-box", display: "grid", gap: "10px", padding: "12px 14px", borderRadius: "12px", pointerEvents: "auto", background: UI.bg, color: UI.text, border: `1px solid ${UI.line}`, boxShadow: UI.shadow, font: `400 13px/18px ${UI.font}` }, { role: "dialog", "aria-label": T.scopeTitle });
  const head = box({ display: "grid", gap: "1px" });
  const title = box({ font: `600 13px/18px ${UI.font}` });
  title.textContent = T.scopeTitle;
  const hint = box({ color: UI.muted, font: `400 12px/16px ${UI.font}` });
  hint.textContent = T.scopeHint;
  head.append(title, hint);
  const row = box({ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" });
  const chips = parts.map((p, i) => {
    const c = document.createElement("button");
    c.type = "button";
    c.setAttribute("role", "switch");
    Object.assign(c.style, { display: "inline-flex", alignItems: "center", gap: "6px", height: "30px", padding: "0 10px", borderRadius: "8px", cursor: "pointer", font: `600 12px/16px ${UI.mono}`, whiteSpace: "nowrap" });
    c.addEventListener("click", () => toggle(i));
    row.append(c);
    return c;
  });
  const spacer = box({ flex: "1 1 12px" });
  const mk = (label, primary, fn) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    Object.assign(b.style, { height: "30px", padding: "0 14px", borderRadius: "8px", cursor: "pointer", font: `600 13px/18px ${UI.font}`, whiteSpace: "nowrap", border: primary ? "0" : `1px solid ${UI.line}`, background: primary ? UI.accent : "transparent", color: primary ? UI.onAccent : UI.text });
    b.addEventListener("click", fn);
    return b;
  };
  const go = mk(T.scopeGo, true, () => finish(true));
  const top = box({ display: "flex", alignItems: "center", gap: "8px" });
  top.append(head, spacer, mk(T.scopeCancel, false, () => finish(false)), go);
  panel.append(top, row);
  layer.append(panel);
  // The bar and dock would sit under the panel: put them away until the choice is made.
  const chrome = [...document.querySelectorAll("[data-ui-explore-bar], [data-ui-explore-dock]")];
  for (const c of chrome) c.style.visibility = "hidden";

  function place() {
    const r = el.getBoundingClientRect();
    Object.assign(frame.style, { left: `${r.left - 4}px`, top: `${r.top - 4}px`, width: `${r.width + 8}px`, height: `${r.height + 8}px` });
    for (const { target, v } of veils) {
      const b = target.getBoundingClientRect();
      Object.assign(v.style, { left: `${b.left}px`, top: `${b.top}px`, width: `${b.width}px`, height: `${b.height}px` });
    }
  }
  function paint() {
    for (const { i, v, tag } of veils) {
      const on = state[i];
      v.style.outline = on ? `2px solid ${UI.accent}` : `2px dashed ${UI.muted}`;
      v.style.outlineOffset = "-2px";
      // Left out: a striped veil, so it is obvious at a glance which parts stay as they are.
      v.style.background = on ? "transparent" : "repeating-linear-gradient(135deg, rgb(12 12 14 / 0.55) 0 8px, rgb(12 12 14 / 0.35) 8px 16px)";
      v.setAttribute("aria-pressed", String(on));
      v.setAttribute("aria-label", `${parts[i].name}${on ? "" : ` (${T.scopeOut})`}`);
      tag.replaceChildren(...(on ? [icon("check")] : []), document.createTextNode(on ? parts[i].name : `${parts[i].name} · ${T.scopeOut}`));
      Object.assign(tag.style, { background: on ? UI.accent : UI.bg, color: on ? UI.onAccent : UI.muted });
    }
    chips.forEach((c, i) => {
      const on = state[i];
      const n = parts[i].els.length;
      c.setAttribute("aria-checked", String(on));
      c.replaceChildren(...(on ? [icon("check")] : []), document.createTextNode(`${parts[i].name}${n > 1 ? ` ×${n}` : ""}`));
      Object.assign(c.style, { border: `1px solid ${on ? UI.accent : UI.line}`, background: on ? UI.accent : "transparent", color: on ? UI.onAccent : UI.muted, textDecoration: on ? "none" : "line-through" });
    });
  }
  function toggle(i) {
    state[i] = !state[i];
    paint();
  }
  function key(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      finish(false);
    }
  }
  function finish(ok) {
    window.removeEventListener("scroll", place, true);
    window.removeEventListener("resize", place);
    document.removeEventListener("keydown", key, true);
    layer.remove();
    for (const c of chrome) c.style.visibility = "";
    if (ok) done(parts.map((p, i) => ({ component: p.name, file: p.file, instances: p.els.length, include: state[i] })));
    else cancel();
  }
  window.addEventListener("scroll", place, true);
  window.addEventListener("resize", place);
  document.addEventListener("keydown", key, true);
  document.body.append(layer);
  place();
  paint();
  go.focus();
  return () => finish(false);
}

// Starts pick mode. Returns a function that cancels it.
// While the pointer moves, the element under it is framed and named. A click on an element that holds
// other components opens the "what is included" step before onPick is called; the result then carries
// `parts: [{ component, file, instances, include }]`.
export function startPicking(onPick, onCancel) {
  let last = null;
  let closeParts = null;
  const frame = box({ position: "fixed", zIndex: "2147483100", pointerEvents: "none", border: `2px solid ${UI.accent}`, borderRadius: "6px", display: "none" }, { "data-ui-explore-scope": "" });
  const label = box({ position: "absolute", left: "-2px", bottom: "100%", marginBottom: "4px", padding: "2px 7px", borderRadius: "4px", whiteSpace: "nowrap", background: UI.accent, color: UI.onAccent, font: `600 11px/16px ${UI.mono}` });
  frame.append(label);
  document.body.append(frame);
  const show = (el) => {
    if (!el) return void (frame.style.display = "none");
    const r = el.getBoundingClientRect();
    const o = ownerOf(el);
    Object.assign(frame.style, { display: "block", left: `${r.left - 3}px`, top: `${r.top - 3}px`, width: `${r.width + 6}px`, height: `${r.height + 6}px` });
    label.textContent = o?.name ? `${o.name} · ${el.tagName.toLowerCase()}` : el.tagName.toLowerCase();
    // Near the top edge there is no room above: put the name inside the frame.
    Object.assign(label.style, r.top < 28 ? { bottom: "auto", top: "4px", left: "4px", marginBottom: "0" } : { bottom: "100%", top: "auto", left: "-2px", marginBottom: "4px" });
  };
  const own = (el) => !!el.closest?.(OWN);
  const over = (e) => {
    last = own(e.target) ? null : e.target;
    show(last);
  };
  const stop = () => {
    frame.remove();
    document.removeEventListener("mouseover", over, true);
    document.removeEventListener("click", click, true);
    document.removeEventListener("keydown", key, true);
    document.documentElement.style.cursor = "";
  };
  const click = (e) => {
    if (own(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    stop();
    const el = e.target;
    const picked = describe(el);
    const parts = partsOf(el);
    if (!parts.length) return onPick(picked);
    closeParts = chooseParts(el, parts, (chosen) => onPick({ ...picked, parts: chosen }), onCancel);
  };
  const key = (e) => {
    if (e.key !== "Escape") return;
    stop();
    onCancel();
  };
  document.addEventListener("mouseover", over, true);
  document.addEventListener("click", click, true);
  document.addEventListener("keydown", key, true);
  document.documentElement.style.cursor = "crosshair";
  return () => {
    stop();
    closeParts?.();
  };
}
