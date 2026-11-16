import Link from "next/link";

export default function Page() {
  return (
    <main className="extra-page">
      <header className="extra-sub-header">
        <div>
          <p className="page-eyebrow">
            EXTRA / PV
          </p>

          <h1 className="extra-title">
            PV / 공식 영상
          </h1>

          <p className="extra-description">
            공식 PV, 티저, 프로모션 영상과 관련 이미지를 정리합니다.
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
          PV / 공식 영상 아카이브 준비 중
        </strong>

        <p>
          다음 단계에서 CN / KR 영상, 번역, 복수 캐릭터, 다중 이미지와 관련 이벤트 연결을 추가합니다.
        </p>
      </section>
    </main>
  );
}
