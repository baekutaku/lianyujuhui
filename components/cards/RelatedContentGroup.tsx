import Link from "next/link";

type RelatedItem = {
  id: string;
  title: string;
  slug: string;
};

type RelatedContentGroupProps = {
  title: string;
  basePath: string;
  items: RelatedItem[];
};

export default function RelatedContentGroup({
  title,
  basePath,
  items,
}: RelatedContentGroupProps) {
  if (!items.length) return null;

  return (
    <section>
      <h3 className="mb-3 text-xl font-bold text-slate-800">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`${basePath}/${item.slug}`}
            className="block rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 transition hover:bg-slate-50"
          >
            {item.title}
          </Link>
        ))}
      </div>
    </section>
  );
}