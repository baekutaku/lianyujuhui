"use client";

import Link from "next/link";
import { useState } from "react";

const MENU_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/cards", label: "카드" },
  { href: "/stories", label: "데이트·스토리" },
  { href: "/phone-items", label: "휴대폰" },
  { href: "/events", label: "이벤트" },
  { href: "/admin", label: "관리자" },
];

export default function FloatingMobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="mobile-fab-menu"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
      >
        ☰
      </button>

      {open ? (
        <div className="mobile-menu-backdrop" onClick={() => setOpen(false)}>
          <div
            className="mobile-menu-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-menu-head">
              <strong>메뉴</strong>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setOpen(false)}
              >
                닫기
              </button>
            </div>

            <nav className="mobile-menu-list">
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="mobile-menu-link"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}