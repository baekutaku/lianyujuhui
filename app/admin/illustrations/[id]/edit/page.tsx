import IllustrationImagesField from "@/components/admin/illustrations/IllustrationImagesField";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { updateIllustration } from "@/app/admin/illustrations/actions";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditIllustrationPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = getAdminSupabase();
  const [{ data: item, error }, { data: servers }, { data: characters }] = await Promise.all([
    supabase.from("illustrations").select("id, title, image_url, summary, release_year, release_date, source_url, server_id, primary_character_id, is_published").eq("id", id).maybeSingle(),
    supabase.from("servers").select("id, key, name").order("key"),
    supabase.from("characters").select("id, key, name_ko").order("sort_order", { ascending: true }),
  ]);
  if (error || !item) notFound();
  const serverKey = (servers ?? []).find((row: any) => row.id === item.server_id)?.key ?? "";
  const characterKey = (characters ?? []).find((row: any) => row.id === item.primary_character_id)?.key ?? "";
  return (
    <main>
      <header className="page-header"><div className="page-eyebrow">Admin / Visual Archive</div><h1 className="page-title">일러스트 수정</h1><p className="page-desc">{item.title}</p></header>
      <form action={updateIllustration} className="form-panel">
        <input type="hidden" name="id" value={item.id} />
        <div className="form-grid">
          <label className="form-field form-field-full"><span>제목</span><input name="title" defaultValue={item.title} required /></label>
          <label className="form-field"><span>발매년도 / 공개년도</span><input name="releaseYear" type="number" defaultValue={item.release_year ?? ""} /></label>
          <label className="form-field"><span>발매일 / 공개일</span><input name="releaseDate" type="date" defaultValue={item.release_date ?? ""} /></label>
          <label className="form-field"><span>서버</span><select name="serverKey" defaultValue={serverKey}><option value="">미지정</option>{(servers ?? []).map((server: any) => <option key={server.key} value={server.key}>{server.key?.toUpperCase() || server.name}</option>)}</select></label>
          <label className="form-field"><span>캐릭터</span><select name="characterKey" defaultValue={characterKey}><option value="">미지정</option>{(characters ?? []).map((character: any) => <option key={character.key} value={character.key}>{character.name_ko || character.key}</option>)}</select></label>
          <div className="form-field form-field-full">
            <span>이미지</span>
            <IllustrationImagesField
              illustrationId={item.id}
              primaryUrl={item.image_url}
            />
          </div>
          <label className="form-field form-field-full"><span>출처 URL</span><input name="sourceUrl" defaultValue={item.source_url ?? ""} /></label>
          <label className="form-field form-field-full"><span>메모 / 설명</span><textarea name="summary" rows={4} defaultValue={item.summary ?? ""} /></label>
          <label className="admin-visual-publish-check form-field-full"><input name="isPublished" type="checkbox" defaultChecked={item.is_published} /><span>공개 상태</span></label>
        </div>
        {item.image_url ? <div className="admin-visual-edit-preview"><img src={item.image_url} alt={item.title} /></div> : null}
        <div className="admin-visual-form-actions"><Link href="/admin/cards?type=illustration" className="nav-link">취소</Link><button type="submit" className="primary-button">수정 저장</button></div>
      </form>
    </main>
  );
}
