// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// The framework-independent part of the explore comparison: which draft each instance shows, and the bar
// at the bottom of the page. Plain JavaScript and DOM only. A thin adapter per framework (React, Vue,
// Svelte, Angular) renders a wrapper element, calls attach(), and swaps the component when told to.
//
// Rules it implements:
// - With several instances on the page, the first keeps the current design and the next ones show the
//   drafts in order ("mixed"). With one instance, the page starts on the first draft.
// - ?explore=<key> in the URL forces one draft in every open comparison; ?explore.<Name>=<key> forces it
//   for one component and wins over the general one. The bar sets both.
// - There is one bar however many comparisons are open. Its scope selector says what a click applies to:
//   all of them, or one component.
// - Drafts removed from the bar stay hidden across reloads (localStorage) until the session is cleaned up.
// - With a listener configured, the bar can also remove, request, save and apply drafts, pick elements
//   and ask for drafts in a chosen design language.
import { exploreConfig } from "./explore-config.js";
import { describe, icon, inFrame, ping, signal, startPicking, UI } from "./explore-pick.js";
import { openStylePicker, styleLabel } from "./explore-styles.js";

const { port } = exploreConfig;
const L = { all: "All", differs: "differs", prev: "Previous draft", next: "Next draft", ...exploreConfig.labels };
const FONT = UI.font;
const groups = new Map(); // name -> { keys, slots: Map<el, onChange> }
const ALL = "*";
let scope = ALL; // what the bar acts on: ALL or a component name
let bar = null;
let tweaker = null; // the open fine-tune panel, if any: { name, update(), close() }
let preview = null; // the open narrow view, if any: { width, sync(), close() }
let focus = null; // the open focus view, if any: { name, update(), close() }

const param = (name) => new URLSearchParams(window.location.search).get(name);
const own = (name) => `explore.${name}`;
// Sets the draft for the bar's scope. null clears it (back to the default spread).
function choose(key) {
  const url = new URL(window.location.href);
  const set = (p, v) => (v ? url.searchParams.set(p, v) : url.searchParams.delete(p));
  if (scope === ALL) {
    for (const name of groups.keys()) url.searchParams.delete(own(name));
    set("explore", key);
  } else {
    set(own(scope), key);
  }
  window.history.replaceState(null, "", url);
  refreshAll();
}
const hiddenKey = (name) => `ui-explore-hidden:${name}`;
const hidden = (name) => (window.localStorage.getItem(hiddenKey(name)) ?? "").split(",").filter(Boolean);
function hide(name, key) {
  window.localStorage.setItem(hiddenKey(name), [...new Set([...hidden(name), key])].join(","));
}

function stateOf(name) {
  const g = groups.get(name);
  const gone = hidden(name);
  const order = ["current", ...g.keys.filter((k) => !gone.includes(k))];
  const els = [...document.querySelectorAll(`[data-ui-explore="${name}"]`)].filter((el) => g.slots.has(el));
  const single = els.length < 2;
  const mine = param(own(name));
  const f = mine ?? param("explore");
  const pinned = f && order.includes(f) ? f : null;
  const keyAt = (i) => pinned ?? (single ? order[1] ?? "current" : order[i % order.length]);
  return { name, order, els, single, mixed: !single && !pinned, shown: keyAt(0), keyAt, overridden: !!mine && pinned === mine };
}

// What the bar shows for its scope: the drafts on offer and what is on screen now.
function view() {
  const names = [...groups.keys()];
  if (scope !== ALL && !groups.has(scope)) scope = ALL;
  if (names.length === 1) scope = names[0];
  const targets = (scope === ALL ? names : [scope]).map(stateOf);
  const order = ["current", ...[...new Set(targets.flatMap((s) => s.order.slice(1)))].sort()];
  const mixed = targets.some((s) => s.mixed);
  const keys = [...new Set(targets.map((s) => s.shown))];
  return {
    names,
    targets,
    order,
    mixed,
    spread: targets.some((s) => !s.single), // somewhere there are several instances to spread drafts over
    shown: !mixed && keys.length === 1 ? keys[0] : null, // the one key on screen, if there is one
    differs: !mixed && keys.length > 1,
    overrides: names.filter((n) => stateOf(n).overridden),
  };
}

function refresh(name, tell = true) {
  const g = groups.get(name);
  if (!g) return;
  const s = stateOf(name);
  s.els.forEach((el, i) => {
    const key = s.keyAt(i);
    if (el.dataset.uiExploreVariant !== key) {
      el.dataset.uiExploreVariant = key;
      g.slots.get(el)(key);
    }
    const badge = el.querySelector(":scope > [data-ui-explore-badge]");
    if (badge) {
      // The bar already names the draft when everything shows the same one; the badge is for telling
      // instances apart. On a small element it sits outside, so it never covers what is being judged.
      badge.style.display = tell ? "" : "none";
      // Small element: a smaller badge that rides just above it, inside its own box, so a scrolling
      // container cannot clip it and it does not cover the content.
      const small = el.offsetHeight < 48;
      badge.style.top = small ? "-11px" : "-9px";
      badge.style.left = small ? "0" : "8px";
      badge.style.padding = small ? "0 4px" : "1px 6px";
      badge.style.font = `600 ${small ? "9px/12px" : "11px/16px"} ${UI.mono}`;
      badge.textContent = key === "current" ? L.current : key;
      badge.style.background = key === "current" ? UI.raised : UI.accent;
      badge.style.color = key === "current" ? UI.text : UI.onAccent;
    }
  });
}
let queued = false;
function refreshAll() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    const seen = new Set();
    for (const name of groups.keys()) {
      const s = stateOf(name);
      s.els.forEach((_, i) => seen.add(s.keyAt(i)));
    }
    for (const name of groups.keys()) refresh(name, seen.size > 1);
    tweaker?.update();
    focus?.update();
    preview?.sync();
    // The framework renders a moment after it is told to switch; then lay the fine-tuning over it.
    setTimeout(paintTweaks, 90);
    if (!groups.size) {
      bar?.destroy();
      bar = null;
      return;
    }
    if (!bar && !inFrame) bar = createBar();
    if (bar) {
      // With the dock present the bar sits above it, so nothing overlaps at any width.
      bar.el.style.bottom = document.querySelector("[data-ui-explore-dock]") ? "72px" : "16px";
      bar.el.style.right = preview && window.innerWidth - preview.space >= 520 ? `${preview.space}px` : "0";
      bar.update(view());
    }
  });
}

/**
 * Called by a framework adapter when its wrapper element is in the page.
 * @param name      component name; also the value of data-ui-explore on the wrapper
 * @param el        the wrapper element
 * @param keys      draft keys, e.g. ["A", "B", "C"]
 * @param onChange  called with "current" or a draft key whenever this instance should show another one
 * @returns {{ detach(): void, setKeys(keys: string[]): void }}
 */
export function attach(name, el, keys, onChange) {
  let g = groups.get(name);
  if (!g) groups.set(name, (g = { keys: [...keys], slots: new Map() }));
  g.keys = [...keys];
  el.setAttribute("data-ui-explore", name);
  Object.assign(el.style, { position: "relative", display: "grid", minWidth: "0" });
  if (!inFrame && !el.querySelector(":scope > [data-ui-explore-badge]")) {
    const badge = document.createElement("span");
    badge.setAttribute("data-ui-explore-badge", "");
    Object.assign(badge.style, {
      position: "absolute", top: "-9px", left: "8px", zIndex: "10", padding: "1px 6px", borderRadius: "4px",
      font: `600 11px/16px ${UI.mono}`, pointerEvents: "none", boxShadow: `0 0 0 1px ${UI.line}`,
    });
    el.append(badge);
  }
  g.slots.set(el, onChange);
  refreshAll();
  return {
    setKeys(next) {
      g.keys = [...next];
      refreshAll();
    },
    detach() {
      g.slots.delete(el);
      delete el.dataset.uiExploreVariant;
      if (!g.slots.size) groups.delete(name);
      refreshAll();
    },
  };
}

