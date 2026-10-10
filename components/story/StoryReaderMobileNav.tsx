"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ConnectionItem = {
  title: string;
  href: string;
};

type ConnectionGroup = {
  label: string;
  items: ConnectionItem[];
};

type Props = {
  title: string;
  listHref: string;
  groups: ConnectionGroup[];
};

export default function StoryReaderMobileNav({
  title,
  listHref,
  groups,
}: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const total = useMemo(
    () => groups.reduce((sum, group) => sum + group.items.length, 0),
    [groups]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 180);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <div
        className={`story-reader-mobile-nav${scrolled ? " is-visible" : ""}`}
        aria-hidden={!scrolled}
      >
        <Link
          href={listHref}
          className="story-reader-mobile-back"
          aria-label="스토리 목록"
        >
          ←
        </Link>

        <div className="story-reader-mobile-title" title={title}>
          {title}
        </div>

        {total > 0 ? (
          <button
            type="button"
            className="story-reader-mobile-connections"
            onClick={() => setOpen(true)}
          >
            연결 {total}
          </button>
        ) : (
          <span className="story-reader-mobile-connections is-empty">
            연결 0
          </span>
        )}
      </div>

      {open ? (
        <div className="story-reader-sheet-layer">
          <button
            type="button"
            className="story-reader-sheet-backdrop"
            aria-label="연결 콘텐츠 닫기"
            onClick={() => setOpen(false)}
          />

          <section
            className="story-reader-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="연결 콘텐츠"
          >
            <div className="story-reader-sheet-handle" />

            <div className="story-reader-sheet-head">
              <div>
                <p className="story-reader-sheet-eyebrow">RELATED CONTENT</p>
                <h2>연결 콘텐츠</h2>
              </div>

              <button
                type="button"
                className="story-reader-sheet-close"
                onClick={() => setOpen(false)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <div className="story-reader-sheet-scroll">
              {groups
                .filter((group) => group.items.length > 0)
                .map((group) => (
                  <section
                    key={group.label}
                    className="story-reader-sheet-group"
                  >
                    <div className="story-reader-sheet-group-head">
                      <strong>{group.label}</strong>
                      <span>{group.items.length}</span>
                    </div>

                    <div className="story-reader-sheet-links">
                      {group.items.map((item) => (
                        <Link
                          key={`${group.label}-${item.href}-${item.title}`}
                          href={item.href}
                          className="story-reader-sheet-link"
                          onClick={() => setOpen(false)}
                        >
                          <span>{item.title}</span>
                          <span aria-hidden="true">→</span>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
