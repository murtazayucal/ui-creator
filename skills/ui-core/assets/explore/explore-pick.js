// Shared by the explore bar and the dock: lets the user click an element and reports what it is.
// Plain JavaScript, no framework. Component names are read from React's development data when present;
// on other frameworks, or in a production build, only the tag, text and classes are reported.
import { exploreConfig } from "./explore-config.js";

const { port, token } = exploreConfig;
const OWN = "[data-ui-explore-bar], [data-ui-explore-preview], [data-ui-explore-dock]";

export const inFrame = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("ui-explore-frame");

export const signal = (body) =>
  fetch(`http://127.0.0.1:${port}/signal`, { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ token, ...body }) }).then((r) => r.ok);

export const ping = () => (port ? fetch(`http://127.0.0.1:${port}/ping?token=${token}`).then((r) => r.ok).catch(() => false) : Promise.resolve(false));

export function describe(el) {
  const fiberOf = (n) => {
    const k = Object.keys(n).find((x) => x.startsWith("__reactFiber$"));
    return k ? n[k] : null;
  };
  const nameOf = (type) => {
    if (!type || typeof type === "string") return null;
    const fn = typeof type === "function" ? type : type.render || type.type || null;
    const n = type.displayName || (fn && (fn.displayName || fn.name)) || null;
    return n && n.length > 1 ? n : null;
  };
  const skip = new Set(["ExploreSlot", "Bar", "Preview"]);
  const owner = (n) => {
    for (let f = n ? fiberOf(n) : null; f; f = f.return) {
      const name = nameOf(f.type);
      if (name && !skip.has(name)) return { name, type: f.type };
    }
    return null;
  };
  const o = owner(el);
  const instances = o ? [...document.querySelectorAll("body *")].slice(0, 6000).filter((n) => owner(n)?.type === o.type && owner(n.parentElement)?.type !== o.type).length : null;
  return {
    component: o?.name ?? null,
    instances,
    tag: el.tagName.toLowerCase(),
    text: (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80),
    classes: (typeof el.className === "string" ? el.className : "").slice(0, 160),
  };
}

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
