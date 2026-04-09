import Link from "next/link";

export default function Home() {
  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Archive Hub</div>
        <h1 className="page-title">연모고 동창회</h1>
        <p className="page-desc">
카드, 스토리, 휴대폰 콘텐츠, 이벤트를 한 흐름 안에서 정리하는
          아카이브 허브입니다.
        </p>
      </header>

      <section className="quick-grid">
        <Link href="/cards" className="quick-card">
          <span className="quick-card-label">Destiny</span>
          <h2 className="quick-card-title">카드</h2>
          <p className="quick-card-text">
            카드 등급, 속성, 진화 전후 이미지와 연결 콘텐츠를 함께 확인합니다.
          </p>
        </Link>

        <Link href="/stories" className="quick-card">
          <span className="quick-card-label">Date / Story</span>
          <h2 className="quick-card-title">데이트 · 스토리</h2>
          <p className="quick-card-text">
            카드 스토리, 메인스토리, 외전, 너의 곁에, 회사 프로젝트 등을 모아봅니다.
          </p>
        </Link>

        <Link href="/phone-items" className="quick-card">
          <span className="quick-card-label">Phone</span>
          <h2 className="quick-card-title">휴대폰</h2>
          <p className="quick-card-text">
            메시지, 모멘트, 음성, 핫이슈, 전화/영상통화처럼 인게임 휴대폰 축을 정리합니다.
          </p>
        </Link>

        <Link href="/events" className="quick-card">
          <span className="quick-card-label">Event</span>
          <h2 className="quick-card-title">이벤트</h2>
          <p className="quick-card-text">
            기간 이벤트, PV, 배너, 굿즈, 관련 자료까지 한 흐름으로 정리합니다.
          </p>
        </Link>
      </section>
    </main>
  );
}