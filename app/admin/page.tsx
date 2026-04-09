import Link from "next/link";

export default function AdminPage() {
  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin</div>
        <h1 className="page-title">관리자 페이지</h1>
        <p className="page-desc">
          카드, 스토리, 휴대폰 콘텐츠, 이벤트, 연결 데이터를 등록하고 수정하는 관리자 허브입니다.
        </p>
      </header>

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

        <Link href="/admin/phone-items" className="quick-card">
          <span className="quick-card-label">Phone</span>
          <h2 className="quick-card-title">휴대폰 관리</h2>
          <p className="quick-card-text">
            메시지, 모멘트, 전화, 영상통화, 기사 메타와 연결 구조를 관리합니다.
          </p>
        </Link>

        <Link href="/admin/events" className="quick-card">
          <span className="quick-card-label">Events</span>
          <h2 className="quick-card-title">이벤트 관리</h2>
          <p className="quick-card-text">
            이벤트 목록 확인, 새 이벤트 등록, 이벤트 수정
          </p>
        </Link>

        <Link href="/admin/relations" className="quick-card">
          <span className="quick-card-label">Relations</span>
          <h2 className="quick-card-title">연결 관리</h2>
          <p className="quick-card-text">
            카드, 스토리, 휴대폰, 이벤트 사이의 연결 관계를 보조적으로 관리합니다.
          </p>
        </Link>

        <Link href="/admin/translations" className="quick-card">
          <span className="quick-card-label">Translations</span>
          <h2 className="quick-card-title">번역 관리</h2>
          <p className="quick-card-text">
            번역문 목록을 확인하고 필요한 번역 데이터를 추가합니다.
          </p>
        </Link>
      </section>
    </main>
  );
}