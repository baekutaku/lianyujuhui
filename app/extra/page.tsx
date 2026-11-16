import Link from "next/link";

const EXTRA_CATEGORIES = [
  {
    key: "pv",
    title: "PV / 공식 영상",
    href: "/extra/pv",
    kicker: "PROMOTION VIDEO",
    description:
      "공식 PV, 티저, 이벤트 영상과 관련 이미지를 정리합니다.",
    meta: "CN · KR · 이미지",
  },
  {
    key: "mail",
    title: "우편",
    href: "/extra/mail",
    kicker: "MAIL",
    description:
      "게임 내 우편을 날짜와 원문 중심으로 정리합니다.",
    meta: "원문 · 번역 · 연도별",
  },
  {
    key: "touch-room",
    title: "터치룸 음성",
    href: "/extra/touch-room",
    kicker: "VOICE",
    description:
      "去见他 터치 음성을 상황과 시즌별로 정리합니다.",
    meta: "일상 · 의상 · 명절 · 생일",
  },
];

export default function ExtraPage() {
  return (
    <main className="extra-page">
      <header className="extra-hero">
        <p className="page-eyebrow">ARCHIVE / EXTRA</p>
        <h1 className="extra-title">기타</h1>
        <p className="extra-description">
          스토리·카드·휴대폰과 별도로 분류되는
          게임 내 자료를 모아둡니다.
        </p>
      </header>

      <nav
        className="extra-category-grid"
        aria-label="기타 카테고리"
      >
        {EXTRA_CATEGORIES.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="extra-category-card"
          >
            <span className="extra-category-kicker">
              {item.kicker}
            </span>

            <strong className="extra-category-title">
              {item.title}
            </strong>

            <span className="extra-category-description">
              {item.description}
            </span>

            <span className="extra-category-meta">
              {item.meta}
            </span>

            <span className="extra-category-arrow">
              보기 →
            </span>
          </Link>
        ))}
      </nav>
    

      <section className="extra-hundred-days-entry-wrap">
        <Link
          href="/extra/hundred-days"
          className="extra-hundred-days-entry-card"
        >
          <div className="extra-hundred-days-entry-icon">
            <span className="material-symbols-rounded">
              history_edu
            </span>
          </div>

          <div className="extra-hundred-days-entry-copy">
            <span className="extra-hundred-days-entry-kicker">
              HUNDRED DAYS
            </span>

            <strong>
              백일동반
            </strong>

            <p>
              사전 이야기와 DAY 0~100,
              음성 및 특별 기록을 연도별로 정리합니다.
            </p>

            <span className="extra-hundred-days-entry-meta">
              연도별 · 캐릭터별 아카이브
            </span>
          </div>

          <span className="material-symbols-rounded extra-hundred-days-entry-arrow">
            arrow_forward
          </span>
        </Link>
      </section>
</main>
  );
}

