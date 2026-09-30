"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import HomeGuideButton from "@/components/home/HomeGuideButton";
import HomeUpdateButton from "@/components/home/HomeUpdateButton";

type SiteUpdate = {
  id: string;
  title: string;
  body: string;
  category: string | null;
  target_area: string | null;
  is_pinned: boolean | null;
  published_at: string | null;
};

type MainStoryPreview = {
  title: string;
  href: string;
  meta?: string;
};

type FeaturedEvent = {
  id: string;
  title: string;
  href: string;
  thumb?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  summary?: string | null;
};

type HomeLobbyProps = {
  heroImage: string;
  updates: SiteUpdate[];
  mainStory?: MainStoryPreview | null;
  featuredEvent?: FeaturedEvent | null;
};

type LobbyShortcut = {
  id: string;
  label: string;
  sub: string;
  icon: string;
  href: string;
};

const leftRail: LobbyShortcut[] = [
  {
    id: "meet",
    label: "백기",
    sub: "그를 만나러 가기",
    icon: "favorite",
    href: "/characters/baiqi",
  },
  {
    id: "phone",
    label: "휴대폰",
    sub: "문자 · 모멘트 · 통화",
    icon: "smartphone",
    href: "/phone-items",
  },
  {
    id: "cards",
    label: "카드",
    sub: "나의 인연",
    icon: "style",
    href: "/cards",
  },
];

const rightRail: LobbyShortcut[] = [
  {
    id: "memorial",
    label: "기념",
    sub: "이벤트 · 기념일",
    icon: "auto_awesome",
    href: "/stories?tab=event",
  },
  {
    id: "records",
    label: "기록",
    sub: "아카이브",
    icon: "collections_bookmark",
    href: "#archive-stream",
  },
  {
    id: "event",
    label: "이벤트",
    sub: "진행 · 과거 이벤트",
    icon: "celebration",
    href: "/events",
  },
];

const bottomDock = [
  { label: "회사", sub: "Company", icon: "apartment", href: "/stories?tab=company" },
  { label: "마이홈", sub: "Home", icon: "home", href: "/stories?tab=myhome" },
  { label: "촬영", sub: "Studio", icon: "movie", href: "/stories?tab=company" },
  { label: "데이트", sub: "Date", icon: "favorite", href: "/stories?tab=card" },
] as const;

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatEventRange(event?: FeaturedEvent | null) {
  if (!event) return "";
  if (event.startDate && event.endDate) return `${event.startDate} ~ ${event.endDate}`;
  return event.startDate || event.endDate || "";
}

