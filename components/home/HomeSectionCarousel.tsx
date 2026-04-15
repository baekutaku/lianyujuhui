"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type HomeCard = {
  id: string;
  title: string;
  href: string;
  thumb: string;
  meta: string;
};

type Props = {
  title: string;
  href: string;
  items: HomeCard[];
};

function getCardsPerView(width: number) {
  if (width <= 520) return 1;
  if (width <= 900) return 2;
  return 3;
}

export default function HomeSectionCarousel({ title, href, items }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);

  const maxIndex = useMemo(() => {
    return Math.max(0, items.length - cardsPerView);
  }, [items.length, cardsPerView]);

  useEffect(() => {
    const handleResize = () => {
      const next = getCardsPerView(window.innerWidth);
      setCardsPerView(next);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (index > maxIndex) {
      setIndex(0);
    }
  }, [index, maxIndex]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const target = track.children[index] as HTMLElement | undefined;
    if (!target) return;

    track.scrollTo({
      left: target.offsetLeft,
      behavior: "smooth",
    });
  }, [index, cardsPerView]);

  useEffect(() => {
    if (items.length <= cardsPerView) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3200);

    return () => window.clearInterval(timer);
  }, [items.length, cardsPerView, maxIndex]);

  const movePrev = () => {
    setIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const moveNext = () => {
    setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

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
        <div className="home-carousel-shell">
          <div ref={trackRef} className="home-carousel-track">
            {items.map((item) => (
              <Link key={item.id} href={item.href} className="home-mixed-card home-carousel-card">
                <div className="home-mixed-thumb">
                  {item.thumb ? (
                    <img src={item.thumb} alt={item.title} />
                  ) : (
                    <div className="home-mixed-thumb-fallback" />
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