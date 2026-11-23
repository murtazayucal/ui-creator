"use client";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "../components/ProductCard";

export default function Page() {
  const { data } = useQuery({ queryKey: ["products"], queryFn: () => fetch("/api/products").then((r) => r.json()) });
  return (
    <main className="p-[13px]">
      <h1 className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent text-4xl">🚀 Our Products</h1>
      <input placeholder="Search products" className="border px-2 text-[11px] outline-none" />
      <div className="grid grid-cols-5 gap-4">
        {data.map((p: any) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      <p className="text-[#9ca3af]">Something went wrong</p>
    </main>
  );
}
