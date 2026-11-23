// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// @ts-nocheck
"use client";
// Design-mode dock for frameworks that render on the server first (Next.js App Router, Remix).
// The dock needs the browser, so it cannot be imported from a server file. Render this component once
// in the root layout while design mode is on, and remove it afterwards:
//
//   import { ExploreDock } from "@/components/__explore__/explore-dock-client";
//   ...
//   <body>{children}<ExploreDock /></body>
//
// In a plain client-side app (Vite, CRA) import "./__explore__/explore-dock.js" from the entry file instead.
import { useEffect } from "react";

export function ExploreDock() {
  useEffect(() => {
    import("./explore-dock.js");
  }, []);
  return null;
}
