"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU_ITEMS = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/stories", label: "스토리", icon: "menu_book" },
  { href: "/cards", label: "카드", icon: "style" },
  { href: "/phone-items", label: "휴대폰", icon: "smartphone" },
  { href: "/maker", label: "커스텀", icon: "edit_square" },
] as const;

export default function FloatingMobileMenu() {
  const pathname = usePathname();

  // 휴대폰 아카이브 안에서는 게임의 휴대폰 탭바가 자체 네비게이션 역할을 한다.
  // 전역 모바일 네비게이션까지 동시에 띄우면 두 개의 하단바가 겹치므로 숨긴다.
  if (pathname.startsWith("/phone-items")) {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="모바일 주요 메뉴">
      {MENU_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-bottom-link${active ? " is-active" : ""}`}
          >
            <span className="mobile-bottom-icon material-symbols-rounded">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
