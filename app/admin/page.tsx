import Link from "next/link";
import { adminLogout } from "@/app/admin/auth-actions";

export default function AdminPage() {
  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin</div>
        <h1 className="page-title">관리자 페이지</h1>
        <p className="page-desc">
          카드, 스토리, 번역, 연결 데이터를 등록하고 수정하는 관리자 허브입니다.
        </p>
      </header>

      <form action={adminLogout} style={{ marginBottom: "24px" }}>
        <button type="submit" className="primary-button">
          로그아웃
        </button>
      </form>

      <section className="quick-grid">
        <Link href="/admin/cards" className="quick-card">
          <span className="quick-card-label">Cards</span>
          <h2 className="quick-card-title">카드 관리</h2>
          <p className="quick-card-text">
            카드 목록 확인, 새 카드 등록, 카드 수정
          </p>
        </Link>

        <Link href="/admin/stories" className="quick-card">
          <span className="quick-card-label">Stories</span>
          <h2 className="quick-card-title">스토리 관리</h2>
          <p className="quick-card-text">
            스토리 목록 확인, 새 스토리 등록, 스토리 수정
          </p>
        </Link>

        <Link href="/admin/translations" className="quick-card">
          <span className="quick-card-label">Translations</span>
          <h2 className="quick-card-title">번역 관리</h2>
          <p className="quick-card-text">
            번역 목록 확인, 새 번역 등록
          </p>
        </Link>

        <Link href="/admin/relations" className="quick-card">
          <span className="quick-card-label">Relations</span>
          <h2 className="quick-card-title">연결 관리</h2>
          <p className="quick-card-text">
            카드와 스토리 연결 확인, 새 연결 등록
          </p>
        </Link>
      </section>
    </main>
  );
}
