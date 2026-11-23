#!/usr/bin/env node
// Reports a project's framework, styling approach, component library and token files as JSON.
// Usage: node detect-stack.mjs [project path]
// Reads package.json and a few config files; runs nothing from the project.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? ".");
const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => {
  try { return fs.readFileSync(path.join(root, p), "utf8"); } catch { return null; }
};
const json = (p) => {
  try { return JSON.parse(read(p)); } catch { return null; }
};

const pkg = json("package.json");
if (!pkg) {
  console.log(JSON.stringify({ root: root.replace(/\\/g, "/"), error: "no readable package.json here; pass the project folder, or detect the stack by reading the files" }, null, 2));
  process.exit(0);
}
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
const has = (n) => n in deps;
const ver = (n) => (deps[n] ?? "").replace(/^[\^~>=<\s]+/, "") || null;
const firstOf = (table) => table.filter(([dep]) => has(dep)).map(([dep, name]) => ({ name, package: dep, version: ver(dep) }));

const framework = firstOf([
  ["next", "Next.js"], ["@remix-run/react", "Remix"], ["react-router", "React Router"], ["astro", "Astro"], ["nuxt", "Nuxt"],
  ["@sveltejs/kit", "SvelteKit"], ["@angular/core", "Angular"], ["expo", "Expo"], ["react-native", "React Native"],
  ["vite", "Vite"], ["react", "React"], ["vue", "Vue"], ["svelte", "Svelte"], ["solid-js", "Solid"],
]);

const styling = firstOf([
  ["tailwindcss", "Tailwind CSS"], ["styled-components", "styled-components"], ["@emotion/react", "Emotion"],
  ["@vanilla-extract/css", "vanilla-extract"], ["@pandacss/dev", "Panda CSS"], ["sass", "Sass"], ["unocss", "UnoCSS"],
]);

const components = firstOf([
  ["@mui/material", "MUI"], ["antd", "Ant Design"], ["@chakra-ui/react", "Chakra UI"], ["@mantine/core", "Mantine"],
  ["daisyui", "daisyUI"], ["@heroui/react", "HeroUI"], ["@nextui-org/react", "NextUI"], ["flowbite", "Flowbite"],
  ["@base-ui-components/react", "Base UI"], ["@headlessui/react", "Headless UI"], ["@ark-ui/react", "Ark UI"],
  ["primevue", "PrimeVue"], ["@nuxt/ui", "Nuxt UI"], ["bits-ui", "Bits UI"], ["react-aria-components", "React Aria"],
]);
const radixCount = Object.keys(deps).filter((d) => d.startsWith("@radix-ui/") || d === "radix-ui").length;
if (radixCount) components.push({ name: "Radix UI", packages: radixCount });

const shadcnCfg = json("components.json");
const shadcn = shadcnCfg
  ? { style: shadcnCfg.style ?? null, baseColor: shadcnCfg.tailwind?.baseColor ?? null, cssVariables: shadcnCfg.tailwind?.cssVariables ?? null, css: shadcnCfg.tailwind?.css ?? null, iconLibrary: shadcnCfg.iconLibrary ?? null, aliases: shadcnCfg.aliases ?? null, registries: Object.keys(shadcnCfg.registries ?? {}) }
  : null;

const icons = firstOf([
  ["lucide-react", "Lucide"], ["@phosphor-icons/react", "Phosphor"], ["@heroicons/react", "Heroicons"],
  ["@tabler/icons-react", "Tabler"], ["react-icons", "react-icons"], ["@radix-ui/react-icons", "Radix Icons"],
]);
const motion = firstOf([["motion", "Motion"], ["framer-motion", "Framer Motion"], ["gsap", "GSAP"], ["tw-animate-css", "tw-animate-css"], ["tailwindcss-animate", "tailwindcss-animate"]]);
const data = firstOf([["@tanstack/react-query", "TanStack Query"], ["swr", "SWR"], ["recharts", "Recharts"], ["@tanstack/react-table", "TanStack Table"], ["react-hook-form", "React Hook Form"]]);

// Stylesheets that define tokens.
const cssCandidates = [shadcn?.css, "app/globals.css", "src/app/globals.css", "src/index.css", "src/styles/globals.css", "styles/globals.css", "src/app.css", "src/styles.css", "app/app.css", "assets/css/main.css", "src/assets/main.css"].filter(Boolean);
const tokenFiles = [];
for (const rel of [...new Set(cssCandidates)]) {
  const css = read(rel);
  if (!css) continue;
  tokenFiles.push({
    file: rel,
    customProperties: new Set([...css.matchAll(/(^|[\s;{])(--[\w-]+)\s*:/g)].map((m) => m[2])).size,
    tailwindTheme: /@theme\b/.test(css),
    darkMode: /\.dark\b|\[data-theme=["']?dark|prefers-color-scheme:\s*dark/.test(css),
    colorSpace: /oklch\(/.test(css) ? "oklch" : /hsl\(|\d+\s+\d+%\s+\d+%/.test(css) ? "hsl" : /#[0-9a-fA-F]{3,8}\b/.test(css) ? "hex" : null,
  });
}

const componentDirs = ["src/components", "components", "app/components", "src/lib/components", "src/components/ui", "components/ui"].filter(exists);
const tailwindMajor = has("tailwindcss") ? parseInt(ver("tailwindcss"), 10) || null : null;

console.log(
  JSON.stringify(
    {
      root: root.replace(/\\/g, "/"),
      name: pkg.name ?? null,
      typescript: has("typescript") || exists("tsconfig.json"),
      framework,
      styling,
      tailwind: tailwindMajor ? { major: tailwindMajor, config: ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.mjs", "tailwind.config.cjs"].find(exists) ?? (tailwindMajor >= 4 ? "CSS (@theme)" : null) } : null,
      componentLibraries: components,
      shadcn,
      icons,
      motion,
      data,
      tokenFiles,
      componentDirs,
      scripts: Object.fromEntries(["dev", "start", "build", "lint", "typecheck", "test"].filter((s) => pkg.scripts?.[s]).map((s) => [s, pkg.scripts[s]])),
      designRecord: { master: exists("design-system/MASTER.md"), sources: exists("design-system/sources.json") },
      guidance: [
        components.length > 1 ? "More than one component library is installed; ask which one is current before adding components." : null,
        !components.length && !shadcn ? "No component library detected; components are hand-built. Do not add a library unless the user chooses one." : null,
        !tokenFiles.length ? "No token stylesheet found at the usual paths; look for where colors are defined before proposing tokens." : null,
      ].filter(Boolean),
    },
    null,
    2
  )
);
