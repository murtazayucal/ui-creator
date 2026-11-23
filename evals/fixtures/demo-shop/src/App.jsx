import { useState } from "react";
import { ProductCard } from "./ProductCard.jsx";

const products = [
  { id: 1, title: "Trail Running Shoes", description: "Lightweight grip for wet rock and loose gravel.", price: 129, rating: 4.6, tag: "New", hue: 200 },
  { id: 2, title: "Insulated Bottle", description: "Keeps drinks cold for 24 hours.", price: 34, rating: 4.8, tag: null, hue: 150 },
  { id: 3, title: "Merino Base Layer With Extended Sleeves For Cold Mornings", description: "Warm when wet, never itchy.", price: 79, rating: 4.4, tag: "Sale", hue: 20 },
  { id: 4, title: "Headlamp", description: "400 lumens, rechargeable, 60 g.", price: 49, rating: 4.7, tag: null, hue: 50 },
  { id: 5, title: "Day Pack 22L", description: "Vented back panel and rain cover.", price: 95, rating: 4.5, tag: null, hue: 280 },
];

export default function App() {
  const [cart, setCart] = useState([]);
  return (
    <main className="mx-auto max-w-7xl p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Popular this week</h1>
        <p className="text-muted" aria-live="polite">Cart: {cart.length}</p>
      </header>
      <section className="grid grid-cols-5 gap-4" aria-label="Popular products">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onAdd={() => setCart((c) => [...c, p.id])} />
        ))}
      </section>
    </main>
  );
}
