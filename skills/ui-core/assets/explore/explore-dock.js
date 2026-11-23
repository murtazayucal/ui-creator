// Temporary "design mode" dock for the explore command: a small floating control in the bottom-left corner
// that is there even when no comparison is open. Import it once from the app's entry file while design mode
// is on, and remove that import afterwards:
//   import "./__explore__/explore-dock.js";
// Plain JavaScript, so it works with any framework. It needs the listener to be running; without it the
// dock says so and does nothing else.
import { exploreConfig } from "./explore-config.js";
import { icon, inFrame, ping, signal, startPicking, UI } from "./explore-pick.js";
import { openStylePicker, styleLabel } from "./explore-styles.js";

const L = exploreConfig.labels;

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
  dock.append(dot, pick, style, library, status);
  document.body.append(dock);

  let live = false; // the listener server answers
  let listening = false; // the agent is waiting for a click right now
  let sent = false;
  let stopPick = null;

  const render = () => {
    const on = live && listening;
    pick.style.display = style.style.display = library.style.display = on ? "inline-flex" : "none";
    status.style.display = on ? "none" : "";
    status.style.color = live && sent ? UI.warn : UI.muted;
    status.textContent = !live ? L.offline : sent ? L.sent : L.busy;
    dot.style.background = on ? UI.accent : live && sent ? UI.warn : UI.muted;
    dot.style.boxShadow = on ? "0 0 0 3px rgb(200 240 49 / 0.18)" : "none";
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

  const check = () =>
    ping().then((p) => {
      // The agent waiting again means the last request was handled.
      if (p.listening && !listening) sent = false;
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
    dock.remove();
  };
}

if (typeof window !== "undefined" && !inFrame) {
  window.__uiExploreDockOff?.();
  window.__uiExploreDockOff = mount();
}
