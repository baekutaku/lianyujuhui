import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import CallDetail from "@/components/phone/call/CallDetail";
import { supabase } from "@/lib/supabase/client";

type PageProps = {
  params: Promise<{
    characterKey: string;
    slug: string;
  }>;
};

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function CallDetailPage({ params }: PageProps) {
  const raw = await params;
  const characterKey = safeDecode(raw.characterKey);
  const slug = safeDecode(raw.slug);

  const { data: item } = await supabase
    .from("phone_items")
    .select("id, title, slug, subtype, embed_url, content_json, is_published")
    .eq("slug", slug)
    .in("subtype", ["call", "video_call"])
    .eq("is_published", true)
    .maybeSingle();

  if (!item) notFound();
  if (item.content_json?.characterKey !== characterKey) notFound();

  return (
    <main className="phone-page">
      <PhoneShell fullBleed>
        <CallDetail
          characterKey={characterKey}
          characterName={item.content_json?.characterName ?? item.title}
          title={item.title}
          youtubeEmbedUrl={item.embed_url ?? ""}
        />
      </PhoneShell>
    </main>
  );
}