"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type HomeCard = {
  id: string;
  title: string;
  href: string;
  thumb: string;
  meta: string;
  excerpt?: string;
};

type Props = {
  title: string;
  href: string;
  items: HomeCard[];
  autoMs?: number;
  transitionMs?: number;
};

function getCardsPerViewByShellWidth(width: number) {
  if (width <= 420) return 2;
  if (width <= 760) return 3;
  if (width <= 1040) return 4;
  return 5;
}

export default function HomeSectionCarousel({
  title,
  href,
  items,
  autoMs = 10000,
  transitionMs = 1200,
}: Props) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [cardsPerView, setCardsPerView] = useState(4);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);

  const maxIndex = useMemo(() => {
    return Math.max(0, items.length - cardsPerView);
  }, [items.length, cardsPerView]);

  useLayoutEffect(() => {
    const measure = () => {
      const shell = shellRef.current;
      const track = trackRef.current;
      if (!shell || !track) return;

      const shellWidth = shell.getBoundingClientRect().width;
      const nextCards = getCardsPerViewByShellWidth(shellWidth);
      setCardsPerView(nextCards);

      requestAnimationFrame(() => {
        const firstCard = track.querySelector<HTMLElement>(".home-carousel-card");
        if (!firstCard) return;

        const trackStyle = window.getComputedStyle(track);
        const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || "0");
        const cardWidth = firstCard.getBoundingClientRect().width;

        setStep(cardWidth + gap);
        setReady(true);
      });
    };

    measure();

    const ro = new ResizeObserver(() => {
      measure();
    });

    if (shellRef.current) ro.observe(shellRef.current);
    if (trackRef.current) ro.observe(trackRef.current);

    return () => ro.disconnect();
  }, [items.length]);

  useEffect(() => {
    if (index > maxIndex) {
      setIndex(0);
    }
  }, [index, maxIndex]);

  useEffect(() => {
    if (items.length <= cardsPerView || maxIndex <= 0) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, autoMs);

    return () => window.clearInterval(timer);
  }, [items.length, cardsPerView, maxIndex, autoMs]);

  const movePrev = () => {
    setIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const moveNext = () => {
    setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const translateX = step > 0 ? -(index * step) : 0;

  return (
    <section className="home-mixed-section">
      <div className="home-mixed-head">
        <div className="home-mixed-titlebar">{title}</div>

        <div className="home-mixed-head-actions">
          <button
            type="button"
            className="home-carousel-arrow"
            onClick={movePrev}
            aria-label={`${title} 이전`}
          >
            ‹
          </button>
          <button
            type="button"
            className="home-carousel-arrow"
            onClick={moveNext}
            aria-label={`${title} 다음`}
          >
            ›
          </button>
          <Link href={href} className="home-mixed-more">
            더 보기
          </Link>
        </div>
      </div>

      {items.length > 0 ? (
        <div
          ref={shellRef}
          className="home-carousel-shell"
          style={
            {
              "--cards-per-view": cardsPerView,
            } as React.CSSProperties
          }
        >
          <div
            ref={trackRef}
            className="home-carousel-track"
            style={{
              transform: `translate3d(${translateX}px, 0, 0)`,
              transition: ready
                ? `transform ${transitionMs}ms cubic-bezier(0.22, 0.61, 0.36, 1)`
                : "none",
            }}
          >
            {items.map((item) => (
              <Link key={item.id} href={item.href} className="home-carousel-card">
                <div className="home-mixed-thumb">
                  {item.thumb ? (
                    <img src={item.thumb} alt={item.title} />
                  ) : (
                    <div
                      className="home-mixed-thumb-fallback"
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                        padding: "10px",
                        background:
                          "linear-gradient(180deg, rgba(244,239,248,0.96) 0%, rgba(236,226,244,0.96) 100%)",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gap: "4px",
                          width: "100%",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: "11px",
                            lineHeight: 1.35,
                            fontWeight: 800,
                            color: "#5f5867",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.title}
                        </p>

                        {item.excerpt ? (
                          <p
                            style={{
                              margin: 0,
                              fontSize: "10px",
                              lineHeight: 1.45,
                              color: "#7f7787",
                              display: "-webkit-box",
                              WebkitLineClamp: 4,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {item.excerpt}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>

                <div className="home-mixed-body">
                  <p className="home-mixed-card-title">{item.title}</p>
                  {item.meta ? (
                    <p className="home-mixed-card-meta">{item.meta}</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="home-mixed-empty">표시할 항목이 없음</div>
      )}
    </section>
  );
}