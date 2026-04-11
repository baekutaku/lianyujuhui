import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import PhoneItemForm from "@/components/admin/phone-items/PhoneItemForm";
import { updatePhoneItem, deletePhoneItem } from "@/app/admin/actions";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function safeDecodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function EditPhoneItemPage({ params }: PageProps) {
  const rawSlug = (await params).slug;
  const slug = safeDecodeSlug(rawSlug);

  const { data: item } = await supabase
    .from("phone_items")
    .select(
      "id, title, slug, subtype, release_year, release_date, summary, is_published, embed_url, content_json"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!item) notFound();

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Phone Items / Edit</div>
        <h1 className="page-title">휴대폰 콘텐츠 수정</h1>
      </header>

<PhoneItemForm
  action={updatePhoneItem}
  submitLabel="휴대폰 콘텐츠 수정 저장"
  hiddenFields={
    <>
      <input type="hidden" name="phoneItemId" value={item.id} />
    </>
  }
  initialValues={{
    subtype: item.subtype,
    server_key: "kr",
    is_published: item.is_published ?? true,

    title: item.title ?? "",
    slug: item.slug ?? "",
    character_key: item.content_json?.characterKey ?? "baiqi",
    character_name: item.content_json?.characterName ?? "",
    thread_key: item.content_json?.threadKey ?? item.slug ?? "",
    history_category: item.content_json?.historyCategory ?? "daily",
    history_summary: item.content_json?.historySummary ?? "",
history_source: item.content_json?.historySource ?? "",
    level: item.content_json?.level ?? "",

    avatar_url: item.content_json?.avatarUrl ?? "",
    editor_entries_json: JSON.stringify(
      item.content_json?.editorEntries ?? item.content_json?.entries ?? []
    ),
    cover_image: item.content_json?.coverImage ?? "",
    youtube_url: item.embed_url ?? "",

    preview: item.content_json?.preview ?? "",
    icon_url: item.content_json?.iconUrl ?? "",
    image_url: item.content_json?.imageUrl ?? "",
    source_name: item.content_json?.sourceName ?? "",
    author: item.content_json?.author ?? "",
    body: item.content_json?.body ?? "",

  }}
/>

      <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
        <Link href="/admin/phone-items" className="nav-link">
          목록으로
        </Link>

        <form action={deletePhoneItem}>
          <input type="hidden" name="phoneItemId" value={item.id} />
          <button
            type="submit"
            className="nav-link"
            style={{ border: "none", background: "transparent", cursor: "pointer" }}
          >
            삭제
          </button>
        </form>
      </div>
    </main>
  );
}