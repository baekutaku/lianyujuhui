import Link from "next/link";

export default function Page() {
  return (
    <main className="extra-page">
      <header className="extra-sub-header">
        <div>
          <p className="page-eyebrow">
            EXTRA / MAIL
          </p>

          <h1 className="extra-title">
            우편
          </h1>

          <p className="extra-description">
            게임 내 우편과 기념일 편지, 첨부 선물을 정리합니다.
          </p>
        </div>

        <Link
          href="/extra"
          className="extra-back-link"
        >
          ← 기타
        </Link>
      </header>

      <section className="extra-empty-panel">
        <span className="extra-empty-icon">
          archive
        </span>

        <strong>
          우편 아카이브 준비 중
        </strong>

        <p>
          한 통을 하나의 게시물로 저장하고 이미지가 없는 우편도 등록할 수 있게 만들 예정입니다.
        </p>
      </section>
    </main>
  );
}
