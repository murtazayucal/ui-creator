<!-- ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator -->
<!--
  Svelte 3 and 4 adapter for the explore comparison (no runes; for Svelte 5 use ExploreSlot.svelte).
  Temporary: copy it with the other explore files, delete afterwards.

  A .svelte file holds one component, so for the comparison:
    1. move the component being explored to <Name>.current.svelte, unchanged;
    2. make <Name>.svelte a thin wrapper that keeps the same props:

       <script>
         import { createEventDispatcher } from "svelte";
         import ExploreSlot from "./__explore__/ExploreSlotLegacy.svelte";
         import Current from "./ProductCard.current.svelte";
         import { drafts } from "./ProductCard.drafts.js";
         export let product;
         const dispatch = createEventDispatcher();
       </script>
       <ExploreSlot name="ProductCard" original={Current} {drafts} bind={{ product }} on={{ add: (e) => dispatch("add", e.detail) }} />

  `bind` carries the props. Component events cannot be forwarded as a group in Svelte 3 and 4,
  so name each one the component dispatches in `on` and re-dispatch it, as above.
  All behaviour (which draft shows where, the bar, the listener) lives in explore-core.js.
-->
<script>
  import { onDestroy, onMount } from "svelte";
  import { attach } from "./explore-core.js";

  export let name;
  export let original;
  export let drafts;
  export let bind = {};
  export let on = {};

  let key = "current";
  let el;
  let slot;
  let inst;
  let offs = [];

  onMount(() => {
    slot = attach(name, el, Object.keys(drafts), (k) => (key = k));
    return () => slot.detach();
  });

  $: if (slot) slot.setKeys(Object.keys(drafts));
  $: view = key === "current" ? original : drafts[key] || original;

  // The inner component is created anew on every switch: listen on the new instance each time.
  function listen(instance, handlers) {
    offs.forEach((off) => off());
    offs = instance ? Object.keys(handlers || {}).map((event) => instance.$on(event, handlers[event])) : [];
  }
  $: listen(inst, on);
  onDestroy(() => listen(null));
</script>

<div bind:this={el} data-ui-explore={name}>
  <svelte:component this={view} bind:this={inst} {...bind} />
</div>
