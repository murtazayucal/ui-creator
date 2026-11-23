<!-- ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator -->
<!--
  Svelte 5 adapter for the explore comparison (uses runes; not for Svelte 4).
  Temporary: copy it with the other explore files, delete afterwards.

  A .svelte file holds one component, so for the comparison:
    1. move the component being explored to <Name>.current.svelte, unchanged;
    2. make <Name>.svelte a thin wrapper:

       <script>
         import ExploreSlot from "./__explore__/ExploreSlot.svelte";
         import Current from "./ProductCard.current.svelte";
         import { drafts } from "./ProductCard.drafts.js";
         let props = $props();
       </script>
       <ExploreSlot name="ProductCard" original={Current} {drafts} bind={props} />

  All behaviour (which draft shows where, the bar, the listener) lives in explore-core.js.
-->
<script>
  import { attach } from "./explore-core.js";

  let { name, original, drafts, bind = {} } = $props();
  let key = $state("current");
  let el;

  $effect(() => {
    const slot = attach(name, el, Object.keys(drafts), (k) => (key = k));
    return () => slot.detach();
  });

  const View = $derived(key === "current" ? original : drafts[key] ?? original);
</script>

<div bind:this={el} data-ui-explore={name}>
  <View {...bind} />
</div>