export default function HomeLobby({
  heroImage,
  updates,
  mainStory,
  featuredEvent,
}: HomeLobbyProps) {
  const [entered, setEntered] = useState(false);
  const [ready, setReady] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [hideToday, setHideToday] = useState(false);

  const eventStorageKey = useMemo(
    () => (featuredEvent ? `lianyujuhui-home-event:${featuredEvent.id}` : ""),
    [featuredEvent]
  );

  useEffect(() => {
    const hasEntered = window.sessionStorage.getItem("lianyujuhui-home-entered") === "1";
    setEntered(hasEntered);
    setReady(true);
  }, []);

  function enterArchive() {
    window.sessionStorage.setItem("lianyujuhui-home-entered", "1");
    setEntered(true);

    if (featuredEvent && eventStorageKey) {
      const hiddenDate = window.localStorage.getItem(eventStorageKey);
      if (hiddenDate !== todayKey()) setEventOpen(true);
    }
  }

  function closeEvent() {
    if (hideToday && eventStorageKey) {
      window.localStorage.setItem(eventStorageKey, todayKey());
    }
    setEventOpen(false);
  }

  return (
    <section className="game-home" aria-label="연모고 동창회 홈">
      <div className="game-home-stage">
        <img className="game-home-bg" src={heroImage} alt="백기 홈 일러스트" />
        <div className="game-home-tone" aria-hidden="true" />
        <div className="game-home-grain" aria-hidden="true" />

        {!ready || !entered ? (
          <button
            type="button"
            className="game-start-screen"
            onClick={enterArchive}
            aria-label="아카이브 시작"
          >
            <span className="game-start-kicker">LOVE AND PRODUCER · BAIQI ARCHIVE</span>
            <strong>연모고 동창회</strong>
            <span className="game-start-touch">TOUCH TO START</span>
            <span className="game-start-note">백기 중심 KR · CN 아카이브</span>
          </button>
        ) : (
          <>
            <header className="game-home-topbar">
              <Link href="/characters/baiqi" className="game-profile-chip">
                <span className="game-profile-avatar">
                  <img src="/images/home/home-card-02.jpg" alt="백기" />
                </span>
                <span className="game-profile-copy">
                  <small>BAIQI ARCHIVE</small>
                  <strong>백기 · 白起</strong>
                </span>
              </Link>

              <div className="game-resource-bar" aria-label="아카이브 상태">
                <span><b>KR</b> 한국 서버</span>
                <span><b>CN</b> 중국 서버</span>
                <span><b>VIDEO</b> 영상</span>
                <span><b>TEXT</b> 텍스트</span>
              </div>

              <div className="game-home-tool-row">
                <HomeUpdateButton updates={updates} />
                <a href="#home-utilities" className="game-tool-circle" aria-label="방명록과 부가기능">
                  <span className="material-symbols-rounded">forum</span>
                </a>
              </div>
            </header>

            <div className="game-home-promo" aria-label="사이트 안내">
              <HomeGuideButton />
            </div>

            <nav className="game-rail game-rail-left" aria-label="백기 콘텐츠 바로가기">
              {leftRail.map((item) => (
                <Link key={item.id} href={item.href} className="game-rail-item">
                  <span className="game-rail-icon material-symbols-rounded">{item.icon}</span>
                  <span className="game-rail-copy">
                    <strong>{item.label}</strong>
                    <small>{item.sub}</small>
                  </span>
                </Link>
              ))}
            </nav>

            <nav className="game-rail game-rail-right" aria-label="기록과 이벤트 바로가기">
              {rightRail.map((item) => (
                <Link key={item.id} href={item.href} className="game-rail-item is-right">
                  <span className="game-rail-icon material-symbols-rounded">{item.icon}</span>
                  <span className="game-rail-copy">
                    <strong>{item.label}</strong>
                    <small>{item.sub}</small>
                  </span>
                </Link>
              ))}
            </nav>

            <div className="game-home-character-mark">
              <small>LOVE AND PRODUCER · BAIQI ARCHIVE</small>
              <strong>백기</strong>
              <span>白起</span>
            </div>

            <div className="game-bottom-area">
              <nav className="game-bottom-dock" aria-label="인게임형 스토리 바로가기">
                {bottomDock.map((item) => (
                  <Link key={item.label} href={item.href} className="game-dock-item">
                    <span className="game-dock-icon material-symbols-rounded">{item.icon}</span>
                    <strong>{item.label}</strong>
                    <small>{item.sub}</small>
                  </Link>
                ))}
              </nav>

              <Link
                href={mainStory?.href ?? "/stories?tab=main"}
                className="game-main-start"
              >
                <span className="game-main-start-icon material-symbols-rounded">play_arrow</span>
                <span className="game-main-start-copy">
                  <small>MAIN STORY</small>
                  <strong>시작</strong>
                  <em>{mainStory?.title ?? "메인스토리"}</em>
                </span>
              </Link>
            </div>
          </>
        )}
      </div>

      {eventOpen && featuredEvent ? (
        <div className="game-event-backdrop" onClick={closeEvent}>
          <section
            className="game-event-modal"
            role="dialog"
            aria-modal="true"
            aria-label="현재 이벤트"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="game-event-close" onClick={closeEvent} aria-label="닫기">
              <span className="material-symbols-rounded">close</span>
            </button>

            <div className="game-event-heading">
              <small>CURRENT EVENT</small>
              <strong>현재 진행 중인 이벤트</strong>
            </div>

            <Link href={featuredEvent.href} className="game-event-banner" onClick={() => setEventOpen(false)}>
              {featuredEvent.thumb ? (
                <img src={featuredEvent.thumb} alt="" />
              ) : (
                <span className="game-event-banner-placeholder" aria-hidden="true" />
              )}
              <span className="game-event-banner-shade" aria-hidden="true" />
              <span className="game-event-banner-copy">
                <small>{formatEventRange(featuredEvent) || "EVENT ARCHIVE"}</small>
                <strong>{featuredEvent.title}</strong>
                {featuredEvent.summary ? <em>{featuredEvent.summary}</em> : null}
              </span>
              <span className="game-event-arrow material-symbols-rounded">arrow_forward_ios</span>
            </Link>

            <label className="game-event-hide-today">
              <input
                type="checkbox"
                checked={hideToday}
                onChange={(event) => setHideToday(event.target.checked)}
              />
              <span>오늘 다시 표시하지 않기</span>
            </label>
          </section>
        </div>
      ) : null}
    </section>
  );
}
