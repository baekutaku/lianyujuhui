import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import PhoneItemForm from "@/components/admin/phone-items/PhoneItemForm";
import { updatePhoneItem, deletePhoneItem } from "@/app/admin/actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPhoneItemPage({ params }: PageProps) {
  const id = (await params).id;

  const { data: item } = await supabase
    .from("phone_items")
    .select(
      "id, title, slug, subtype, release_year, release_date, summary, preview_text, is_published, embed_url, content_json"
    )
    .eq("id", id)
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
          history_category:
  item.content_json?.historyCategory ??
  (item.subtype === "call" || item.subtype === "video_call" ? "story" : "daily"),
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

moment_title: item.title ?? "",
moment_slug: item.slug ?? "",
moment_author_key: item.content_json?.authorKey ?? "other",
moment_author_name: item.content_json?.authorName ?? "",
moment_author_avatar_url: item.content_json?.authorAvatarUrl ?? "",
moment_author_has_profile: Boolean(item.content_json?.authorHasProfile ?? true),

moment_category: item.content_json?.momentCategory ?? "daily",
moment_year: item.content_json?.momentYear ?? item.release_year ?? "",
moment_date_text: item.content_json?.momentDateText ?? "",

moment_body: item.content_json?.momentBody ?? "",
moment_summary: item.content_json?.momentSummary ?? "",
moment_source: item.content_json?.momentSource ?? "",

moment_image_urls_text: Array.isArray(item.content_json?.momentImageUrls)
  ? item.content_json.momentImageUrls.join("\n")
  : "",

moment_reply_lines_json: Array.isArray(item.content_json?.momentReplyLines)
  ? JSON.stringify(item.content_json.momentReplyLines, null, 2)
  : "",

moment_choice_options_json: Array.isArray(item.content_json?.momentChoiceOptions)
  ? JSON.stringify(item.content_json.momentChoiceOptions, null, 2)
  : "",



moment_is_favorite: Boolean(item.content_json?.isFavorite ?? false),
moment_is_complete: Boolean(item.content_json?.isComplete ?? true),
          article_title: item.title ?? "",
          article_slug: item.slug ?? "",
          article_publisher:
            item.content_json?.publisher ?? item.content_json?.sourceName ?? "",
          article_publisher_slug: item.content_json?.sourceSlug ?? "",
          article_preview: item.content_json?.preview ?? item.preview_text ?? "",
          article_icon_url: item.content_json?.iconUrl ?? "",
          article_author: item.content_json?.author ?? "",
          article_image_url: item.content_json?.imageUrl ?? "",
          article_body: item.content_json?.body ?? "",
          article_subscriber_count: item.content_json?.subscriberCount ?? 0,
          article_like_count: item.content_json?.likeCount ?? 0,
          article_related_story_slug: item.content_json?.relatedStorySlug ?? "",
          article_related_story_label: item.content_json?.relatedStoryLabel ?? "",

          article_comment_0_avatar_url:
            item.content_json?.comments?.[0]?.avatarUrl ?? "",
          article_comment_0_nickname:
            item.content_json?.comments?.[0]?.nickname ?? "",
          article_comment_0_content:
            item.content_json?.comments?.[0]?.content ?? "",
          article_comment_0_like_count:
            item.content_json?.comments?.[0]?.likeCount ?? 0,

          article_comment_1_avatar_url:
            item.content_json?.comments?.[1]?.avatarUrl ?? "",
          article_comment_1_nickname:
            item.content_json?.comments?.[1]?.nickname ?? "",
          article_comment_1_content:
            item.content_json?.comments?.[1]?.content ?? "",
          article_comment_1_like_count:
            item.content_json?.comments?.[1]?.likeCount ?? 0,

          article_comment_2_avatar_url:
            item.content_json?.comments?.[2]?.avatarUrl ?? "",
          article_comment_2_nickname:
            item.content_json?.comments?.[2]?.nickname ?? "",
          article_comment_2_content:
            item.content_json?.comments?.[2]?.content ?? "",
          article_comment_2_like_count:
            item.content_json?.comments?.[2]?.likeCount ?? 0,

          article_comment_3_avatar_url:
            item.content_json?.comments?.[3]?.avatarUrl ?? "",
          article_comment_3_nickname:
            item.content_json?.comments?.[3]?.nickname ?? "",
          article_comment_3_content:
            item.content_json?.comments?.[3]?.content ?? "",
          article_comment_3_like_count:
            item.content_json?.comments?.[3]?.likeCount ?? 0,


            call_translation_html: item.content_json?.translationHtml ?? "",
call_memo_html: item.content_json?.memoHtml ?? "",
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