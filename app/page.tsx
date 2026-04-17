import Link from "next/link";
import HomeMixedBody from "@/components/home/HomeMixedBody";

const heroImages = [
  "https://lianyujuhui.ivyro.net/data/file/pic/3553024586_ojVXpgCP_4d95c7745a8dc657d729f07a2e87839e4bd16757.jpg",
  "https://lianyujuhui.ivyro.net/data/file/pic/3553024586_cY85vLGD_92725175f100fb07e6de1c870635c59e337d93b2.jpg",
  "https://lianyujuhui.ivyro.net/data/editor/2601/8fb0c6d84c29941dd6950c3779c934de_1768844981_1157.jpg",
];

const shortcutItems = [
  {
    id: "cards",
    href: "/cards",
    title: "카드 아카이브",
    desc: "SSR · SP · 한정 카드와 관련 서사 정리",
    image: "/images/home/home-card-01.jpg",
    chips: ["카드", "연결서사"],
  },
  {
    id: "stories",
    href: "/stories",
    title: "스토리 아카이브",
    desc: "CN 위주 · KR 스토리 번역 및 백업",
    image: "/images/home/home-card-02.jpg",
    chips: ["kr(Part1~2)", "cn(Part1~2+Part3~)"],
  },
  {
    id: "phone-items",
    href: "/phone-items",
    title: "휴대폰 아카이브",
    desc: "문자 · 모멘트 · 통화 기록 정리",
    image: "/images/home/home-card-03.jpg",
    chips: ["문자", "모멘트", "통화"],
  },
  {
    id: "events",
    href: "/stories?tab=event",
    title: "이벤트 아카이브",
    desc: "기간 한정 이벤트와 관련 자료 모음",
    image: "/images/home/home-card-04.jpg",
    chips: ["이벤트", "백업"],
  },
  {
    id: "pv",
    href: "/stories?tab=event",
    title: "PV 아카이브",
    desc: "프로모션 영상 및 PV 정리",
    image: "/images/home/home-card-05.jpg",
    chips: ["PV", "영상"],
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
      <span className="home-chip">Part1~3</span>
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
      KR은 2022년 몽심호 복각 이벤트 이후로 접어서 없는 컨텐츠도 존재.<br />
      CN은 현재 진행 중. 자료 없는 건 아직 미업로드거나 미번역입니다.<br />
      백기 중심 아카이브 공간, PC 전용입니다. css는 임시 설정입니다.
    </div>
  </div>

  <div className="home-hero-visual" aria-hidden="true">
    <div className="hero-collage hero-collage-main">
      <img
        src={heroImages[0]}
        alt=""
        className="hero-collage-image"
      />
    </div>

    <div className="hero-collage hero-collage-top">
      <img
        src={heroImages[1]}
        alt=""
        className="hero-collage-image"
      />
    </div>

    <div className="hero-collage hero-collage-bottom">
      <img
        src={heroImages[2]}
        alt=""
        className="hero-collage-image"
      />
    </div>
  </div>
</section>
      <section className="home-shortcut-list">
        {shortcutItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="home-shortcut-item"
          >
            <div className="home-shortcut-media">
              <img
                src={item.image}
                alt={item.title}
                className="home-shortcut-image"
              />
              <div className="home-shortcut-overlay" />

              <div className="home-shortcut-body">
                <div className="home-chip-row home-shortcut-chip-row">
                  {item.chips.map((chip) => (
                    <span key={`${item.id}-${chip}`} className="home-chip">
                      {chip}
                    </span>
                  ))}
                </div>

                <h2 className="home-shortcut-title">{item.title}</h2>
                <p className="home-shortcut-desc">{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <HomeMixedBody />
    </main>
  );
}