// ---------- the bar ----------
// Reads left to right as: what you are looking at (scope, drafts) | how to look at it (phone,
// fine-tune, focus) | ask for more | decide (Apply) | everything else (a menu). Drafts are keycaps;
// the arrow keys step through them. Asking for more opens a small form (a note, or a design language)
// so the bar itself stays short. Rare and destructive actions (save, remove, close) live in the menu;
// the one decision that changes the project, Apply, is the only filled button. Picking an element is
// the dock's job when the dock is there.
const css = (el, style) => Object.assign(el.style, style);
function make(tag, style, attrs = {}) {
  const el = document.createElement(tag);
  css(el, style);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}
const BUTTON = { display: "inline-flex", alignItems: "center", gap: "6px", height: "32px", boxSizing: "border-box", border: "0", cursor: "pointer", borderRadius: "8px", font: `600 13px/18px ${FONT}`, padding: "0 12px", whiteSpace: "nowrap", color: UI.text, background: "transparent" };
const HINT = { padding: "0 8px", font: `500 12px/18px ${FONT}`, color: UI.muted };
const DIVIDER = { width: "1px", alignSelf: "stretch", margin: "6px 4px", background: UI.line };

// ---------- narrow view ----------
// The page again, in a frame docked at the right edge at a width the user drags. It is a companion,
// not a dialog: the page stays usable beside it and the frame follows the bar (switching drafts
// switches the frame in place) and shows the fine-tuning. It looks for trouble by itself at every
// width (content wider than the screen, text cut off, controls too small to tap), marks it in the
// frame, and one click hands the list to the agent. An element clicked inside the frame is picked for
// that width.
// The widths this project's own CSS switches at, read from its media queries.
function breakpoints() {
  const found = new Set();
  const read = (rules) => {
    for (const r of rules) {
      if (r.media && r.conditionText) {
        for (const m of r.conditionText.matchAll(/(?:min-width:\s*|width\s*>=\s*)([\d.]+)(px|rem|em)/g)) found.add(Math.round(Number(m[1]) * (m[2] === "px" ? 1 : 16)));
      }
      if (r.cssRules) read(r.cssRules);
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      read(sheet.cssRules);
    } catch {
      // A stylesheet from another origin cannot be read; skip it.
    }
  }
  return [...found].filter((w) => w >= 400 && w <= 1600).sort((x, y) => x - y).slice(0, 5);
}
// Finds what is broken in the framed page at its current width. Read-only.
function scanFrame(doc) {
  const win = doc.defaultView;
  const width = doc.documentElement.clientWidth;
  const style = (el) => win.getComputedStyle(el);
  const scrolls = (el) => {
    for (let n = el.parentElement; n && n !== doc.body; n = n.parentElement) if (style(n).overflowX !== "visible") return true;
    return false;
  };
  const wide = new Set();
  const full = new Set(); // elements whose content is wider than they are, and shows outside them
  const rest = [];
  for (const el of [...doc.body.querySelectorAll("*")].slice(0, 4000)) {
    if (!(el instanceof win.HTMLElement) || el.closest("[data-ui-explore-issue], [data-ui-explore-scope], [data-ui-explore-badge]")) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const cs = style(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    // Wider than the screen, and not inside something that is meant to scroll sideways.
    if ((r.right > width + 1 || r.left < -1) && !scrolls(el)) {
      wide.add(el);
      continue;
    }
    // A control smaller than 24 by 24 CSS pixels (WCAG 2.2, target size). Links inside a sentence are exempt.
    const control = /^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName) || (el.tagName === "A" && el.hasAttribute("href") && cs.display !== "inline") || el.getAttribute("role") === "button";
    if (control && el.type !== "hidden" && (r.width < 24 || r.height < 24)) rest.push({ kind: "tap", el });
    // Text of which more than two fifths is cut away, where nothing says the cut is on purpose
    // (an ellipsis, or the full text in a title).
    else if (r.width > 8 && r.height > 8 && cs.overflowX !== "visible" && cs.textOverflow !== "ellipsis" && !el.title && el.clientWidth > 0 && el.clientWidth < el.scrollWidth * 0.6 && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) rest.push({ kind: "clipped", el });
  }
  for (const el of doc.body.querySelectorAll("*")) {
    if (!(el instanceof win.HTMLElement) || wide.has(el) || el.closest("[data-ui-explore-issue], [data-ui-explore-scope], [data-ui-explore-badge]")) continue;
    if (el.clientWidth > 8 && el.scrollWidth > el.clientWidth + 2 && style(el).overflowX === "visible" && style(el).display !== "inline") full.add(el);
  }
  // Content spilling out of its box: the innermost box it happens in, unless that is only the
  // consequence of something already reported as wider than the screen.
  const spill = [...full].filter((el) => ![...el.children].some((c) => full.has(c)) && ![...wide].some((w) => el.contains(w))).map((el) => ({ kind: "spill", el }));
  rest.unshift(...spill.slice(0, 4));
  // Of nested offenders, the outermost: that is the thing to fix.
  const overflow = [...wide].filter((el) => !wide.has(el.parentElement)).map((el) => ({ kind: "overflow", el }));
  return [...overflow.slice(0, 6), ...rest].slice(0, 8);
}
// Picks an element inside the framed page. Returns a function that calls it off.
function pickInFrame(doc, onPick, onCancel) {
  const mark = doc.createElement("div");
  mark.setAttribute("data-ui-explore-scope", "");
  css(mark, { position: "fixed", zIndex: "2147483100", pointerEvents: "none", border: `2px solid ${UI.accent}`, borderRadius: "6px", background: UI.glow, display: "none" });
  doc.body.append(mark);
  const over = (e) => {
    const r = e.target.getBoundingClientRect();
    css(mark, { display: "block", left: `${r.left - 3}px`, top: `${r.top - 3}px`, width: `${r.width + 6}px`, height: `${r.height + 6}px` });
  };
  const stop = () => {
    mark.remove();
    doc.removeEventListener("mouseover", over, true);
    doc.removeEventListener("click", click, true);
    doc.removeEventListener("keydown", key, true);
    doc.documentElement.style.cursor = "";
  };
  const click = (e) => {
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
  doc.addEventListener("mouseover", over, true);
  doc.addEventListener("click", click, true);
  doc.addEventListener("keydown", key, true);
  doc.documentElement.style.cursor = "crosshair";
  return stop;
}
function togglePreview() {
  if (preview) return preview.close();
  const N = {
    none: L.narrowClean ?? "No overflow, cut text or small targets found",
    overflow: L.narrowOverflow ?? "overflowing",
    spill: L.narrowSpill ?? "not fitting",
    clipped: L.narrowClipped ?? "cut text",
    tap: L.narrowTap ?? "small target",
    fix: L.narrowFix ?? "Fix these",
    drag: L.narrowDrag ?? "Drag to change the width",
    pick: L.narrowPick ?? "Pick an element at this width",
  };
  const COLOR = { overflow: "#ff4d4f", spill: "#ff4d4f", clipped: "#ffb020", tap: "#ff4d4f" };
  // The frame starts on exactly what the page shows now: the address already says which drafts.
  const url = new URL(window.location.href);
  url.searchParams.set("ui-explore-frame", "1");
  const state = { width: 375, issues: [], stopPick: null };
  const marks = [...new Set([320, 375, 768, ...breakpoints()])].sort((x, y) => x - y);
  const panel = make("div", { position: "fixed", top: "12px", right: "12px", bottom: "12px", zIndex: "2147482900", display: "flex", flexDirection: "column", gap: "8px", color: UI.text, font: `500 12px/16px ${FONT}` }, { "data-ui-explore-preview": "" });
  const head = make("div", { display: "grid", gap: "6px", padding: "6px", borderRadius: "12px", background: UI.bg, border: `1px solid ${UI.line}`, boxShadow: UI.shadow });
  const frame = make("iframe", { flex: "1", minHeight: "0", width: "100%", boxSizing: "border-box", border: `8px solid ${UI.bg}`, borderRadius: "24px", background: "#fff", boxShadow: UI.shadow }, { title: "preview", src: url.toString() });
  // The left edge is the handle: drag it to scrub the width.
  const handle = make("div", { position: "absolute", left: "-10px", top: "0", bottom: "0", width: "14px", cursor: "ew-resize", display: "grid", placeItems: "center", touchAction: "none" }, { title: N.drag, "data-ui-explore-action": "narrow-drag" });
  handle.append(make("span", { width: "4px", height: "56px", borderRadius: "2px", background: UI.accent, boxShadow: `0 0 0 2px ${UI.bg}` }));
  panel.append(head, frame, handle);

  const priorMargin = document.body.style.marginRight;
  const fit = () => {
    state.width = Math.round(Math.max(280, Math.min(state.width, window.innerWidth - 40)));
    const outer = state.width + 16;
    panel.style.width = `${outer}px`;
    // Beside the page when there is room for both; otherwise over its right edge.
    const beside = window.innerWidth - outer - 24 >= 520;
    document.body.style.marginRight = beside ? `${outer + 24}px` : priorMargin;
    preview.space = outer + 24;
  };
  const chip = (text, on, attrs, onClick) => {
    const c = make("button", { height: "24px", padding: "0 7px", border: "0", borderRadius: "6px", cursor: "pointer", flex: "none", font: `600 11px/16px ${UI.mono}`, background: on ? UI.accent : "transparent", color: on ? UI.onAccent : UI.muted }, { type: "button", ...attrs });
    c.textContent = text;
    c.addEventListener("click", onClick);
    return c;
  };
  const tool = (label, name, on, action, onClick) => {
    const x = make("button", { ...BUTTON, width: "28px", height: "28px", padding: "0", justifyContent: "center", flex: "none", ...(on ? { background: UI.accent, color: UI.onAccent } : { color: UI.muted }) }, { type: "button", title: label, "aria-label": label, "data-ui-explore-action": action });
    x.append(icon(name));
    x.addEventListener("click", onClick);
    return x;
  };
  function paintHead() {
    head.replaceChildren();
    const top = make("div", { display: "flex", alignItems: "center", gap: "4px", minWidth: "0" });
    const now = make("span", { flex: "none", padding: "0 6px", font: `700 12px/16px ${UI.mono}`, color: UI.text }, { "data-ui-explore-width": "now" });
    now.textContent = `${state.width}px`;
    const ruler = make("div", { display: "flex", gap: "2px", padding: "2px", borderRadius: "8px", background: UI.raised, overflowX: "auto", flex: "1", minWidth: "0" }, { role: "group" });
    for (const w of marks) {
      if (w > window.innerWidth - 40) continue;
      ruler.append(chip(String(w), state.width === w, { "data-ui-explore-width": String(w) }, () => setWidth(w)));
    }
    top.append(now, ruler);
    if (bar?.ready()) {
      top.append(tool(state.stopPick ? L.picking : N.pick, "target", !!state.stopPick, "narrow-pick", () => {
        if (state.stopPick) {
          state.stopPick();
          state.stopPick = null;
          return paintHead();
        }
        const doc = frame.contentDocument;
        if (!doc) return;
        clearMarks();
        state.stopPick = pickInFrame(
          doc,
          (picked) => {
            state.stopPick = null;
            bar.ask({ action: "pick", picked, viewport: state.width, responsive: true });
            scan();
          },
          () => {
            state.stopPick = null;
            scan();
          }
        );
        paintHead();
      }));
    }
    top.append(tool(L.close, "close", false, "narrow-close", shut));
    head.append(top);

    const count = (kind) => state.issues.filter((i) => i.kind === kind).length;
    const parts = ["overflow", "spill", "clipped", "tap"].filter(count).map((k) => `${count(k)} ${N[k]}`);
    const row = make("div", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", padding: "0 4px 2px", minHeight: "28px" }, { "data-ui-explore-issues": String(state.issues.length) });
    const dot = make("span", { width: "7px", height: "7px", borderRadius: "50%", flex: "none", background: parts.length ? COLOR.overflow : UI.accent }, { "aria-hidden": "true" });
    const says = make("span", { flex: "1", minWidth: "0", color: parts.length ? UI.text : UI.muted });
    says.textContent = parts.length ? parts.join(" · ") : N.none;
    row.append(dot, says);
    if (bar?.ready()) {
      if (parts.length) {
        const fix = make("button", { ...BUTTON, height: "28px", padding: "0 10px", background: UI.accent, color: UI.onAccent, font: `700 12px/16px ${FONT}` }, { type: "button", "data-ui-explore-action": "narrow-fix" });
        fix.append(icon("check"), N.fix);
        fix.addEventListener("click", () => bar.ask({ action: "more", fix: true, issues: state.issues.map(({ kind, el }) => ({ kind, ...describe(el) })) }));
        row.append(fix);
      } else {
        const only = make("button", { ...BUTTON, height: "28px", padding: "0 10px", background: UI.raised, font: `600 12px/16px ${FONT}` }, { type: "button", "data-ui-explore-action": "for-width", title: L.forWidthHint ?? "The wider layout stays as it is" });
        only.append(icon("plus"), L.forWidth ?? "Variations for this width");
        only.addEventListener("click", () => bar.ask({ action: "more", responsive: true }));
        row.append(only);
      }
    }
    head.append(row);
  }
  const clearMarks = () => frame.contentDocument?.querySelector("[data-ui-explore-issue]")?.remove();
  function scan() {
    const doc = frame.contentDocument;
    if (!doc?.body || state.stopPick) return;
    clearMarks();
    state.issues = scanFrame(doc);
    if (state.issues.length) {
      // Mark each one where it is, clipped to the page so the marks add no width of their own.
      const root = doc.documentElement;
      const layer = doc.createElement("div");
      layer.setAttribute("data-ui-explore-issue", "");
      css(layer, { position: "absolute", left: "0", top: "0", width: `${root.clientWidth}px`, height: `${root.scrollHeight}px`, overflow: "hidden", pointerEvents: "none", zIndex: "2147483000" });
      const win = doc.defaultView;
      state.issues.forEach(({ kind, el }, i) => {
        const r = el.getBoundingClientRect();
        const m = doc.createElement("div");
        css(m, { position: "absolute", boxSizing: "border-box", left: `${r.left + win.scrollX}px`, top: `${r.top + win.scrollY}px`, width: `${r.width}px`, height: `${r.height}px`, border: `2px ${kind === "clipped" ? "dashed" : "solid"} ${COLOR[kind]}`, borderRadius: "6px", background: "rgb(255 77 79 / 0.08)" });
        const tag = doc.createElement("span");
        css(tag, { position: "absolute", left: "2px", top: "2px", padding: "0 5px", borderRadius: "4px", background: COLOR[kind], color: "#fff", font: "700 10px/14px system-ui, sans-serif" });
        tag.textContent = String(i + 1);
        m.append(tag);
        layer.append(m);
      });
      doc.body.append(layer);
    }
    paintHead();
  }
  let pending = null;
  const rescan = () => {
    clearTimeout(pending);
    pending = setTimeout(scan, 350);
  };
  function setWidth(w) {
    state.width = w;
    fit();
    paintHead();
    rescan();
    refreshAll();
  }
  handle.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    const from = { x: e.clientX, w: state.width };
    frame.style.pointerEvents = "none";
    clearMarks();
    const move = (ev) => {
      state.width = from.w + (from.x - ev.clientX);
      fit();
      head.querySelector('[data-ui-explore-width="now"]').textContent = `${state.width}px`;
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
      frame.style.pointerEvents = "";
      setWidth(state.width);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  });
  frame.addEventListener("load", () => {
    state.stopPick = null;
    rescan();
  });
  const onResize = () => setWidth(state.width);
  window.addEventListener("resize", onResize);
  const shut = () => {
    clearTimeout(pending);
    state.stopPick?.();
    window.removeEventListener("resize", onResize);
    document.body.style.marginRight = priorMargin;
    panel.remove();
    preview = null;
    refreshAll();
  };
  preview = {
    space: 0,
    get width() {
      return state.width;
    },
    close: shut,
    // Tell the frame which drafts to show now; it switches in place. Then look again for trouble.
    sync() {
      frame.contentWindow?.postMessage({ uiExplore: "show", search: window.location.search }, window.location.origin);
      paintHead();
      rescan();
    },
  };
  document.body.append(panel);
  fit();
  paintHead();
  refreshAll();
}
// Inside the frame: follow what the page around it says, and repaint when the fine-tuning changes.
if (inFrame) {
  window.addEventListener("message", (e) => {
    if (e.source !== window.parent || e.origin !== window.location.origin || e.data?.uiExplore !== "show") return;
    const url = new URL(window.location.href);
    url.search = String(e.data.search ?? "");
    url.searchParams.set("ui-explore-frame", "1");
    window.history.replaceState(null, "", url);
    refreshAll();
  });
}
if (typeof window !== "undefined") {
  // Fine-tuning is kept per tab; another document of this tab (the frame, or the page) changed it.
  window.addEventListener("storage", (e) => e.key?.startsWith("ui-explore-tweak:") && paintTweaks());
}

// ---------- fine-tuning ----------
// Small adjustments to the draft on screen (typeface, text size, weight, corners, padding) made in the
// browser alone: nothing is sent while the user plays with them. They are inline styles laid over what
// the draft rendered, kept per component and draft for this tab, and they travel with Apply, Save and
// New variations so the agent can write them into the code once.
// only: null for every instance of the component, or the index of the one instance it is for.
const NEUTRAL = { font: "", size: 1, weight: 0, radius: 1, pad: 1, only: null };
const LOOKS = ["font", "size", "weight", "radius", "pad"];
const tweakId = (name, key) => `ui-explore-tweak:${name}:${key}`;
function tweakOf(name, key) {
  try {
    return { ...NEUTRAL, ...JSON.parse(window.sessionStorage.getItem(tweakId(name, key)) ?? "{}") };
  } catch {
    return { ...NEUTRAL };
  }
}
const isNeutral = (t) => LOOKS.every((k) => t[k] === NEUTRAL[k]);
function setTweak(name, key, t) {
  try {
    if (isNeutral(t)) window.sessionStorage.removeItem(tweakId(name, key));
    else window.sessionStorage.setItem(tweakId(name, key), JSON.stringify(t));
  } catch {
    // Storage is off: nothing to keep, and nothing to paint from.
  }
  paintTweaks();
  focus?.reshoot();
}
const withTweak = (o) => {
  const t = o.key ? tweakOf(o.component, o.key) : NEUTRAL;
  return isNeutral(t) ? o : { ...o, tweaks: t };
};
const TWEAKED = ["font-family", "font-size", "font-weight", "border-radius", "padding"];
const touched = new WeakMap(); // wrapper element -> Map<node, inline values it had before>
function paintTweak(el, t) {
  const before = touched.get(el);
  if (before) {
    for (const [node, prior] of before) for (const p of TWEAKED) prior[p] ? node.style.setProperty(p, prior[p]) : node.style.removeProperty(p);
    touched.delete(el);
  }
  if (isNeutral(t)) return;
  const nodes = [...el.querySelectorAll("*")].filter((n) => n instanceof HTMLElement && !n.hasAttribute("data-ui-explore-badge"));
  // Read everything first, then write, so one node's change does not skew the next one's numbers.
  const plan = nodes.map((node) => {
    const cs = getComputedStyle(node);
    const px = (v) => (/px$/.test(v) ? parseFloat(v) : NaN);
    const box = node.getBoundingClientRect();
    const radii = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map(px);
    const pads = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(px);
    // A pill or a circle stays one: scaling its radius would change nothing or break it.
    const round = radii.some((r) => r >= Math.min(box.width, box.height) / 2 - 0.5);
    return {
      node,
      size: px(cs.fontSize),
      weight: Number(cs.fontWeight) || 400,
      radii: radii.every((r) => r >= 0) && radii.some((r) => r > 0) && !round ? radii : null,
      pads: pads.every((p) => p >= 0) && pads.some((p) => p > 0) ? pads : null,
    };
  });
  const map = new Map();
  for (const { node, size, weight, radii, pads } of plan) {
    map.set(node, Object.fromEntries(TWEAKED.map((p) => [p, node.style.getPropertyValue(p)])));
    if (t.font) node.style.setProperty("font-family", t.font, "important");
    if (t.size !== 1 && size) node.style.setProperty("font-size", `${(size * t.size).toFixed(2)}px`, "important");
    if (t.weight) node.style.setProperty("font-weight", String(Math.max(100, Math.min(900, weight + t.weight))), "important");
    if (t.radius !== 1 && radii) node.style.setProperty("border-radius", radii.map((r) => `${(r * t.radius).toFixed(1)}px`).join(" "), "important");
    if (t.pad !== 1 && pads) node.style.setProperty("padding", pads.map((p) => `${(p * t.pad).toFixed(1)}px`).join(" "), "important");
  }
  touched.set(el, map);
}
function paintTweaks() {
  for (const name of groups.keys()) {
    stateOf(name).els.forEach((el, i) => {
      const t = tweakOf(name, el.dataset.uiExploreVariant ?? "current");
      const mine = t.only == null || t.only === i ? t : NEUTRAL;
      if (!isNeutral(mine) || touched.has(el)) paintTweak(el, mine);
    });
  }
}
function flash(el) {
  const was = [el.style.outline, el.style.outlineOffset];
  css(el, { outline: `2px solid ${UI.accent}`, outlineOffset: "3px" });
  setTimeout(() => css(el, { outline: was[0], outlineOffset: was[1] }), 1200);
}
// System font stacks by character, each falling back to something every machine has. No font is
// downloaded: these only name typefaces that may already be installed.
const STACKS = [
  ["System UI", "system-ui, sans-serif"],
  ["Neo-grotesque", "Inter, Roboto, 'Helvetica Neue', 'Arial Nova', 'Nimbus Sans', Arial, sans-serif"],
  ["Humanist", "Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', source-sans-pro, sans-serif"],
  ["Geometric", "Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif"],
  ["Classical humanist", "Optima, Candara, 'Noto Sans', source-sans-pro, sans-serif"],
  ["Industrial", "Bahnschrift, 'DIN Alternate', 'Franklin Gothic Medium', 'Nimbus Sans Narrow', sans-serif-condensed, sans-serif"],
  ["Rounded", "ui-rounded, 'Hiragino Maru Gothic ProN', Quicksand, Comfortaa, Manjari, 'Arial Rounded MT Bold', Calibri, source-sans-pro, sans-serif"],
  ["Transitional serif", "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif"],
  ["Old-style serif", "'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', P052, serif"],
  ["Didone serif", "Didot, 'Bodoni MT', 'Noto Serif Display', 'URW Palladio L', P052, Sylfaen, serif"],
  ["Slab serif", "Rockwell, 'Rockwell Nova', 'Roboto Slab', 'DejaVu Serif', 'Sitka Small', serif"],
  ["Antique serif", "Superclarendon, 'Bookman Old Style', 'URW Bookman', 'Georgia Pro', Georgia, serif"],
  ["Monospace, code", "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace"],
  ["Monospace, slab", "'Nimbus Mono PS', 'Courier New', monospace"],
  ["Handwritten", "'Segoe Print', 'Bradley Hand', Chilanka, casual, cursive"],
];
// Typefaces the project itself brings: what the element and the page use, the font tokens in :root,
// and the web fonts the page has loaded.
function projectFonts(el) {
  const seen = new Map();
  const bare = (s) => s.trim().replace(/^["']|["']$/g, "");
  const add = (label, stack) => label && stack && !seen.has(label) && seen.set(label, stack);
  for (const n of [el, document.body]) {
    const stack = getComputedStyle(n).fontFamily;
    add(bare(stack.split(",")[0]), stack);
  }
  const rootStyle = getComputedStyle(document.documentElement);
  for (const v of ["--font-sans", "--font-serif", "--font-mono", "--font-display", "--font-heading", "--font-body"]) {
    const stack = rootStyle.getPropertyValue(v).trim();
    if (stack) add(`${bare(stack.split(",")[0])} (${v.slice(7)})`, stack);
  }
  try {
    for (const f of document.fonts) add(bare(f.family), `"${bare(f.family)}", system-ui, sans-serif`);
  } catch {
    // No font loading API: the rest is enough.
  }
  return seen;
}
function openTweak(name) {
  tweaker?.close();
  const T = {
    title: L.tweak ?? "Fine-tune",
    font: L.tweakFont ?? "Typeface",
    asIs: L.tweakAsIs ?? "As designed",
    inProject: L.tweakInProject ?? "In this project",
    onSystem: L.tweakOnSystem ?? "System typefaces",
    size: L.tweakSize ?? "Text size",
    weight: L.tweakWeight ?? "Weight",
    radius: L.tweakRadius ?? "Corners",
    pad: L.tweakPad ?? "Padding",
    where: L.tweakWhere ?? "Applies to",
    all: L.tweakAll ?? "All",
    one: L.tweakOne ?? "Only one",
    prevOne: L.tweakPrev ?? "Previous one",
    nextOne: L.tweakNext ?? "Next one",
    reset: L.tweakReset ?? "Reset",
    hint: L.tweakHint ?? "Free to play with. Written into the code when you apply.",
  };
  const box = make("div", { width: "292px", boxSizing: "border-box", padding: "12px", borderRadius: "12px", display: "grid", gap: "10px", flex: "none", background: UI.bg, border: `1px solid ${UI.line}`, boxShadow: UI.shadow, color: UI.text, font: `500 13px/18px ${FONT}` }, { "data-ui-explore-tweak": name });
  // In the focus view the panel is one of its columns, next to what it changes; otherwise it floats
  // in the corner above the bar.
  const place = () => {
    if (focus?.name === name) {
      css(box, { position: "static", right: "", bottom: "", zIndex: "" });
      if (box.parentElement !== focus.back) focus.back.append(box);
    } else {
      css(box, { position: "fixed", right: "16px", bottom: "132px", zIndex: "2147483050" });
      if (box.parentElement !== document.body) document.body.append(box);
    }
  };
  place();
  let shownKey = null;
  const shut = () => {
    box.remove();
    document.removeEventListener("keydown", onEscape, true);
    if (tweaker?.box === box) tweaker = null;
    refreshAll();
  };
  const onEscape = (e) => e.key === "Escape" && !document.querySelector("[data-ui-explore-focus]") && shut();
  document.addEventListener("keydown", onEscape, true);
  const seg = (on) => ({ height: "26px", padding: "0 10px", whiteSpace: "nowrap", border: "0", borderRadius: "6px", cursor: "pointer", font: `600 12px/16px ${FONT}`, background: on ? UI.accent : "transparent", color: on ? UI.onAccent : UI.muted });

  function fill() {
    const s = stateOf(name);
    const key = (shownKey = s.shown);
    const t = tweakOf(name, key);
    const put = (patch) => setTweak(name, key, Object.assign(t, patch));
    box.replaceChildren();
    const head = make("div", { display: "flex", alignItems: "center", gap: "8px" });
    const title = make("span", { font: `700 13px/18px ${FONT}`, flex: "none" });
    title.textContent = T.title;
    const what = make("span", { flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", font: `500 11px/16px ${UI.mono}`, color: UI.muted });
    what.textContent = `${name} · ${key === "current" ? L.current : key}`;
    const x = make("button", { ...BUTTON, width: "26px", height: "26px", padding: "0", justifyContent: "center", color: UI.muted }, { type: "button", "aria-label": L.close, title: L.close });
    x.append(icon("close"));
    x.addEventListener("click", shut);
    head.append(title, what, x);
    box.append(head);

    const row = (label, control, value) => {
      const r = make("label", { display: "grid", gridTemplateColumns: "84px 1fr 44px", alignItems: "center", gap: "8px", color: UI.muted });
      const l = make("span", {});
      l.textContent = label;
      r.append(l, control);
      if (value) r.append(value);
      else control.style.gridColumn = "2 / 4";
      return r;
    };

    // Several instances on the page: all of them, or one the user steps to.
    if (s.els.length > 1) {
      const n = s.els.length;
      const group = make("div", { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", minWidth: "0" }, { role: "group", "aria-label": T.where });
      const both = make("div", { display: "inline-flex", gap: "3px", padding: "3px", borderRadius: "9px", background: UI.raised }, { role: "group", "aria-label": T.where });
      const mode = (label, on, value, field) => {
        const b = make("button", seg(on), { type: "button", "aria-pressed": String(on), "data-ui-explore-tweak-field": field });
        b.textContent = label;
        b.addEventListener("click", () => {
          put({ only: value });
          if (value != null) flash(s.els[value]);
          fill();
        });
        both.append(b);
      };
      mode(`${T.all} (${n})`, t.only == null, null, "all");
      mode(T.one, t.only != null, Math.min(t.only ?? 0, n - 1), "one");
      group.append(both);
      if (t.only != null) {
        const step = (label, d) => {
          const b = make("button", { ...BUTTON, width: "22px", height: "26px", padding: "0", justifyContent: "center", color: UI.muted }, { type: "button", "aria-label": label });
          b.textContent = d < 0 ? "‹" : "›";
          b.addEventListener("click", () => {
            const next = (t.only + d + n) % n;
            put({ only: next });
            flash(s.els[next]);
            fill();
          });
          return b;
        };
        const at = make("span", { font: `600 11px/16px ${UI.mono}`, color: UI.text });
        at.textContent = `${t.only + 1}/${n}`;
        const stepper = make("span", { display: "inline-flex", alignItems: "center", gap: "2px" });
        stepper.append(step(T.prevOne, -1), at, step(T.nextOne, 1));
        group.append(stepper);
      }
      box.append(group);
    }

    const pick = make("select", { height: "28px", minWidth: "0", padding: "0 6px", borderRadius: "6px", border: `1px solid ${UI.line}`, background: UI.raised, color: UI.text, font: `500 12px/18px ${FONT}` }, { "data-ui-explore-tweak-field": "font" });
    const option = (into, value, text) => {
      const o = make("option", value ? { fontFamily: value } : {}, { value });
      o.textContent = text;
      o.selected = t.font === value;
      into.append(o);
    };
    const groupOf = (label) => {
      const g = make("optgroup", {}, { label });
      pick.append(g);
      return g;
    };
    option(pick, "", T.asIs);
    const mine = groupOf(T.inProject);
    for (const [label, stack] of projectFonts(s.els[0])) option(mine, stack, label);
    const system = groupOf(T.onSystem);
    for (const [label, stack] of STACKS) option(system, stack, label);
    pick.addEventListener("change", () => put({ font: pick.value }));
    box.append(row(T.font, pick));

    const range = (field, label, min, max, step, value, show, read) => {
      const input = make("input", { width: "100%", minWidth: "0", margin: "0", accentColor: UI.accent }, { type: "range", min, max, step, value, "data-ui-explore-tweak-field": field });
      const out = make("span", { font: `600 11px/16px ${UI.mono}`, color: UI.text, textAlign: "right" });
      out.textContent = show(value);
      input.addEventListener("input", () => {
        const v = Number(input.value);
        out.textContent = show(v);
        put({ [field]: read(v) });
      });
      box.append(row(label, input, out));
    };
    const pct = (v) => `${v}%`;
    range("size", T.size, 80, 140, 5, Math.round(t.size * 100), pct, (v) => v / 100);
    range("weight", T.weight, -200, 300, 100, t.weight, (v) => (v > 0 ? `+${v}` : String(v)), (v) => v);
    range("radius", T.radius, 0, 200, 10, Math.round(t.radius * 100), pct, (v) => v / 100);
    range("pad", T.pad, 60, 160, 5, Math.round(t.pad * 100), pct, (v) => v / 100);

    const foot = make("div", { display: "flex", alignItems: "center", gap: "8px" });
    const hint = make("span", { flex: "1", font: `400 11px/15px ${FONT}`, color: UI.muted });
    hint.textContent = T.hint;
    const reset = make("button", { ...BUTTON, height: "28px", padding: "0 10px", background: UI.raised, font: `600 12px/16px ${FONT}` }, { type: "button", "data-ui-explore-tweak-field": "reset" });
    reset.textContent = T.reset;
    reset.addEventListener("click", () => {
      setTweak(name, key, { ...NEUTRAL });
      fill();
      refreshAll();
    });
    foot.append(hint, reset);
    box.append(foot);
  }
  tweaker = {
    name,
    box,
    close: shut,
    place,
    update() {
      if (!groups.has(name)) return shut();
      const s = stateOf(name);
      if (s.mixed) return shut();
      place();
      if (s.shown !== shownKey) fill();
    },
  };
  fill();
  refreshAll();
}

// ---------- focus view ----------
// The element alone, enlarged, on a dark backdrop, with its current design and every draft listed beside
// it. Made for small things (a label, a cell, a card) whose differences are hard to judge inside a
// full page. The copies are snapshots of what each draft renders: they look right but do not react.
// Choosing one chooses it on the page too.
const settle = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 60))));
/** The element a focus view would show, or null when the scope is not one small element. */
function focusable(v) {
  if (v.targets.length !== 1) return null;
  const el = v.targets[0].els[0];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.width < window.innerWidth * 0.7 && r.height < window.innerHeight * 0.6 ? el : null;
}
// A copy keeps its classes, but not what it inherited from the page around it; take that along.
function inherited(el) {
  const cs = getComputedStyle(el.parentElement ?? el);
  let bg = "";
  for (let n = el; n && n.nodeType === 1 && !bg; n = n.parentElement) {
    const c = getComputedStyle(n).backgroundColor;
    if (c && c !== "transparent" && !/,\s*0\)$/.test(c)) bg = c;
  }
  return {
    text: { color: cs.color, fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, textAlign: cs.textAlign, fontVariantNumeric: cs.fontVariantNumeric },
    bg: bg || "#fff",
  };
}
async function openFocus(name) {
  focus?.close();
  const g = groups.get(name);
  const s = g && stateOf(name);
  const at = s ? Math.min(tweakOf(name, s.shown).only ?? 0, s.els.length - 1) : 0;
  const el = s?.els[at];
  if (!el) return;
  const slot = g.slots.get(el);
  const from = inherited(el);
  const back = make("div", { position: "fixed", inset: "0", zIndex: "2147482500", display: "flex", alignItems: "center", justifyContent: "center", gap: "36px", padding: "72px 24px 150px", boxSizing: "border-box", background: "rgb(8 8 10 / 0.94)", color: UI.text, font: `500 13px/18px ${FONT}` }, { "data-ui-explore-focus": name });
  const close = make("button", { ...BUTTON, position: "absolute", top: "16px", right: "16px", background: UI.bg, border: `1px solid ${UI.line}` }, { type: "button" });
  close.textContent = L.close;
  back.append(close);
  document.body.append(back);

  const snap = () => {
    const r = el.getBoundingClientRect();
    const node = el.cloneNode(true);
    node.removeAttribute("data-ui-explore");
    css(node, { outline: "", outlineOffset: "" });
    for (const n of node.querySelectorAll("[data-ui-explore-badge]")) n.remove();
    for (const n of node.querySelectorAll("[data-ui-explore]")) n.removeAttribute("data-ui-explore");
    for (const n of node.querySelectorAll("[id]")) n.removeAttribute("id");
    return { node, w: r.width, h: r.height };
  };
  // One snapshot per draft: show it on the real element, copy what it rendered, then put things back.
  const was = el.dataset.uiExploreVariant;
  const shots = [];
  for (const key of s.order) {
    slot(key);
    await settle();
    const t = tweakOf(name, key);
    paintTweak(el, t.only == null || t.only === at ? t : NEUTRAL); // the snapshot shows the fine-tuning too
    shots.push({ key, ...snap() });
  }
  slot(was);
  setTimeout(paintTweaks, 90);
  if (!back.isConnected) return; // closed while the snapshots were being taken

  const copy = (shot, scale) => {
    const node = shot.node.cloneNode(true);
    node.inert = true;
    css(node, { width: `${shot.w}px`, height: `${shot.h}px`, transform: `scale(${scale})`, transformOrigin: "0 0", pointerEvents: "none" });
    const hold = make("div", { width: `${shot.w * scale}px`, height: `${shot.h * scale}px`, ...from.text });
    hold.append(node);
    return hold;
  };
  const stage = make("div", { borderRadius: "18px", padding: "22px", background: from.bg, boxShadow: UI.shadow, flex: "none" }, { "data-ui-explore-focus-stage": "" });
  const list = make("div", { display: "flex", flexDirection: "column", gap: "14px", maxHeight: "100%", overflowY: "auto", padding: "4px", flex: "none" }, { role: "listbox" });
  const cards = shots.map((shot) => {
    const row = make("button", { display: "flex", alignItems: "center", gap: "12px", padding: "0", border: "0", background: "transparent", color: "inherit", cursor: "pointer", textAlign: "left" }, { type: "button", role: "option", "data-ui-explore-focus-key": shot.key });
    const card = make("div", { borderRadius: "12px", padding: "10px", background: from.bg });
    const small = () => card.replaceChildren(copy(shot, Math.min(1, 240 / shot.w, 110 / shot.h)));
    small();
    const cap = make("span", { minWidth: "26px", height: "26px", padding: "0 7px", boxSizing: "border-box", display: "inline-grid", placeItems: "center", borderRadius: "6px", font: `700 12px/16px ${UI.mono}` });
    cap.textContent = shot.key === "current" ? L.current : shot.key;
    row.append(card, cap);
    row.addEventListener("click", () => choose(shot.key));
    list.append(row);
    return { key: shot.key, card, cap, row, small };
  });
  back.append(stage, list);

  const shut = () => {
    document.removeEventListener("keydown", onEscape, true);
    const mine = focus?.back === back;
    if (mine) focus = null;
    if (mine) tweaker?.place(); // the panel was a column of this view: move it out before the view goes
    back.remove();
    refreshAll();
  };
  const onEscape = (e) => e.key === "Escape" && shut();
  document.addEventListener("keydown", onEscape, true);
  close.addEventListener("click", shut);
  back.addEventListener("click", (e) => e.target === back && shut());

  focus = {
    name,
    back,
    close: shut,
    // The fine-tuning of the draft on screen changed: copy it again, so the view shows it as it is now.
    reshoot() {
      const shot = shots.find((x) => x.key === el.dataset.uiExploreVariant);
      if (!shot || !el.isConnected) return;
      Object.assign(shot, snap());
      cards.find((c) => c.key === shot.key)?.small();
      this.update();
    },
    update() {
      if (!groups.has(name)) return shut();
      const now = stateOf(name).shown;
      const shot = shots.find((x) => x.key === now) ?? shots[0];
      // With the fine-tune panel as a third column, the stage gives up some of its width.
      const room = tweaker?.name === name ? 0.32 : 0.5;
      const scale = Math.min(2.5, (window.innerWidth * room) / shot.w, (window.innerHeight * 0.5) / shot.h);
      stage.replaceChildren(copy(shot, scale));
      for (const c of cards) {
        const on = c.key === shot.key;
        c.card.style.outline = on ? `3px solid ${UI.accent}` : `1px solid ${UI.line}`;
        c.card.style.outlineOffset = on ? "3px" : "0";
        css(c.cap, { background: on ? UI.accent : UI.raised, color: on ? UI.onAccent : UI.text });
        c.row.setAttribute("aria-selected", String(on));
      }
    },
  };
  focus.update();
  tweaker?.place();
  refreshAll();
}

const typing = () => {
  const a = document.activeElement;
  return !!a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
};

function createBar() {
  const el = make("div", {
    position: "fixed", left: "0", right: "0", bottom: "16px", margin: "0 auto", width: "fit-content", zIndex: "2147483000", maxWidth: "calc(100vw - 24px)", boxSizing: "border-box",
    display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "4px", padding: "6px", borderRadius: "12px",
    background: UI.bg, border: `1px solid ${UI.line}`, boxShadow: UI.shadow, color: UI.text,
  }, { "data-ui-explore-bar": "", role: "toolbar" });
  document.body.append(el);

  // live: the listener server answers. listening: the agent is waiting for a click right now.
  const ui = { live: false, listening: false, armed: false, closing: false, sent: false, note: "", stopPick: null, last: null };
  let armTimer = null;
  const disarm = () => {
    clearTimeout(armTimer);
    ui.armed = false;
  };
  // Every signal says what it is about: the components in scope and the draft each one shows.
  const about = (v) => v.targets.map((s) => ({ component: s.name, key: s.mixed ? null : s.shown }));
  const send = (body) => {
    const v = ui.last;
    // What the user fine-tuned on a draft goes along, so the agent can write it into the code.
    const targets = (body.targets ?? about(v)).map(withTweak);
    if (preview && (body.action === "more" || body.action === "style") && !body.viewport) body = { ...body, viewport: preview.width };
    return signal({ component: v.targets[0].name, ...body, targets })
      .then((ok) => {
        ui.sent = ok;
        // Applied or closed: the fine-tuning has been handed over or dropped, so stop painting it.
        if (ok && (body.action === "apply" || body.action === "cancel")) {
          for (const x of targets) {
            const g = groups.get(x.component);
            for (const k of ["current", ...(g?.keys ?? [])]) if (body.action === "cancel" || k !== x.key) window.sessionStorage.removeItem(tweakId(x.component, k));
          }
        }
        if (ok) ui.listening = false; // the click was handed to the agent; it is busy until it waits again
        render();
      })
      .catch(() => {
        ui.live = false;
        render();
      });
  };

  // ---- popovers: the "ask for more" form and the menu ----
  let pop = null; // { kind, el }
  const closePop = () => {
    if (!pop) return;
    pop.el.remove();
    pop = null;
    ui.closing = false;
    document.removeEventListener("pointerdown", outsidePop, true);
    document.removeEventListener("keydown", escapePop, true);
  };
  const outsidePop = (e) => {
    if (!pop || pop.el.contains(e.target) || el.contains(e.target)) return;
    closePop();
    render();
  };
  const escapePop = (e) => {
    if (e.key !== "Escape") return;
    closePop();
    render();
  };
  const decide = (v) => {
    // Only what shows a draft can be saved, removed or applied; with several, each keeps its own key.
    const chosen = v.mixed ? [] : v.targets.filter((s) => s.shown !== "current");
    return { chosen, label: [...new Set(chosen.map((s) => s.shown))].join("+"), picks: chosen.map((s) => ({ component: s.name, key: s.shown })) };
  };
  const pickNow = () => {
    ui.stopPick = startPicking(
      (picked) => {
        ui.stopPick = null;
        send({ action: "pick", picked });
      },
      () => {
        ui.stopPick = null;
        render();
      }
    );
    render();
  };
  function fillAsk(box) {
    const form = make("form", { display: "grid", gap: "8px", margin: "0", padding: "6px", width: "300px", boxSizing: "border-box" });
    const input = make("input", { height: "34px", padding: "0 10px", boxSizing: "border-box", width: "100%", borderRadius: "8px", border: `1px solid ${UI.line}`, background: UI.raised, color: UI.text, font: `400 13px/18px ${FONT}` }, { "data-ui-explore-action": "note", "aria-label": L.note, placeholder: L.note, maxlength: "200" });
    input.value = ui.note;
    input.addEventListener("input", () => (ui.note = input.value));
    const row = make("div", { display: "flex", justifyContent: "space-between", gap: "8px" });
    const style = button(styleLabel, { background: UI.raised }, { "data-ui-explore-action": "style" }, () => {
      closePop();
      render();
      openStylePicker({ onChoose: ({ styles, note }) => send({ action: "style", styles, note }) });
    }, "style");
    const go = make("button", { ...BUTTON, background: UI.accent, color: UI.onAccent }, { type: "submit", "data-ui-explore-action": "generate" });
    go.append(icon("plus"), L.styleGo ?? L.more);
    row.append(style, go);
    form.append(input, row);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      closePop();
      send({ action: "more", note: ui.note });
    });
    box.append(form);
    setTimeout(() => input.focus(), 0);
  }
  function fillMenu(box) {
    const v = ui.last;
    const { chosen, label, picks } = decide(v);
    const item = (text, iconName, onClick, { danger = false, action } = {}) => {
      const b = make("button", { display: "flex", alignItems: "center", gap: "10px", width: "100%", minHeight: "36px", padding: "0 10px", border: "0", borderRadius: "8px", background: "transparent", color: danger ? UI.danger : UI.text, font: `500 13px/18px ${FONT}`, textAlign: "left", cursor: "pointer", whiteSpace: "nowrap" }, { type: "button", role: "menuitem", "data-ui-explore-action": action });
      b.append(icon(iconName), text);
      b.addEventListener("pointerenter", () => (b.style.background = UI.raised));
      b.addEventListener("pointerleave", () => (b.style.background = "transparent"));
      b.addEventListener("click", onClick);
      return b;
    };
    const rows = [];
    if (chosen.length) {
      rows.push(item(`${L.save} ${label}`, "save", () => {
        closePop();
        send({ action: "save", key: chosen[0].shown, targets: picks });
      }, { action: "save" }));
      rows.push(item(`${L.remove} ${label}`, "trash", () => {
        closePop();
        for (const s of chosen) {
          signal({ component: s.name, action: "remove", key: s.shown }).catch(() => (ui.live = false));
          hide(s.name, s.shown);
        }
        choose(null);
      }, { action: "remove", danger: true }));
    }
    // The dock already has the picker; without a dock it lives here.
    if (!document.querySelector("[data-ui-explore-dock]")) {
      rows.push(item(L.pick, "target", () => {
        closePop();
        pickNow();
      }, { action: "pick" }));
    }
    if (rows.length) rows.push(make("div", { height: "1px", margin: "4px 2px", background: UI.line }));
    const what = v.targets.map((s) => s.name).join(", ");
    rows.push(item(ui.closing ? L.closeConfirm ?? "Click again to close" : `${L.closeCompare ?? "Close comparison"}: ${what}`, "close", () => {
      if (!ui.closing) {
        ui.closing = true;
        box.replaceChildren();
        return fillMenu(box);
      }
      closePop();
      send({ action: "cancel" });
    }, { action: "close", danger: ui.closing }));
    box.append(...rows);
  }
  function togglePop(kind, anchor) {
    const same = pop?.kind === kind;
    closePop();
    if (same) return render();
    const r = anchor.getBoundingClientRect();
    const box = make("div", { position: "fixed", zIndex: "2147483100", bottom: `${window.innerHeight - r.top + 12}px`, minWidth: "220px", padding: "6px", boxSizing: "border-box", borderRadius: "12px", background: UI.bg, border: `1px solid ${UI.line}`, boxShadow: UI.shadow, color: UI.text }, { "data-ui-explore-menu": kind, role: kind === "menu" ? "menu" : "dialog" });
    document.body.append(box);
    pop = { kind, el: box };
    if (kind === "ask") fillAsk(box);
    else fillMenu(box);
    const w = box.offsetWidth;
    box.style.left = `${Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2))}px`;
    document.addEventListener("pointerdown", outsidePop, true);
    document.addEventListener("keydown", escapePop, true);
    render();
  }

  function button(label, style, attrs, onClick, iconName) {
    const b = make("button", { ...BUTTON, ...style }, { type: "button", ...attrs });
    if (iconName) b.append(icon(iconName));
    if (label) b.append(label);
    b.addEventListener("click", onClick);
    return b;
  }
  // An action shown as an icon alone: its name is the tooltip and the accessible name.
  const iconButton = (label, iconName, style, attrs, onClick) =>
    button("", { width: "32px", padding: "0", justifyContent: "center", color: UI.muted, ...style }, { title: label, "aria-label": label, ...attrs }, onClick, iconName);

  function render() {
    const v = ui.last;
    if (!v) return;
    const focused = el.contains(document.activeElement) ? document.activeElement.getAttribute("data-ui-explore-action") : null;
    el.replaceChildren();
    el.setAttribute("data-ui-explore-bar", scope === ALL ? "all" : scope);

    // ---- what you are looking at ----
    const state = !port ? null : !ui.live ? "off" : ui.listening ? "on" : ui.sent ? "busy" : "idle";
    const lead = make("span", { display: "inline-flex", alignItems: "center", gap: "7px", padding: "0 4px 0 6px", font: `600 12px/18px ${UI.mono}`, color: UI.text });
    if (state) lead.append(make("span", { width: "7px", height: "7px", borderRadius: "50%", flex: "none", background: state === "on" ? UI.accent : state === "busy" ? UI.warn : UI.muted, boxShadow: state === "on" ? `0 0 0 3px ${UI.glow}` : "none" }, { "aria-hidden": "true" }));
    if (v.names.length > 1) {
      // Several comparisons are open: one bar, and this says what a click applies to.
      const pickScope = make("select", { height: "28px", maxWidth: "190px", padding: "0 6px", borderRadius: "6px", border: `1px solid ${UI.line}`, background: UI.raised, color: UI.text, font: `600 12px/18px ${UI.mono}`, cursor: "pointer" }, { "data-ui-explore-action": "scope", "aria-label": L.all });
      const option = (value, text) => {
        const o = make("option", {}, { value });
        o.textContent = text;
        o.selected = scope === value;
        pickScope.append(o);
      };
      option(ALL, `${L.all} (${v.names.length})`);
      // A dot marks a component that was set apart from the rest.
      for (const n of v.names) option(n, v.overrides.includes(n) ? `${n} •` : n);
      pickScope.addEventListener("change", () => {
        scope = pickScope.value;
        disarm();
        refreshAll();
      });
      lead.append(pickScope);
    } else {
      lead.append(v.names[0]);
    }
    el.append(lead);

    const keys = make("div", { display: "inline-flex", alignItems: "center", gap: "3px", padding: "3px", borderRadius: "9px", background: UI.raised }, { role: "group" });
    const cap = (label, on, attrs, onClick) =>
      button(label, {
        height: "26px", minWidth: "28px", padding: "0 8px", justifyContent: "center", borderRadius: "6px", font: `600 12px/16px ${UI.mono}`,
        background: on ? UI.accent : "transparent", color: on ? UI.onAccent : UI.muted,
      }, { "aria-pressed": String(on), ...attrs }, onClick);
    if (v.spread) keys.append(cap(L.mixed, v.mixed, {}, () => choose(null)));
    for (const k of v.order) keys.append(cap(k === "current" ? L.current : k, v.shown === k, { "data-ui-explore-key": k }, () => choose(k)));
    el.append(keys);
    if (v.differs) {
      // In "all" scope the components show different drafts: say which, since no keycap can be lit.
      const d = make("span", { ...HINT, padding: "0 4px", font: `500 11px/16px ${UI.mono}`, color: UI.warn }, { "data-ui-explore-differs": "" });
      d.textContent = v.targets.map((s) => (s.shown === "current" ? L.current : s.shown)).join("+");
      el.append(d);
    }
    // ---- how to look at it ----
    const lit = { background: UI.accent, color: UI.onAccent };
    const tools = make("div", { display: "inline-flex", alignItems: "center", gap: "2px" }, { role: "group" });
    const previewing = !!preview;
    tools.append(iconButton(L.mobile, "phone", previewing ? lit : {}, { "data-ui-explore-action": "preview", "aria-pressed": String(previewing) }, () => togglePreview()));
    // Fine-tune: for one component showing one design.
    if (v.targets.length === 1 && !v.mixed) {
      const one = v.targets[0];
      const open = tweaker?.name === one.name;
      const changed = !isNeutral(tweakOf(one.name, one.shown));
      tools.append(iconButton(L.tweak ?? "Fine-tune", "sliders", open ? lit : changed ? { color: UI.accent } : {}, { "data-ui-explore-action": "tweak", "aria-pressed": String(open) }, () => (open ? tweaker.close() : openTweak(one.name))));
    }
    // Focus: only where it helps, for one element small enough to enlarge.
    const isFocus = focus && v.targets.length === 1 && focus.name === v.targets[0].name;
    if (isFocus || focusable(v)) {
      tools.append(iconButton(L.focus ?? "Focus view", "focus", isFocus ? lit : {}, { "data-ui-explore-action": "focus", "aria-pressed": String(!!isFocus) }, () => (isFocus ? focus.close() : openFocus(v.targets[0].name))));
    }
    el.append(make("span", DIVIDER), tools);
    const refocus = () => focused && el.querySelector(`[data-ui-explore-action="${focused}"]`)?.focus();
    if (!port) return refocus();
    el.append(make("span", DIVIDER));
    if (!ui.live || !ui.listening) {
      // Server down: buttons are off. Server up but the agent is not waiting: it is handling a click
      // (ours, if we just sent one) or no session is attached.
      const working = ui.live && ui.sent;
      const t = make("span", { ...HINT, color: working ? UI.warn : UI.muted });
      t.textContent = !ui.live ? L.offline : working ? L.sent : L.busy;
      el.append(t);
      closePop();
      return refocus();
    }
    if (ui.stopPick) {
      // Picking: the bar says so, and one click on it calls it off.
      el.append(button(L.picking, lit, { "data-ui-explore-action": "pick" }, () => {
        ui.stopPick();
        ui.stopPick = null;
        render();
      }, "target"));
      return refocus();
    }

    // ---- ask for more ----
    const asking = pop?.kind === "ask";
    el.append(button(L.more, asking ? { background: UI.raised } : {}, { "data-ui-explore-action": "more", "aria-expanded": String(asking) }, (e) => togglePop("ask", e.currentTarget), "plus"));

    // ---- decide ----
    const { chosen, label, picks } = decide(v);
    if (chosen.length) {
      el.append(button(ui.armed ? L.confirm : `${L.apply} ${label}`, { background: ui.armed ? UI.warn : UI.accent, color: UI.onAccent }, { "data-ui-explore-action": "apply" }, () => {
        if (ui.armed) return send({ action: "apply", key: chosen[0].shown, targets: picks });
        // The second click must come within a few seconds and on the same drafts.
        ui.armed = true;
        armTimer = setTimeout(() => {
          ui.armed = false;
          render();
        }, 4000);
        render();
      }, ui.armed ? null : "check"));
    }

    // ---- everything else ----
    const menuOpen = pop?.kind === "menu";
    el.append(iconButton(L.menu ?? "More", "menu", { color: UI.text, ...(menuOpen ? { background: UI.raised } : {}) }, { "data-ui-explore-action": "menu", "aria-haspopup": "menu", "aria-expanded": String(menuOpen) }, (e) => togglePop("menu", e.currentTarget)));
    refocus();
  }

  // Arrow keys step through the drafts of the bar's scope, unless the user is typing.
  const onKey = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || typing()) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (document.querySelector("[data-ui-explore-styles], [data-ui-explore-scope]")) return;
    const v = view();
    if (v.order.length < 2) return;
    const i = v.shown ? v.order.indexOf(v.shown) : -1;
    const n = v.order.length;
    e.preventDefault();
    choose(v.order[e.key === "ArrowRight" ? (i + 1) % n : (i - 1 + n) % n]);
  };
  document.addEventListener("keydown", onKey);

  const check = () =>
    ping().then(({ up, listening }) => {
      const changed = up !== ui.live || listening !== ui.listening;
      // The agent waiting again means the last request was handled.
      if (listening && !ui.listening) ui.sent = false;
      ui.live = up;
      ui.listening = listening;
      if (changed) render();
    });
  const timer = port ? setInterval(check, 4000) : null;
  if (port) check();

  // For the tool's other views (the narrow view asks for drafts through the bar).
  const ready = () => ui.live && ui.listening;
  const ask = (body) => (ready() ? send({ note: ui.note, ...body }) : Promise.resolve());
  const signature = (v) => `${scope}|${v.targets.map((s) => `${s.name}:${s.mixed ? "~" : s.shown}`).join(",")}`;
  return {
    el,
    ready,
    ask,
    update(v) {
      if (ui.last && signature(ui.last) !== signature(v)) disarm();
      ui.last = v;
      render();
    },
    destroy() {
      clearInterval(timer);
      clearTimeout(armTimer);
      document.removeEventListener("keydown", onKey);
      ui.stopPick?.();
      focus?.close();
      tweaker?.close();
      preview?.close();
      closePop();
      el.remove();
    },
  };
}
