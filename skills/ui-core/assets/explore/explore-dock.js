// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// Temporary "design mode" dock for the explore command: a small floating control in the bottom-left corner
// that is there even when no comparison is open. Import it once from the app's entry file while design mode
// is on, and remove that import afterwards:
//   import "./__explore__/explore-dock.js";
// Plain JavaScript, so it works with any framework. It needs the listener to be running; without it the
// dock says so and does nothing else.
import { exploreConfig } from "./explore-config.js";
import { ACCENTS, clearWork, CREDIT, getPrefs, icon, inFrame, ping, noteWork, setPrefs, signal, startPicking, UI, working } from "./explore-pick.js";
import { openStylePicker, styleLabel } from "./explore-styles.js";

const L = exploreConfig.labels;
// Labels added later fall back to English, so an older copied config file keeps working.
const T = {
  menu: L.menu ?? "More",
  pickPage: L.pickPage ?? "Compare the whole page",
  clearAll: L.clearAll ?? "Close all comparisons",
  clearConfirm: L.clearConfirm ?? "Click again to close all",
  settings: L.settings ?? "Settings",
  theme: L.theme ?? "Theme",
  themeDark: L.themeDark ?? "Dark",
  themeLight: L.themeLight ?? "Light",
  accent: L.accent ?? "Accent",
};

