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
import { icon, inFrame, ping, signal, startPicking, UI } from "./explore-pick.js";
import { openStylePicker, styleLabel } from "./explore-styles.js";

const { port } = exploreConfig;
const L = { all: "All", differs: "differs", prev: "Previous draft", next: "Next draft", ...exploreConfig.labels };
const FONT = UI.font;
const groups = new Map(); // name -> { keys, slots: Map<el, onChange> }
const ALL = "*";
let scope = ALL; // what the bar acts on: ALL or a component name
let bar = null;

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

function refresh(name) {
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
    for (const name of groups.keys()) refresh(name);
    if (!groups.size) {
      bar?.destroy();
      bar = null;
      return;
    }
    if (!bar && !inFrame) bar = createBar();
    if (bar) {
      // With the dock present the bar sits above it, so nothing overlaps at any width.
      bar.el.style.bottom = document.querySelector("[data-ui-explore-dock]") ? "72px" : "16px";
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
// Reads left to right as: what you are looking at (scope, drafts) | how to look at it (phone) |
// ask for more (note, style, pick) | decide (save, remove, apply). Drafts are keycaps: the arrow keys
// step through them. Rare or destructive actions are icons with a name on hover; the one decision
// that changes the project, Apply, is the only filled button.
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

function openPreview() {
  // The frame shows exactly what the page shows now: the address already says which drafts.
  const url = new URL(window.location.href);
  url.searchParams.set("ui-explore-frame", "1");
  const back = make("div", { position: "fixed", inset: "0", zIndex: "2147482000", display: "grid", placeItems: "center", background: "rgb(12 12 14 / 0.7)" }, { "data-ui-explore-preview": "" });
  const box = make("div", { display: "grid", gap: "8px", justifyItems: "end" });
  const close = make("button", { ...BUTTON, background: UI.bg, border: `1px solid ${UI.line}` }, { type: "button" });
  close.textContent = L.close;
  const frame = make("iframe", { boxSizing: "content-box", width: "375px", height: "min(760px, calc(100vh - 150px))", border: `8px solid ${UI.bg}`, borderRadius: "28px", background: "#fff", boxShadow: UI.shadow }, { title: "375px", src: url.toString() });
  box.append(close, frame);
  back.append(box);
  const shut = () => back.remove();
  back.addEventListener("click", (e) => e.target === back && shut());
  close.addEventListener("click", shut);
  document.body.append(back);
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
  const ui = { live: false, listening: false, armed: false, sent: false, note: "", stopPick: null, last: null };
  let armTimer = null;
  const disarm = () => {
    clearTimeout(armTimer);
    ui.armed = false;
  };
  // Every signal says what it is about: the components in scope and the draft each one shows.
  const about = (v) => v.targets.map((s) => ({ component: s.name, key: s.mixed ? null : s.shown }));
  const send = (body) => {
    const v = ui.last;
    return signal({ component: v.targets[0].name, targets: about(v), ...body })
      .then((ok) => {
        ui.sent = ok;
        if (ok) ui.listening = false; // the click was handed to the agent; it is busy until it waits again
        render();
      })
      .catch(() => {
        ui.live = false;
        render();
      });
  };

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
    if (state) lead.append(make("span", { width: "7px", height: "7px", borderRadius: "50%", flex: "none", background: state === "on" ? UI.accent : state === "busy" ? UI.warn : UI.muted, boxShadow: state === "on" ? "0 0 0 3px rgb(200 240 49 / 0.18)" : "none" }, { "aria-hidden": "true" }));
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
    if (v.order.length > 1) {
      const arrows = make("span", { padding: "0 4px", font: `500 11px/16px ${UI.mono}`, color: UI.muted, letterSpacing: "1px" }, { title: `${L.prev} / ${L.next}`, "aria-hidden": "true" });
      arrows.textContent = "←→";
      el.append(arrows);
    }

    // ---- how to look at it ----
    el.append(iconButton(L.mobile, "phone", {}, { "data-ui-explore-action": "preview" }, () => openPreview()));
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
      return refocus();
    }

    // ---- ask for more ----
    const form = make("form", { display: "flex", alignItems: "center", margin: "0", height: "32px", borderRadius: "8px", background: UI.raised, border: `1px solid ${UI.line}` });
    const input = make("input", { width: "150px", height: "30px", padding: "0 10px", border: "0", borderRadius: "8px 0 0 8px", background: "transparent", color: UI.text, font: `400 13px/18px ${FONT}`, outlineOffset: "-2px" }, { "data-ui-explore-action": "note", "aria-label": L.note, placeholder: L.note, maxlength: "200" });
    input.value = ui.note;
    input.addEventListener("input", () => (ui.note = input.value));
    const more = make("button", { ...BUTTON, height: "30px", borderRadius: "0 7px 7px 0", borderLeft: `1px solid ${UI.line}` }, { type: "submit", "data-ui-explore-action": "more" });
    more.append(icon("plus"), L.more);
    form.append(input, more);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      send({ action: "more", note: ui.note });
    });
    el.append(form);
    el.append(button(styleLabel, {}, { "data-ui-explore-action": "style" }, () =>
      openStylePicker({ onChoose: ({ styles, note }) => send({ action: "style", styles, note }) }), "style"
    ));
    el.append(button(ui.stopPick ? L.picking : L.pick, ui.stopPick ? { background: UI.accent, color: UI.onAccent } : {}, { "data-ui-explore-action": "pick" }, () => {
      if (ui.stopPick) {
        ui.stopPick();
        ui.stopPick = null;
        return render();
      }
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
    }, "target"));

    // ---- decide ----
    // Only what shows a draft can be saved, removed or applied; with several, each keeps its own key.
    const chosen = v.mixed ? [] : v.targets.filter((s) => s.shown !== "current");
    if (!chosen.length) return refocus();
    const label = [...new Set(chosen.map((s) => s.shown))].join("+");
    const picks = chosen.map((s) => ({ component: s.name, key: s.shown }));
    el.append(make("span", DIVIDER));
    el.append(iconButton(`${L.save} ${label}`, "save", {}, { "data-ui-explore-action": "save" }, () => send({ action: "save", key: chosen[0].shown, targets: picks })));
    el.append(iconButton(`${L.remove} ${label}`, "trash", { color: UI.danger }, { "data-ui-explore-action": "remove" }, () => {
      for (const s of chosen) {
        signal({ component: s.name, action: "remove", key: s.shown }).catch(() => (ui.live = false));
        hide(s.name, s.shown);
      }
      choose(null);
    }));
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
    refocus();
  }

  // Arrow keys step through the drafts of the bar's scope, unless the user is typing.
  const onKey = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || typing()) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (document.querySelector("[data-ui-explore-styles], [data-ui-explore-preview], [data-ui-explore-scope]")) return;
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

  const signature = (v) => `${scope}|${v.targets.map((s) => `${s.name}:${s.mixed ? "~" : s.shown}`).join(",")}`;
  return {
    el,
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
      el.remove();
    },
  };
}
