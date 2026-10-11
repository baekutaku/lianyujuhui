import IllustrationImagesField from "@/components/admin/illustrations/IllustrationImagesField";
import Link from "next/link";
import { supabase } from "@/lib/supabase/server";
import { createIllustration } from "@/app/admin/illustrations/actions";

import AdminVisualTypeSelector from "@/components/admin/cards/AdminVisualTypeSelector";
export default async function NewIllustrationPage() {
  const [{ data: servers }, { data: characters }] = await Promise.all([
    supabase.from("servers").select("key, name").order("key"),
    supabase.from("characters").select("key, name_ko").order("sort_order", { ascending: true }),
  ]);
  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Visual Archive</div>
        <h1 className="page-title">카드 외 일러스트 등록</h1>
        <p className="page-desc">카드가 아닌 공식 일러스트를 원본 비율 그대로 아카이브합니다.</p>
      </header>

      <AdminVisualTypeSelector />

      <form action={createIllustration} className="form-panel">
        <div className="form-grid">
          <label className="form-field form-field-full"><span>제목</span><input name="title" required /></label>
          <label className="form-field"><span>발매년도 / 공개년도</span><input name="releaseYear" type="number" defaultValue={new Date().getFullYear()} /></label>
          <label className="form-field"><span>발매일 / 공개일</span><input name="releaseDate" type="date" /></label>
          <label className="form-field"><span>서버</span><select name="serverKey" defaultValue="cn"><option value="">미지정</option>{(servers ?? []).map((server: any) => <option key={server.key} value={server.key}>{server.key?.toUpperCase() || server.name}</option>)}</select></label>
          <label className="form-field"><span>캐릭터</span><select name="characterKey" defaultValue="baiqi"><option value="">미지정</option>{(characters ?? []).map((character: any) => <option key={character.key} value={character.key}>{character.name_ko || character.key}</option>)}</select></label>
          <div className="form-field form-field-full">
            <span>이미지</span>
            <IllustrationImagesField />
          </div>
          <label className="form-field form-field-full"><span>출처 URL</span><input name="sourceUrl" placeholder="https://..." /></label>
          <label className="form-field form-field-full"><span>메모 / 설명</span><textarea name="summary" rows={4} placeholder="필요할 때만 간단히 기록" /></label>
          <label className="admin-visual-publish-check form-field-full"><input name="isPublished" type="checkbox" defaultChecked /><span>공개 상태로 등록</span></label>
        </div>
        <div className="admin-visual-form-actions"><Link href="/admin/cards" className="nav-link">취소</Link><button type="submit" className="primary-button">일러스트 저장</button></div>
      </form>
    </main>
  );
}
