import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type CardDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { slug } = await params;

  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("id, title, slug, rarity, attribute, release_year, summary")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (cardError || !card) {
    notFound();
  }

  const { data: relations, error: relationsError } = await supabase
    .from("item_relations")
    .select("child_id, relation_type")
    .eq("parent_type", "card")
    .eq("parent_id", card.id)
    .eq("child_type", "story")
    .eq("relation_type", "card_story")
    .order("sort_order", { ascending: true });

  let relatedStories: {
    id: string;
    title: string;
    slug: string;
    subtype: string;
    release_year: number;
  }[] = [];

  if (relations && relations.length > 0) {
    const storyIds = relations.map((relation) => relation.child_id);

    const { data: storiesData } = await supabase
      .from("stories")
      .select("id, title, slug, subtype, release_year")
      .in("id", storyIds)
      .eq("is_published", true);

    relatedStories = storiesData ?? [];
  }

  return (
    <main style={{ padding: "40px", maxWidth: "900px" }}>
      <h1>{card.title}</h1>

      <p>
        <strong>rarity:</strong> {card.rarity}
      </p>

      <p>
        <strong>attribute:</strong> {card.attribute}
      </p>

      <p>
        <strong>year:</strong> {card.release_year}
      </p>

      {card.summary && (
        <p>
          <strong>summary:</strong> {card.summary}
        </p>
      )}

      <hr style={{ margin: "24px 0" }} />

      <h2>연결된 스토리</h2>

      {relationsError && (
        <pre style={{ color: "red", whiteSpace: "pre-wrap" }}>
          {JSON.stringify(relationsError, null, 2)}
        </pre>
      )}

      {relatedStories.length === 0 ? (
        <p>연결된 스토리가 없습니다.</p>
      ) : (
        <ul style={{ display: "grid", gap: "12px", padding: 0, listStyle: "none" }}>
          {relatedStories.map((story) => (
            <li
              key={story.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                <Link href={`/stories/${story.slug}`}>{story.title}</Link>
              </h3>
              <p style={{ margin: "4px 0" }}>subtype: {story.subtype}</p>
              <p style={{ margin: "4px 0" }}>year: {story.release_year}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
