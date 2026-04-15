import Link from "next/link";
import HomeMixedBody from "@/components/home/HomeMixedBody";

const heroImages = [
  "https://lianyujuhui.ivyro.net/data/file/pic/3553024586_ojVXpgCP_4d95c7745a8dc657d729f07a2e87839e4bd16757.jpg",
  "https://lianyujuhui.ivyro.net/data/file/pic/3553024586_cY85vLGD_92725175f100fb07e6de1c870635c59e337d93b2.jpg",
  "https://lianyujuhui.ivyro.net/data/editor/2601/8fb0c6d84c29941dd6950c3779c934de_1768844981_1157.jpg",
];

const shortcutItems = [
  {
    href: "/cards",
    title: "카드 아카이브",
    desc: "SSR · SP · 한정 카드와 관련 서사 정리",
    image:
      "https://lianyujuhui.ivyro.net/data/file/pic/3553024586_ojVXpgCP_4d95c7745a8dc657d729f07a2e87839e4bd16757.jpg",
    chips: ["카드", "연결서사"],
  },
  {
    href: "/stories",
    title: "스토리 아카이브",
    desc: "KR 위주 · CN 스토리 번역 및 백업",
    image:
      "https://lianyujuhui.ivyro.net/data/file/pic/3553024586_cY85vLGD_92725175f100fb07e6de1c870635c59e337d93b2.jpg",
    chips: ["Part1 Complete", "Part2 Partial"],
  },
  {
    href: "/phone-items",
    title: "휴대폰 아카이브",
    desc: "문자 · 모멘트 · 통화 기록 정리",
    image:
      "https://lianyujuhui.ivyro.net/data/editor/2601/8fb0c6d84c29941dd6950c3779c934de_1768844981_1157.jpg",
    chips: ["문자", "모멘트", "통화"],
  },
  {
    href: "/events",
    title: "이벤트 아카이브",
    desc: "기간 한정 이벤트와 관련 자료 모음",
    image:
      "https://lianyujuhui.ivyro.net/data/file/pic/3553024586_cY85vLGD_92725175f100fb07e6de1c870635c59e337d93b2.jpg",
    chips: ["이벤트", "백업"],
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
            KR 서버는 2023년 1월 업데이트 종료. 1부는 37시즌으로 완결되었고,
            2부는 KR 서버는 중반까지만 진행되었으며 이후 콘텐츠는 일부 캐릭터, 특히 백기 중심으로 아카이브합니다.
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

     <section className="home-featured-grid home-shortcut-grid">
  {shortcutItems.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      className="home-featured-card home-shortcut-card"
    >
      <div className="home-featured-media">
        <img
          src={item.image}
          alt={item.title}
          className="home-featured-image"
        />
        <div className="home-featured-overlay home-shortcut-overlay" />
      </div>

      <div className="home-featured-body home-shortcut-body">
        <div className="home-chip-row">
          {item.chips.map((chip) => (
            <span key={chip} className="home-chip">
              {chip}
            </span>
          ))}
        </div>

        <h2 className="home-featured-title">{item.title}</h2>
        <p className="home-featured-desc">{item.desc}</p>
      </div>
    </Link>
  ))}
</section>

      <HomeMixedBody />
    </main>
  );
}