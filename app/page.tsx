import Link from "next/link";
import HomeMixedBody from "@/components/home/HomeMixedBody";

const heroImages = [
  "https://lianyujuhui.ivyro.net/data/file/pic/3553024586_ojVXpgCP_4d95c7745a8dc657d729f07a2e87839e4bd16757.jpg",
  "https://lianyujuhui.ivyro.net/data/file/pic/3553024586_cY85vLGD_92725175f100fb07e6de1c870635c59e337d93b2.jpg",
  "https://lianyujuhui.ivyro.net/data/editor/2601/8fb0c6d84c29941dd6950c3779c934de_1768844981_1157.jpg",
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

          <h1 className="home-hero-title">연모고 동창회</h1>
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

      <HomeMixedBody />
    </main>
  );
}