function mount() {
  document.querySelector("[data-ui-explore-dock]")?.remove();
  const dock = document.createElement("div");
  dock.setAttribute("data-ui-explore-dock", "");
  Object.assign(dock.style, {
    position: "fixed", left: "16px", bottom: "16px", zIndex: "2147483000", display: "flex", alignItems: "center", gap: "2px",
    padding: "6px", borderRadius: "12px", background: UI.bg, border: `1px solid ${UI.line}`, boxShadow: UI.shadow, color: UI.text, font: `600 13px/18px ${UI.font}`,
  });
  dock.setAttribute("role", "toolbar");
  const dot = document.createElement("span");
  dot.setAttribute("aria-hidden", "true");
  Object.assign(dot.style, { width: "7px", height: "7px", margin: "0 6px 0 8px", borderRadius: "50%", flex: "none" });

  // Each button keeps its icon; only the text after it changes.
  const button = (name, iconName) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("data-ui-explore-action", name);
    Object.assign(b.style, { display: "inline-flex", alignItems: "center", gap: "6px", height: "32px", border: "0", cursor: "pointer", borderRadius: "8px", padding: "0 12px", font: "inherit", whiteSpace: "nowrap", background: "transparent", color: UI.text });
    const text = document.createElement("span");
    b.append(icon(iconName), text);
    b.label = text;
    return b;
  };
  const pick = button("pick", "target");
  const style = button("style", "style");
  const library = button("library", "library");
  const status = document.createElement("span");
  Object.assign(status.style, { padding: "0 10px 0 0", font: `500 12px/18px ${UI.font}`, color: UI.muted, display: "none" });
  // The menu is always there, also when the listener is off: the tool's own settings need no agent.
  const more = button("menu", "menu");
  more.label.remove();
  Object.assign(more.style, { width: "32px", padding: "0", justifyContent: "center" });
  more.title = T.menu;
  more.setAttribute("aria-label", T.menu);
  more.setAttribute("aria-haspopup", "menu");
  dock.append(dot, pick, style, library, status, more);
  document.body.append(dock);

  let live = false; // the listener server answers
  let listening = false; // the agent is waiting for a click right now
  let sent = false;
  let stopPick = null;

  const render = () => {
    const on = live && listening;
    pick.style.display = style.style.display = library.style.display = on ? "inline-flex" : "none";
    status.style.display = on ? "none" : "";
    const doing = working();
    const busy = live && (sent || doing);
    status.style.color = busy ? UI.warn : UI.muted;
    status.textContent = !live ? L.offline : !busy ? L.busy : doing === "apply" ? L.applying ?? "Applying… the page may reload a few times" : doing === "cancel" ? L.closing ?? "Closing… the page may reload" : L.sent;
    dot.style.background = on ? UI.accent : busy ? UI.warn : UI.muted;
    dot.style.boxShadow = on ? `0 0 0 3px ${UI.glow}` : "none";
    pick.label.textContent = stopPick ? L.picking : L.pick;
    pick.style.background = stopPick ? UI.accent : "transparent";
    pick.style.color = stopPick ? UI.onAccent : UI.text;
    library.label.textContent = L.library;
    style.label.textContent = styleLabel;
  };
  const send = (body) =>
    signal({ component: "dock", ...body })
      .then((ok) => {
        sent = ok;
        if (ok) noteWork(body.action);
        if (ok) listening = false;
        render();
      })
      .catch(() => {
        live = false;
        render();
      });

  pick.addEventListener("click", () => {
    if (stopPick) {
      stopPick();
      stopPick = null;
      return render();
    }
    stopPick = startPicking(
      (picked) => {
        stopPick = null;
        send({ action: "pick", picked });
      },
      () => {
        stopPick = null;
        render();
      }
    );
    render();
  });
  library.addEventListener("click", () => send({ action: "library" }));
  // Style first, then what to restyle: this page, or an element the user clicks.
  style.addEventListener("click", () =>
    openStylePicker({
      scopes: true,
      onChoose: ({ styles, note, scope }) => {
        if (scope === "page") return send({ action: "style", styles, note, scope: "page" });
        stopPick?.();
        stopPick = startPicking(
          (picked) => {
            stopPick = null;
            send({ action: "style", styles, note, picked });
          },
          () => {
            stopPick = null;
            render();
          }
        );
        render();
      },
    })
  );

  // ---- the menu ----
  let menu = null;
  let clearArmed = false;
  const open = () => [...new Set([...document.querySelectorAll("[data-ui-explore]")].map((n) => n.getAttribute("data-ui-explore")))];
  const closeMenu = () => {
    menu?.remove();
    menu = null;
    clearArmed = false;
    more.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", outside, true);
    document.removeEventListener("keydown", escape, true);
  };
  const outside = (e) => !menu?.contains(e.target) && !more.contains(e.target) && closeMenu();
  const escape = (e) => e.key === "Escape" && closeMenu();
  const el = (tag, style, attrs = {}) => {
    const n = document.createElement(tag);
    Object.assign(n.style, style);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const item = (label, iconName, onClick, { disabled = false, hint = "", danger = false } = {}) => {
    const b = el("button", { display: "flex", alignItems: "center", gap: "10px", width: "100%", minHeight: "36px", padding: "0 10px", border: "0", borderRadius: "8px", background: "transparent", color: danger ? UI.danger : UI.text, font: `500 13px/18px ${UI.font}`, textAlign: "left", cursor: disabled ? "default" : "pointer", opacity: disabled ? "0.45" : "1" }, { type: "button", role: "menuitem" });
    b.disabled = disabled;
    const text = el("span", { flex: "1" });
    text.textContent = label;
    b.append(icon(iconName), text);
    if (hint) {
      const h = el("span", { font: `500 11px/16px ${UI.mono}`, color: UI.muted });
      h.textContent = hint;
      b.append(h);
    }
    b.addEventListener("pointerenter", () => !disabled && (b.style.background = UI.raised));
    b.addEventListener("pointerleave", () => (b.style.background = "transparent"));
    b.addEventListener("click", onClick);
    return b;
  };
  function fillMenu() {
    const on = live && listening;
    const names = open();
    menu.replaceChildren(
      item(T.pickPage, "page", () => {
        closeMenu();
        send({ action: "pick", scope: "page", path: window.location.pathname });
      }, { disabled: !on }),
      item(clearArmed ? T.clearConfirm : T.clearAll, "trash", () => {
        if (!clearArmed) {
          clearArmed = true;
          return fillMenu();
        }
        closeMenu();
        send({ action: "cancel", scope: "all", targets: names.map((component) => ({ component, key: null })) });
      }, { disabled: !on || !names.length, hint: names.length ? String(names.length) : "", danger: clearArmed }),
      el("div", { height: "1px", margin: "4px 2px", background: UI.line }),
      item(T.settings, "sliders", () => fillSettings())
    );
  }
  function fillSettings() {
    const p = getPrefs();
    const head = item(T.settings, "back", () => fillMenu());
    head.style.fontWeight = "600";
    const row = (label, control) => {
      const r = el("div", { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "6px 10px" });
      const l = el("span", { font: `500 13px/18px ${UI.font}`, color: UI.muted });
      l.textContent = label;
      r.append(l, control);
      return r;
    };
    const themes = el("div", { display: "inline-flex", gap: "3px", padding: "3px", borderRadius: "9px", background: UI.raised }, { role: "group", "aria-label": T.theme });
    for (const [id, label] of [["dark", T.themeDark], ["light", T.themeLight]]) {
      const b = el("button", { height: "26px", padding: "0 10px", border: "0", borderRadius: "6px", cursor: "pointer", font: `600 12px/16px ${UI.font}`, background: p.theme === id ? UI.accent : "transparent", color: p.theme === id ? UI.onAccent : UI.muted }, { type: "button", "aria-pressed": String(p.theme === id), "data-ui-explore-theme-choice": id });
      b.textContent = label;
      b.addEventListener("click", () => {
        setPrefs({ theme: id });
        fillSettings();
      });
      themes.append(b);
    }
    const accents = el("div", { display: "inline-flex", gap: "8px" }, { role: "group", "aria-label": T.accent });
    for (const id of Object.keys(ACCENTS)) {
      const b = el("button", { width: "22px", height: "22px", padding: "0", borderRadius: "50%", cursor: "pointer", border: `2px solid ${UI.bg}`, background: ACCENTS[id][p.theme], boxShadow: p.accent === id ? `0 0 0 2px ${UI.text}` : `0 0 0 1px ${UI.line}` }, { type: "button", title: id, "aria-label": id, "aria-pressed": String(p.accent === id), "data-ui-explore-accent-choice": id });
      b.addEventListener("click", () => {
        setPrefs({ accent: id });
        fillSettings();
      });
      accents.append(b);
    }
    const credit = el("a", { display: "block", padding: "8px 10px 6px", font: `500 11px/16px ${UI.mono}`, color: UI.muted, textDecoration: "none" }, { href: CREDIT.url, target: "_blank", rel: "noopener noreferrer", "data-ui-explore-credit": "" });
    credit.textContent = `${CREDIT.name} · ${CREDIT.author}`;
    menu.replaceChildren(head, el("div", { height: "1px", margin: "4px 2px", background: UI.line }), row(T.theme, themes), row(T.accent, accents), el("div", { height: "1px", margin: "4px 2px", background: UI.line }), credit);
  }
  more.addEventListener("click", () => {
    if (menu) return closeMenu();
    menu = el("div", { position: "fixed", left: "16px", bottom: "68px", zIndex: "2147483100", minWidth: "240px", padding: "6px", borderRadius: "12px", background: UI.bg, border: `1px solid ${UI.line}`, boxShadow: UI.shadow, color: UI.text }, { "data-ui-explore-menu": "", role: "menu" });
    fillMenu();
    document.body.append(menu);
    more.setAttribute("aria-expanded", "true");
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", escape, true);
  });

  const check = () =>
    ping().then((p) => {
      // The agent waiting again means the last request was handled.
      if (p.listening && !listening) sent = false;
      if (p.listening) clearWork();
      live = p.up;
      listening = p.listening;
      render();
    });
  check();
  const timer = setInterval(check, 4000);
  render();
  return () => {
    clearInterval(timer);
    stopPick?.();
    closeMenu();
    dock.remove();
  };
}

if (typeof window !== "undefined" && !inFrame) {
  window.__uiExploreDockOff?.();
  window.__uiExploreDockOff = mount();
}
