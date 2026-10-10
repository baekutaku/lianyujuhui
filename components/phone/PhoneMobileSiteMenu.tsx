"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

const SITE_ITEMS = [
  { href: "/", label: "홈", sub: "사이트 홈" },
  { href: "/stories", label: "스토리", sub: "스토리 아카이브" },
  { href: "/cards", label: "카드", sub: "카드 아카이브" },
  { href: "/events", label: "이벤트", sub: "이벤트 아카이브" },
] as const;

export default function PhoneMobileSiteMenu() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="phone-mobile-site-menu-trigger"
        onClick={() => setOpen(true)}
        aria-label="사이트 메뉴"
        title="사이트 메뉴"
      >
        <span className="material-symbols-rounded" aria-hidden="true">
          language
        </span>
        <span className="phone-mobile-site-menu-trigger-label">SITE</span>
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="phone-mobile-site-menu-root"
              role="presentation"
            >
              <button
                type="button"
                className="phone-mobile-site-menu-backdrop"
                aria-label="사이트 메뉴 닫기"
                onClick={() => setOpen(false)}
              />

              <section
                className="phone-mobile-site-menu-sheet"
                role="dialog"
                aria-modal="true"
                aria-label="사이트 메뉴"
              >
                <header className="phone-mobile-site-menu-head">
                  <div>
                    <small>SITE NAVIGATION</small>
                    <strong>사이트 메뉴</strong>
                  </div>

                  <button
                    type="button"
                    className="phone-mobile-site-menu-close"
                    onClick={() => setOpen(false)}
                    aria-label="닫기"
                  >
                    <span className="material-symbols-rounded" aria-hidden="true">
                      close
                    </span>
                  </button>
                </header>

                <nav className="phone-mobile-site-menu-list">
                  {SITE_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="phone-mobile-site-menu-link"
                      onClick={() => setOpen(false)}
                    >
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.sub}</small>
                      </span>
                      <span
                        className="material-symbols-rounded"
                        aria-hidden="true"
                      >
                        chevron_right
                      </span>
                    </Link>
                  ))}
                </nav>

                <button
                  type="button"
                  className="phone-mobile-site-menu-stay"
                  onClick={() => setOpen(false)}
                >
                  휴대폰 계속 보기
                </button>
              </section>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
