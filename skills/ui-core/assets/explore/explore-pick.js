// Shared by the explore bar and the dock: lets the user click an element and reports what it is.
// Plain JavaScript, no framework. In a development build it names the component that rendered the
// element on React, Vue 3, Svelte 5 and Angular; otherwise it reports only the tag, text and classes.
import { exploreConfig } from "./explore-config.js";

const { port, token } = exploreConfig;
const OWN = "[data-ui-explore-bar], [data-ui-explore-preview], [data-ui-explore-dock]";
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

// Starts pick mode. Returns a function that cancels it.
export function startPicking(onPick, onCancel) {
  let last = null;
  const paint = (el, on) => {
    if (!el) return;
    el.style.outline = on ? "2px solid #e11d48" : "";
    el.style.outlineOffset = on ? "2px" : "";
  };
  const own = (el) => !!el.closest?.(OWN);
  const over = (e) => {
    paint(last, false);
    last = own(e.target) ? null : e.target;
    paint(last, true);
  };
  const stop = () => {
    paint(last, false);
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
    onPick(describe(e.target));
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
  return stop;
}
