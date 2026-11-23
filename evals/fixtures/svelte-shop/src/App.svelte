<script>
  import ProductCard from "./ProductCard.svelte";

  const products = [
    { id: 1, title: "Trail Running Shoes", description: "Lightweight grip for wet rock and loose gravel.", price: 129, hue: 200 },
    { id: 2, title: "Insulated Bottle", description: "Keeps drinks cold for 24 hours.", price: 34, hue: 150 },
    { id: 3, title: "Merino Base Layer With Extended Sleeves For Cold Mornings", description: "Warm when wet, never itchy.", price: 79, hue: 20 },
    { id: 4, title: "Headlamp", description: "400 lumens, rechargeable, 60 g.", price: 49, hue: 50 },
  ];
  let cart = $state([]);
</script>

<main class="mx-auto max-w-7xl p-8">
  <header class="mb-6 flex items-center justify-between">
    <h1 class="text-2xl font-semibold">Popular this week</h1>
    <p class="text-muted" aria-live="polite">Cart: {cart.length}</p>
  </header>
  <section class="grid grid-cols-4 gap-4" aria-label="Popular products">
    {#each products as p (p.id)}
      <ProductCard product={p} onadd={() => cart.push(p.id)} />
    {/each}
  </section>
</main>
