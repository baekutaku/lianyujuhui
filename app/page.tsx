import Link from "next/link";

const heroImages = [
  "https://lianyujuhui.ivyro.net/data/file/pic/3553024586_ojVXpgCP_4d95c7745a8dc657d729f07a2e87839e4bd16757.jpg",
  "https://lianyujuhui.ivyro.net/data/file/pic/3553024586_cY85vLGD_92725175f100fb07e6de1c870635c59e337d93b2.jpg",
  "https://lianyujuhui.ivyro.net/data/editor/2601/8fb0c6d84c29941dd6950c3779c934de_1768844981_1157.jpg",
];

const featuredCards = [
  {
    title: "카드 아카이브",
    desc: "카드 정보, 진화 전후 이미지, 관련 스토리와 휴대폰 컨텐츠 모아둠.",
    href: "/cards",
    image:
      "https://lianyujuhui.ivyro.net/data/editor/2601/8fb0c6d84c29941dd6950c3779c934de_1768861364_113.jpg",
    tags: ["카드 허브", "연결 콘텐츠"],
  },
  {
    title: "스토리 아카이브",
    desc: "KR 서버 · CN 스토리 아카이브",
    href: "/stories",
    image:
      "https://lianyujuhui.ivyro.net/data/file/pic/3553024586_D1Yzp3gw_5f6ccbfad4687c4bcc1da94e6b9b8c9dc96137a7.jpg",
    tags: ["Part1 Complete", "Part2 Partial"],
  },
  {
    title: "휴대폰 콘텐츠",
    desc: "모멘트, 문자, 통화, 기사 등 인게임 휴대폰 UI 기반으로 컨텐츠 아카이브.",
    href: "/phone-items",
    image:
      "https://lianyujuhui.ivyro.net/data/file/pic/3553024586_4jI1OwFt_c1bfd067b753f6773fbccb317527fb7a86a32491.jpg",
    tags: ["메시지", "모멘트", "통화"],
  },
  {
    title: "이벤트 / 외전",
    desc: "외전 1·2·3부와 시즌별 이벤트 아카이브.",
    href: "/events",
    image:
      "https://lianyujuhui.ivyro.net/data/editor/2601/8fb0c6d84c29941dd6950c3779c934de_1768862003_7378.jpg",
    tags: ["외전", "시즌 이벤트"],
  },
];

const archiveSections = [
  {
    eyebrow: "Main Story",
    title: "메인스토리",
    desc: "최신 스토리 중점으로 정렬.",
    href: "/stories",
    image:
      "https://lianyujuhui.ivyro.net/data/file/pic/3553024586_KnEkJWbu_3f4bbdfcd8c209095893cb968b0223c6e3204917.jpg",
    meta: ["최신 시즌 우선", "전체보기 연결"],
  },
  {
    eyebrow: "Side Story",
    title: "외전 아카이브",
    desc: "KR 서버 · CN 스토리 아카이브",
    href: "/stories",
    image:
      "https://lianyujuhui.ivyro.net/data/editor/2601/8fb0c6d84c29941dd6950c3779c934de_1768861712_5264.jpg",
    meta: ["3부 진행 중", "2부 백기 중심", "1부 전체 캐릭터"],
  },
  {
    eyebrow: "Baiqi Archive",
    title: "백기 스토리",
    desc: "백기 중점 아카이브",
    href: "/characters/baiqi",
    image:
      "https://lianyujuhui.ivyro.net/data/editor/2601/8fb0c6d84c29941dd6950c3779c934de_1768861720_5698.jpg",
    meta: ["카드 연동", "스토리 연결", "휴대폰 연결"],
  },
];

const statusItems = [
  {
    label: "KR 서버",
    value: "2023.01 종료 아카이브",
    sub: "1~2부 초중반 종료",
  },
  {
    label: "CN 서버",
    value: "운영 중",
    sub: "1~2부 초중반 종료, 3부 막 시작 시점",
  },
  {
    label: "기록 방식",
    value: "카드 ↔ 스토리 ↔ 휴대폰 연결",
    sub: "카드와 연결된 컨텐츠 유기적으로 아카이브(하려고 노력)",
  },
];

