import { useQuery } from "@tanstack/react-query";

export function List({ onPick }: { onPick: (id: string) => void }) {
  const { data, isLoading, isError } = useQuery({ queryKey: ["items"], queryFn: load });
  if (isLoading) return <Skeleton />;
  if (isError) return <p role="alert">Could not load items. Check your connection and try again.</p>;
  if (data.length === 0) return <p>No items yet. Create the first one.</p>;
  return (
    <ul className="motion-reduce:transition-none transition-opacity">
      {data.map((item) => (
        <li key={item.id}>
          <a href={`#item-${item.id}`}>{item.name}</a>
          <img src={item.thumb} alt="" />
          <button type="button" onClick={() => onPick(item.id)} className="h-9 px-3 focus-visible:ring-2">
            Pick {item.name}
          </button>
          <button type="button" aria-label="Delete" onClick={() => remove(item.id)} className="size-9">
            <TrashIcon />
          </button>
          <label htmlFor={`note-${item.id}`}>Note</label>
          <input id={`note-${item.id}`} placeholder="e.g. fragile" className="text-base" />
        </li>
      ))}
    </ul>
  );
}
