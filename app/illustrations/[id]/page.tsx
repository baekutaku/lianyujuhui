import Link from "next/link";
import { notFound } from "next/navigation";
import IllustrationGallery from "@/components/illustrations/IllustrationGallery";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";

type IllustrationDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const CHARACTER_LABEL_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
};

const ALLOWED_BACK_PARAMS = new Set([
  "q",
  "rarity",
  "category",
  "character",
  "year",
  "tag",
  "sort",
  "illustrations",
  "page",
]);

function buildBackHref(
  params: Record<string, string | string[] | undefined>
) {
  const query = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(params)) {
    if (!ALLOWED_BACK_PARAMS.has(key)) continue;

    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (!value) continue;
    query.set(key, value);
  }

  if (!query.has("illustrations")) {
    query.set("illustrations", "1");
  }

  return `/cards?${query.toString()}`;
}

export default async function IllustrationDetailPage({
  params,
  searchParams,
}: IllustrationDetailPageProps) {
  const { id } = await params;
  const queryParams = searchParams ? await searchParams : {};
  const admin = await isAdmin();

  const { data: item, error } = await supabase
    .from("illustrations")
    .select(
      "id, title, image_url, summary, release_year, release_date, source_url, server_id, primary_character_id, is_published"
    )
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("[illustrations/[id]] illustration fetch error:", error);
  }

  if (!item) notFound();

  const [
    { data: imageRows },
    { data: server },
    { data: character },
  ] = await Promise.all([
    supabase
      .from("illustration_images")
      .select("id, url, sort_order, is_primary")
      .eq("illustration_id", item.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),

    item.server_id
      ? supabase
          .from("servers")
          .select("key")
          .eq("id", item.server_id)
          .maybeSingle()
      : Promise.resolve({ data: null as any }),

    item.primary_character_id
      ? supabase
          .from("characters")
          .select("key, name_ko")
          .eq("id", item.primary_character_id)
          .maybeSingle()
      : Promise.resolve({ data: null as any }),
  ]);

  const images = [
    ...(item.image_url
      ? [{ id: "primary-fallback", url: item.image_url, isPrimary: true }]
      : []),
    ...((imageRows ?? []).map((row: any) => ({
      id: row.id,
      url: row.url,
      isPrimary: row.is_primary,
    })) ?? []),
  ];

  const characterLabel =
    character?.name_ko ||
    CHARACTER_LABEL_MAP[character?.key || ""] ||
    character?.key ||
    "";

  const serverLabel = server?.key ? String(server.key).toUpperCase() : "";
  const backHref = buildBackHref(queryParams);

  return (
    <main className="illustration-detail-page">
      <div className="illustration-detail-topbar">
        <Link href={backHref} className="illustration-detail-back">
          <span className="material-symbols-rounded">arrow_back</span>
          카드 · 일러스트 목록
        </Link>

        {admin ? (
          <Link
            href={`/admin/illustrations/${item.id}/edit`}
            className="mini-button"
          >
            관리자 수정
          </Link>
        ) : null}
      </div>

      <div className="illustration-detail-layout">
        <IllustrationGallery
          title={item.title}
          images={images}
          primaryUrl={item.image_url}
        />

        <section className="illustration-detail-info">
          <div className="page-eyebrow">Illustration Database</div>
          <h1 className="illustration-detail-title">{item.title}</h1>

          <div className="illustration-detail-kind-row">
            <span className="cards-mixed-kind">ILLUST</span>
            {characterLabel ? (
              <span className="meta-pill">{characterLabel}</span>
            ) : null}
            {serverLabel ? (
              <span className="meta-pill">{serverLabel}</span>
            ) : null}
          </div>

          {item.summary ? (
            <p className="illustration-detail-summary">{item.summary}</p>
          ) : null}

          <div className="illustration-detail-meta">
            <div>
              <span>RELEASE</span>
              <strong>{item.release_date || "—"}</strong>
            </div>
            <div>
              <span>YEAR</span>
              <strong>{item.release_year || "—"}</strong>
            </div>
            <div>
              <span>IMAGES</span>
              <strong>{Math.max(imageRows?.length || 0, 1)}</strong>
            </div>
          </div>

          {item.source_url ? (
            <a
              href={item.source_url}
              target="_blank"
              rel="noreferrer"
              className="illustration-detail-source"
            >
              <span className="material-symbols-rounded">open_in_new</span>
              출처 열기
            </a>
          ) : null}
        </section>
      </div>
    </main>
  );
}
