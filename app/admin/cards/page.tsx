import Link from "next/link";
import { deleteCard } from "@/app/admin/actions";
import { deleteIllustration } from "@/app/admin/illustrations/actions";
import AdminVisualCreateMenu from "@/components/admin/cards/AdminVisualCreateMenu";
import { getAdminSupabase } from "@/lib/supabase/admin";

type AdminCardsPageProps = { searchParams?: Promise<{ type?: string; q?: string }> };
type VisualRow = { key: string; kind: "card" | "illustration"; id: string; title: string; imageUrl: string; createdAt: string; releaseYear: number | null; releaseDate: string | null; serverKey: string; characterName: string; published: boolean; rarity?: string | null; slug?: string | null; };

export default async function AdminCardsPage({ searchParams }: AdminCardsPageProps) {
  const params = searchParams ? await searchParams : {};
  const type = ["card", "illustration"].includes(String(params?.type)) ? String(params?.type) : "all";
  const q = String(params?.q || "").trim().toLowerCase();
  const supabase = getAdminSupabase();
  const [{ data: cards, error: cardsError }, { data: illustrations, error: illustrationsError }, { data: servers }, { data: characters }] = await Promise.all([
    supabase.from("cards").select("id, title, slug, rarity, release_year, release_date, created_at, thumbnail_url, cover_image_url, is_published, server_id, primary_character_id").order("created_at", { ascending: false }),
    supabase.from("illustrations").select("id, title, image_url, release_year, release_date, created_at, is_published, server_id, primary_character_id").order("created_at", { ascending: false }),
    supabase.from("servers").select("id, key"),
    supabase.from("characters").select("id, key, name_ko"),
  ]);
  const serverMap = new Map((servers ?? []).map((row: any) => [row.id, String(row.key || "").toUpperCase()]));
  const characterMap = new Map((characters ?? []).map((row: any) => [row.id, row.name_ko || row.key || ""]));
  const cardRows: VisualRow[] = (cards ?? []).map((card: any) => ({ key: `card-${card.id}`, kind: "card", id: card.id, title: card.title, imageUrl: card.thumbnail_url || card.cover_image_url || "", createdAt: card.created_at || "", releaseYear: card.release_year ?? null, releaseDate: card.release_date ?? null, serverKey: serverMap.get(card.server_id) ?? "", characterName: characterMap.get(card.primary_character_id) ?? "", published: Boolean(card.is_published), rarity: card.rarity, slug: card.slug }));
  const illustrationRows: VisualRow[] = (illustrations ?? []).map((item: any) => ({ key: `illustration-${item.id}`, kind: "illustration", id: item.id, title: item.title, imageUrl: item.image_url || "", createdAt: item.created_at || "", releaseYear: item.release_year ?? null, releaseDate: item.release_date ?? null, serverKey: serverMap.get(item.server_id) ?? "", characterName: characterMap.get(item.primary_character_id) ?? "", published: Boolean(item.is_published) }));
  const rows = [...cardRows, ...illustrationRows].filter(row => type === "all" || row.kind === type).filter(row => !q || [row.title, row.serverKey, row.characterName, row.rarity, row.releaseYear].filter(Boolean).some(value => String(value).toLowerCase().includes(q))).sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  function tabHref(nextType: string) { const query = new URLSearchParams(); if (nextType !== "all") query.set("type", nextType); if (q) query.set("q", q); const value = query.toString(); return value ? `/admin/cards?${value}` : "/admin/cards"; }
  return (
    <main>
      <header className="page-header admin-visual-header"><div><div className="page-eyebrow">Admin / Visual Archive</div><h1 className="page-title">카드 · 일러스트 관리</h1><p className="page-desc">카드와 카드 외 일러스트를 한 곳에서 확인하고 관리합니다.</p></div><AdminVisualCreateMenu /></header>
      {(cardsError || illustrationsError) ? <pre className="error-box">{JSON.stringify({ cards: cardsError, illustrations: illustrationsError }, null, 2)}</pre> : null}
      <section className="admin-visual-controls">
        <nav className="admin-visual-tabs" aria-label="자료 종류">
          <Link href={tabHref("all")} className={type === "all" ? "is-active" : ""}>전체 <span>{cardRows.length + illustrationRows.length}</span></Link>
          <Link href={tabHref("card")} className={type === "card" ? "is-active" : ""}>카드 <span>{cardRows.length}</span></Link>
          <Link href={tabHref("illustration")} className={type === "illustration" ? "is-active" : ""}>카드 외 일러스트 <span>{illustrationRows.length}</span></Link>
        </nav>
        <form method="get" action="/admin/cards" className="admin-visual-search">{type !== "all" ? <input type="hidden" name="type" value={type} /> : null}<span className="material-symbols-rounded">search</span><input type="search" name="q" defaultValue={q} placeholder="제목 · 서버 · 캐릭터 · 연도 검색" /><button type="submit">검색</button></form>
      </section>
      <div className="admin-visual-list-head"><span>자료</span><span>종류</span><span>제목 / 정보</span><span>상태</span><span>관리</span></div>
      {rows.length === 0 ? <div className="empty-box">조건에 맞는 자료가 없습니다.</div> : (
        <div className="admin-visual-list">{rows.map(row => (
          <article key={row.key} className="admin-visual-row">
            <div className="admin-visual-thumb">{row.imageUrl ? <img src={row.imageUrl} alt={row.title} /> : <span>NO IMAGE</span>}</div>
            <div><span className={`admin-visual-kind ${row.kind === "card" ? "is-card" : "is-illust"}`}>{row.kind === "card" ? "CARD" : "ILLUST"}</span></div>
            <div className="admin-visual-info"><strong>{row.title}</strong><div>{row.rarity ? <span>{String(row.rarity).toUpperCase()}</span> : null}{row.releaseYear ? <span>{row.releaseYear}</span> : null}{row.releaseDate ? <span>{row.releaseDate}</span> : null}{row.serverKey ? <span>{row.serverKey}</span> : null}{row.characterName ? <span>{row.characterName}</span> : null}</div></div>
            <div><span className={`admin-visual-status ${row.published ? "is-published" : "is-draft"}`}>{row.published ? "공개" : "비공개"}</span></div>
            <div className="admin-visual-actions">{row.kind === "card" ? (<><Link href={`/admin/cards/${row.slug}/edit`} className="mini-button">수정</Link><Link href={`/cards/${row.slug}`} className="mini-button">보기</Link><form action={deleteCard}><input type="hidden" name="cardId" value={row.id} /><button type="submit" className="mini-button">삭제</button></form></>) : (<><Link href={`/admin/illustrations/${row.id}/edit`} className="mini-button">수정</Link><Link href="/cards?illustrations=1" className="mini-button">보기</Link><form action={deleteIllustration}><input type="hidden" name="id" value={row.id} /><button type="submit" className="mini-button">삭제</button></form></>)}</div>
          </article>
        ))}</div>
      )}
    </main>
  );
}
