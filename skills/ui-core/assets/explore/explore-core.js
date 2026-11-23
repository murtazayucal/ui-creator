// The framework-independent part of the explore comparison: which draft each instance shows, and the bar
// at the bottom of the page. Plain JavaScript and DOM only. A thin adapter per framework (React, Vue,
// Svelte, Angular) renders a wrapper element, calls attach(), and swaps the component when told to.
//
// Rules it implements:
// - With several instances on the page, the first keeps the current design and the next ones show the
//   drafts in order ("mixed"). With one instance, the page starts on the first draft.
// - ?explore=<key> in the URL forces one draft everywhere; the bar sets it.
// - Drafts removed from the bar stay hidden across reloads (localStorage) until the session is cleaned up.
// - With a listener configured, the bar can also remove, request, save and apply drafts and pick elements.
import { exploreConfig } from "./explore-config.js";
import { inFrame, ping, signal, startPicking } from "./explore-pick.js";

const { port, labels: L } = exploreConfig;
const FONT = "system-ui, sans-serif";
const groups = new Map(); // name -> { keys, slots: Map<el, onChange>, bar }

const forced = () => new URLSearchParams(window.location.search).get("explore");
function choose(key) {
  const url = new URL(window.location.href);
  if (key) url.searchParams.set("explore", key);
  else url.searchParams.delete("explore");
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
  const f = forced();
  const pinned = f && order.includes(f) ? f : null;
  const keyAt = (i) => pinned ?? (single ? order[1] ?? "current" : order[i % order.length]);
  return { order, els, single, mixed: !single && !pinned, shown: keyAt(0), keyAt };
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
      badge.style.background = key === "current" ? "#334155" : "#be123c";
    }
  });
  g.bar?.update(s);
}
let queued = false;
function refreshAll() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    for (const name of groups.keys()) refresh(name);
    [...groups.values()].filter((g) => g.bar).forEach((g, i) => (g.bar.el.style.bottom = `${16 + i * 56}px`));
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
  if (!g) groups.set(name, (g = { keys: [...keys], slots: new Map(), bar: null }));
  g.keys = [...keys];
  el.setAttribute("data-ui-explore", name);
  Object.assign(el.style, { position: "relative", display: "grid", minWidth: "0" });
  if (!inFrame && !el.querySelector(":scope > [data-ui-explore-badge]")) {
    const badge = document.createElement("span");
    badge.setAttribute("data-ui-explore-badge", "");
    Object.assign(badge.style, {
      position: "absolute", top: "-10px", left: "8px", zIndex: "10", padding: "1px 8px", borderRadius: "999px",
      font: `600 11px/16px ${FONT}`, color: "#fff", pointerEvents: "none",
    });
    el.append(badge);
  }
  g.slots.set(el, onChange);
  if (!g.bar && !inFrame) g.bar = createBar(name);
  refreshAll();
  return {
    setKeys(next) {
      g.keys = [...next];
      refreshAll();
    },
    detach() {
      g.slots.delete(el);
      delete el.dataset.uiExploreVariant;
      if (!g.slots.size) {
        g.bar?.destroy();
        groups.delete(name);
      }
      refreshAll();
    },
  };
}

// ---------- the bar ----------
const css = (el, style) => Object.assign(el.style, style);
function make(tag, style, attrs = {}) {
  const el = document.createElement(tag);
  css(el, style);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}
const BUTTON = { border: "0", cursor: "pointer", borderRadius: "999px", font: `600 13px/18px ${FONT}`, padding: "6px 14px", whiteSpace: "nowrap", color: "#fff", background: "transparent" };
const HINT = { padding: "0 12px", font: `500 12px/18px ${FONT}`, color: "#94a3b8" };
const DIVIDER = { width: "1px", alignSelf: "stretch", margin: "4px 6px", background: "#334155" };

function openPreview(shown) {
  const url = new URL(window.location.href);
  url.searchParams.set("ui-explore-frame", "1");
  if (shown) url.searchParams.set("explore", shown);
  const back = make("div", { position: "fixed", inset: "0", zIndex: "2147482000", display: "grid", placeItems: "center", background: "rgb(15 23 42 / 0.6)" }, { "data-ui-explore-preview": "" });
  const box = make("div", { display: "grid", gap: "8px", justifyItems: "end" });
  const close = make("button", { ...BUTTON, background: "#0f172a" }, { type: "button" });
  close.textContent = L.close;
  const frame = make("iframe", { boxSizing: "content-box", width: "375px", height: "min(760px, calc(100vh - 150px))", border: "8px solid #0f172a", borderRadius: "28px", background: "#fff" }, { title: "375px", src: url.toString() });
  box.append(close, frame);
  back.append(box);
  const shut = () => back.remove();
  back.addEventListener("click", (e) => e.target === back && shut());
  close.addEventListener("click", shut);
  document.body.append(back);
}

