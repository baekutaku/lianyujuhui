import Link from "next/link";

export default function Home() {
  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Sky Blue Archive Theme</div>
        <h1 className="page-title">연모고 동창회</h1>
        <p className="page-desc">
          백기 중심의 카드 스토리 번역, 이벤트 번역, KR/CN 아카이브를
          차분한 하늘빛 테마로 정리하는 공간입니다.
        </p>
      </header>

      <section className="quick-grid">
        <Link href="/stories" className="quick-card">
          <span className="quick-card-label">Stories</span>
          <h2 className="quick-card-title">스토리 아카이브</h2>
          <p className="quick-card-text">
            카드 스토리, 메인 스토리, 외전 등 번역 중심 콘텐츠를 모아봅니다.
          </p>
        </Link>

        <Link href="/cards" className="quick-card">
          <span className="quick-card-label">Cards</span>
          <h2 className="quick-card-title">카드 아카이브</h2>
          <p className="quick-card-text">
            카드 정보와 연결된 스토리를 함께 확인할 수 있는 정리 공간입니다.
          </p>
        </Link>

        <Link href="/events" className="quick-card">
          <span className="quick-card-label">Events</span>
          <h2 className="quick-card-title">이벤트 아카이브</h2>
          <p className="quick-card-text">
            이벤트 번역, PV, 관련 자료를 차차 정리해 나갈 예정입니다.
          </p>
        </Link>
      </section>
    </main>
  );
}
