export function ProductCard({ product, onAdd }) {
  return (
    <article className="flex flex-col rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 h-28 rounded-md" style={{ background: `oklch(0.9 0.06 ${product.hue})` }} role="img" aria-label={product.title} />
      <h2 className="font-semibold">{product.title}</h2>
      <p className="mt-1 text-sm text-muted">{product.description}</p>
      <p className="mt-2 text-sm text-muted">Rating {product.rating}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-semibold">${product.price}</span>
        <button type="button" onClick={onAdd} className="h-9 rounded-md bg-primary px-3 text-sm text-primary-fg hover:brightness-110 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          Add to cart
        </button>
      </div>
    </article>
  );
}
