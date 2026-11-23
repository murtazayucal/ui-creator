import { Heart, X } from "lucide-react";

export function ProductCard({ product, onOpen }: { product: any; onOpen?: () => void }) {
  return (
    <div className="rounded-xl border p-4 shadow transition-all" onClick={() => onOpen?.()}>
      <img src={product.image} className="h-40 w-full object-cover" />
      <h3 className="text-[#111827] font-semibold">{product.title}</h3>
      <p style={{ color: "#6b7280", fontSize: 11 }}>{product.description}</p>
      <span className="text-[#6b7280]">{product.price}</span>
      <button className="size-4" onClick={() => {}}>
        <Heart />
      </button>
      <button className="h-9 px-3 outline-none focus-visible:ring-2" aria-label="Remove">
        <X />
      </button>
      <button className="h-9 px-4 bg-primary text-white" tabIndex={3}>Add to cart</button>
    </div>
  );
}