const quickLinks = [
  { href: "/cards", label: "카드", note: "진화 전후 / 관련 링크" },
  { href: "/stories", label: "스토리", note: "메인 / 외전 / 백기" },
  { href: "/phone-items", label: "휴대폰", note: "모멘트 / 문자 / 통화" },
  { href: "/events", label: "이벤트", note: "시즌 이벤트 / 외전" },
];

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <div className="home-chip-row">
            <span className="home-chip">KR</span>
            <span className="home-chip">CN</span>
            <span className="home-chip">Part1 Complete / Part2 Partial</span>
            <span className="home-chip">Baiqi Focus</span>
          </div>

          <h1 className="home-hero-title">연모고 동창회 / Baiqi Archive</h1>
          <p className="home-hero-desc">백기유연 CP 백업공간</p>

          <div className="home-hero-actions">
            <Link href="/stories" className="hero-primary-button">
              스토리 보기
            </Link>
            <Link href="/cards" className="hero-secondary-button">
              카드 보기
            </Link>
          </div>

          <div className="home-status-note">
            KR 서버는 2023년 1월 종료됨. 1부는 전 캐릭터 기준으로 완결되었고,
            2부는 중반까지만 진행되었으며 이후 콘텐츠는 일부 캐릭터, 특히 백기 중심으로 아카이브합니다.
          </div>
        </div>

        <div className="home-hero-visual">
          <div className="hero-collage hero-collage-main">
            <img src={heroImages[0]} alt="백기 대표 이미지" className="hero-collage-image" />
          </div>
          <div className="hero-collage hero-collage-sub hero-collage-top">
            <img src={heroImages[1]} alt="백기 아카이브 이미지" className="hero-collage-image" />
          </div>
          <div className="hero-collage hero-collage-sub hero-collage-bottom">
            <img src={heroImages[2]} alt="백기 카드 이미지" className="hero-collage-image" />
          </div>
        </div>
      </section>

      <section className="home-status-grid">
        {statusItems.map((item) => (
          <article key={item.label} className="home-status-card">
            <div className="home-status-label">{item.label}</div>
            <strong className="home-status-value">{item.value}</strong>
            <p className="home-status-sub">{item.sub}</p>
          </article>
        ))}
      </section>

      <section className="home-main-grid">
        <div className="home-main-column">
          <div className="home-section-heading">
            <div>
              <div className="page-eyebrow">Quick Entry</div>
              <h2 className="home-section-title">아카이브 바로가기</h2>
            </div>
          </div>

          <div className="home-featured-grid">
            {featuredCards.map((item) => (
              <Link key={item.title} href={item.href} className="home-featured-card">
                <div className="home-featured-media">
                  <img src={item.image} alt={item.title} className="home-featured-image" />
                  <div className="home-featured-overlay" />
                </div>
                <div className="home-featured-body">
                  <div className="home-chip-row">
                    {item.tags.map((tag) => (
                      <span key={tag} className="home-chip">{tag}</span>
                    ))}
                  </div>
                  <h3 className="home-featured-title">{item.title}</h3>
                  <p className="home-featured-desc">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <section className="home-archive-block">
            <div className="home-section-heading">
              <div>
                <div className="page-eyebrow">Archive Structure</div>
                <h2 className="home-section-title">기억 구조</h2>
              </div>
            </div>

            <div className="home-archive-list">
              {archiveSections.map((section) => (
                <Link href={section.href} key={section.title} className="home-archive-item">
                  <div className="home-archive-thumb">
                    <img src={section.image} alt={section.title} className="home-archive-thumb-image" />
                  </div>
                  <div className="home-archive-content">
                    <div className="page-eyebrow">{section.eyebrow}</div>
                    <h3 className="home-archive-title">{section.title}</h3>
                    <p className="home-archive-desc">{section.desc}</p>
                    <div className="home-chip-row">
                      {section.meta.map((item) => (
                        <span key={item} className="home-chip">{item}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="home-side-column">
          <section className="home-side-panel">
            <div className="page-eyebrow">Notice</div>
            <h2 className="home-side-title">아카이브 메모</h2>
            <ul className="home-note-list">
              <li>KR 콘텐츠는 2023년 1월 종료 시점 기준으로 고정된 기록입니다.</li>
              <li>1부는 5명 전반 자료가 존재하지만 2부 이후부터는 선택적·백기 중심으로 편중됩니다.</li>
              <li>CN 콘텐츠는 현재 진행 중이며 최신 카드/스토리 업데이트는 백기 비중이 높습니다.</li>
            </ul>
          </section>

          <section className="home-side-panel home-side-panel-soft">
            <div className="page-eyebrow">Navigation</div>
            <h2 className="home-side-title">빠른 이동</h2>
            <div className="home-side-links">
              {quickLinks.map((item) => (
                <Link key={item.label} href={item.href} className="home-side-link">
                  <strong>{item.label}</strong>
                  <span>{item.note}</span>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}