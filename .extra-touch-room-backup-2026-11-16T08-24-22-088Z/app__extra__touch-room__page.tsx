import Link from "next/link";

export default function Page() {
  return (
    <main className="extra-page">
      <header className="extra-sub-header">
        <div>
          <p className="page-eyebrow">
            EXTRA / TOUCH ROOM
          </p>

          <h1 className="extra-title">
            터치룸 음성
          </h1>

          <p className="extra-description">
            去见他 음성을 상황·시즌·캐릭터별로 정리합니다.
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
          터치룸 음성 아카이브 준비 중
        </strong>

        <p>
          일상, 의상, 액세서리, 업무, 학습, 수면, 단어 암기, 명절, 생리 기간, 유저 생일로 나눌 예정입니다.
        </p>
      </section>
    </main>
  );
}