function createBar(name) {
  const el = make("div", {
    position: "fixed", left: "50%", bottom: "16px", transform: "translateX(-50%)", zIndex: "2147483000", maxWidth: "calc(100vw - 24px)",
    display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "2px", padding: "4px", borderRadius: "24px",
    background: "#0f172a", boxShadow: "0 8px 24px rgb(0 0 0 / 0.3)",
  }, { "data-ui-explore-bar": name });
  document.body.append(el);

  const ui = { live: false, armed: false, sent: false, note: "", stopPick: null, last: null };
  let armTimer = null;
  const disarm = () => {
    clearTimeout(armTimer);
    ui.armed = false;
  };
  const send = (body) =>
    signal({ component: name, ...body })
      .then((ok) => {
        ui.sent = ok;
        render();
      })
      .catch(() => {
        ui.live = false;
        render();
      });

  function button(label, style, attrs, onClick) {
    const b = make("button", { ...BUTTON, ...style }, { type: "button", ...attrs });
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  function render() {
    const s = ui.last;
    if (!s) return;
    const focusedNote = document.activeElement?.matches?.("[data-ui-explore-action=note]") && el.contains(document.activeElement);
    el.replaceChildren();
    const title = make("span", HINT);
    title.textContent = name;
    el.append(title);
    if (!s.single) el.append(button(L.mixed, { background: s.mixed ? "#be123c" : "transparent", color: s.mixed ? "#fff" : "#e2e8f0" }, {}, () => choose(null)));
    for (const k of s.order) {
      const on = !s.mixed && s.shown === k;
      el.append(button(k === "current" ? L.current : k, { background: on ? "#be123c" : "transparent", color: on ? "#fff" : "#e2e8f0" }, { "data-ui-explore-key": k }, () => choose(k)));
    }
    el.append(make("span", DIVIDER));
    el.append(button(L.mobile, { background: "#1e293b" }, { "data-ui-explore-action": "preview" }, () => openPreview(s.mixed ? null : s.shown)));
    if (!port) return;
    el.append(make("span", DIVIDER));
    if (ui.sent || !ui.live) {
      const t = make("span", { ...HINT, color: ui.sent ? "#fde68a" : "#94a3b8" });
      t.textContent = ui.sent ? L.sent : L.offline;
      return void el.append(t);
    }
    const isDraft = !s.mixed && s.shown !== "current";
    if (isDraft) {
      el.append(button(`${L.remove} ${s.shown}`, { color: "#fca5a5" }, { "data-ui-explore-action": "remove" }, () => {
        const i = s.order.indexOf(s.shown);
        signal({ component: name, action: "remove", key: s.shown }).catch(() => (ui.live = false));
        hide(name, s.shown);
        choose(s.order[i + 1] ?? s.order[i - 1] ?? "current");
      }));
    }
    const form = make("form", { display: "flex", alignItems: "center", gap: "2px", margin: "0" });
    const input = make("input", { width: "170px", height: "30px", padding: "0 12px", borderRadius: "999px", border: "1px solid #475569", background: "#1e293b", color: "#fff", font: `400 13px/18px ${FONT}`, outline: "none" }, { "data-ui-explore-action": "note", "aria-label": L.note, placeholder: L.note, maxlength: "200" });
    input.value = ui.note;
    input.addEventListener("input", () => (ui.note = input.value));
    const more = make("button", { ...BUTTON, background: "#334155" }, { type: "submit", "data-ui-explore-action": "more" });
    more.textContent = L.more;
    form.append(input, more);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      send({ action: "more", note: ui.note });
    });
    el.append(form);
    if (focusedNote) input.focus();
    el.append(button(ui.stopPick ? L.picking : L.pick, { background: ui.stopPick ? "#e11d48" : "#334155" }, { "data-ui-explore-action": "pick" }, () => {
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
    }));
    if (isDraft) {
      el.append(button(`${L.save} ${s.shown}`, { background: "#334155" }, { "data-ui-explore-action": "save" }, () => send({ action: "save", key: s.shown })));
      el.append(button(ui.armed ? L.confirm : `${L.apply} ${s.shown}`, { background: ui.armed ? "#f59e0b" : "#16a34a", color: ui.armed ? "#0f172a" : "#fff" }, { "data-ui-explore-action": "apply" }, () => {
        if (ui.armed) return send({ action: "apply", key: s.shown });
        // The second click must come within a few seconds and on the same draft.
        ui.armed = true;
        armTimer = setTimeout(() => {
          ui.armed = false;
          render();
        }, 4000);
        render();
      }));
    }
  }

  const check = () =>
    ping().then((ok) => {
      const changed = ok !== ui.live;
      // A listener that is reachable again means the last request was handled.
      if (ok && !ui.live) ui.sent = false;
      ui.live = ok;
      if (changed) render();
    });
  const timer = port ? setInterval(check, 4000) : null;
  if (port) check();

  return {
    el,
    update(s) {
      if (ui.last && ui.last.shown !== s.shown) disarm();
      ui.last = s;
      render();
    },
    destroy() {
      clearInterval(timer);
      clearTimeout(armTimer);
      ui.stopPick?.();
      el.remove();
    },
  };
}
