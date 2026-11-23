// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// Read-only page inspection for the explore command. Evaluate this file in the page once, then call:
//   __uiExplore.describe("css selector")      or   __uiExplore.describe({ text: "Add to cart" })
//   __uiExplore.pick()                        then, after the user clicks an element:  __uiExplore.picked
// It changes nothing in the app. pick() adds a temporary outline and intercepts one click.
(() => {
  const fiberOf = (el) => {
    const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
    return key ? el[key] : null;
  };
  const typeName = (type) => {
    if (!type || typeof type === "string") return null;
    const fn = typeof type === "function" ? type : type.render || type.type || null;
    const name = type.displayName || (fn && (fn.displayName || fn.name)) || null;
    return name && name.length > 1 ? name : null;
  };
  // Named components that rendered this element, nearest first.
  const chain = (el) => {
    const out = [];
    for (let f = fiberOf(el); f; f = f.return) {
      const n = typeName(f.type);
      if (n && out[out.length - 1]?.name !== n) out.push({ name: n, type: f.type });
    }
    return out;
  };
  // The outermost DOM element that still belongs to the same nearest component.
  const rootOf = (el, type) => {
    let root = el;
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (chain(p)[0]?.type === type) root = p;
      else break;
    }
    return root;
  };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
  };
  const text = (el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const signature = (el) => `${el.tagName.toLowerCase()}.${[...el.classList].sort().join(".")}`;

  function info(el) {
    if (!el) return { found: false };
    const comps = chain(el);
    const result = { found: true, tag: el.tagName.toLowerCase(), text: text(el), classes: el.className?.toString().slice(0, 300) ?? "", rect: rect(el), react: comps.length > 0, components: comps.slice(0, 6).map((c) => c.name) };
    if (comps.length) {
      const owner = comps[0];
      const roots = [...document.querySelectorAll("body *")].slice(0, 8000).filter((n) => chain(n)[0]?.type === owner.type && rootOf(n, owner.type) === n);
      const mine = rootOf(el, owner.type);
      result.component = {
        name: owner.name,
        instances: roots.length,
        thisIsInstance: roots.indexOf(mine) + 1,
        sameParent: roots.filter((n) => n.parentElement === mine.parentElement).length,
        rootTag: mine.tagName.toLowerCase(),
        rootRect: rect(mine),
        instanceTexts: roots.slice(0, 8).map(text).map((t) => t.slice(0, 50)),
        searchHint: `Search the source for "function ${owner.name}" or "const ${owner.name}".`,
      };
    } else {
      // Not React, or a production build: fall back to structure.
      let node = el;
      let best = null;
      for (let depth = 0; node && node.parentElement && depth < 6; depth++, node = node.parentElement) {
        const sibs = [...node.parentElement.children].filter((s) => signature(s) === signature(node));
        if (sibs.length > 1 && (!best || sibs.length >= best.count)) best = { tag: node.tagName.toLowerCase(), classes: [...node.classList].join(" "), count: sibs.length, rect: rect(node) };
      }
      result.repeated = best;
      result.searchHint = "No React component data. Search the source for the element's text or class list.";
    }
    return result;
  }

  function find(target) {
    if (typeof target === "string") return document.querySelector(target);
    if (target && target.text) {
      const want = target.text.toLowerCase();
      const hits = [...document.querySelectorAll("body *")].filter((n) => n.children.length === 0 && (n.textContent || "").toLowerCase().includes(want));
      return hits[target.index || 0] || null;
    }
    return null;
  }

  const api = {
    version: 1,
    picked: null,
    describe: (target) => info(find(target)),
    pick() {
      api.picked = null;
      let last = null;
      const mark = (el, on) => { if (el) el.style.outline = on ? "2px solid #e11d48" : el.dataset.uiExploreOutline || ""; };
      const over = (e) => {
        mark(last, false);
        last = e.target;
        if (last.dataset.uiExploreOutline === undefined) last.dataset.uiExploreOutline = last.style.outline || "";
        mark(last, true);
      };
      const done = (e) => {
        e.preventDefault();
        e.stopPropagation();
        mark(last, false);
        document.querySelectorAll("[data-ui-explore-outline]").forEach((n) => delete n.dataset.uiExploreOutline);
        document.removeEventListener("mouseover", over, true);
        document.removeEventListener("click", done, true);
        api.picked = info(e.target);
      };
      document.addEventListener("mouseover", over, true);
      document.addEventListener("click", done, true);
      return "Waiting for one click. Read __uiExplore.picked afterwards.";
    },
  };
  window.__uiExplore = api;
  return "ready";
})();
