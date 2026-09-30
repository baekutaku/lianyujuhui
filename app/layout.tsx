import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { isAdmin } from "@/lib/utils/admin-auth";
import FloatingMobileMenu from "@/components/FloatingMobileMenu";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { adminLogout } from "@/app/admin/auth-actions";
import GlobalMusicProvider from "@/components/music/GlobalMusicProvider";

import "./globals.css";
import "./styles/layout.css";
import "./styles/home.css";
import "./styles/story-cards.css";
import "./styles/phone.css";
import "./styles/theme-final.css";

export const metadata: Metadata = {
  title: "연모고 동창회 / Baiqi Archive",
  description: "Love and Producer Baiqi archive · KR / CN",
};

const primaryNav = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/stories", label: "스토리", icon: "menu_book" },
  { href: "/cards", label: "카드", icon: "style" },
  { href: "/phone-items", label: "휴대폰", icon: "smartphone" },
  { href: "/maker", label: "커스텀", icon: "edit_square" },
] as const;

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isAdmin();

  return (
    <html lang="ko">
      <body>
        <GlobalMusicProvider>
          <div className="site-shell">
            <div className="memory-shell">
              <div className="memory-bg" aria-hidden="true">
                <span className="memory-orb orb-a" />
                <span className="memory-orb orb-b" />
                <span className="memory-orb orb-c" />
                <span className="memory-noise" />
              </div>

              <aside className="sidebar">
                <div className="sidebar-inner sidebar-inner-game">
                  <Link href="/" className="brand brand-game">
                    <span className="brand-mark material-symbols-rounded">favorite</span>
                    <span className="brand-copy">
                      <strong className="brand-title">연모고 동창회</strong>
                      <span className="brand-desc">BAIQI · LOVE AND PRODUCER</span>
                    </span>
                  </Link>

                  <div className="sidebar-archive-chip">
                    <span className="sidebar-archive-dot" />
                    <div>
                      <small>ARCHIVE MODE</small>
                      <strong>KR · CN</strong>
                    </div>
                  </div>

                  <nav className="sidebar-nav sidebar-nav-game" aria-label="주요 메뉴">
                    {primaryNav.map((item) => (
                      <Link key={item.href} href={item.href} className="nav-link nav-link-game">
                        <span className="material-symbols-rounded">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </nav>

                  {admin ? (
                    <nav className="sidebar-nav sidebar-admin-nav">
                      <span className="sidebar-nav-caption">ADMIN</span>
                      <Link href="/admin/updates" className="nav-link nav-link-game is-admin">
                        <span className="material-symbols-rounded">campaign</span>
                        <span>업데이트</span>
                      </Link>
                      <Link href="/characters" className="nav-link nav-link-game is-admin">
                        <span className="material-symbols-rounded">person</span>
                        <span>캐릭터</span>
                      </Link>
                      <Link href="/admin" className="nav-link nav-link-game is-admin">
                        <span className="material-symbols-rounded">settings</span>
                        <span>관리자</span>
                      </Link>
                    </nav>
                  ) : null}

                  <div className="sidebar-auth">
                    {!admin ? (
                      <Link href="/admin/login" className="secondary-button sidebar-auth-button">
                        로그인
                      </Link>
                    ) : (
                      <form action={adminLogout}>
                        <button type="submit" className="secondary-button sidebar-auth-button">
                          로그아웃
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </aside>

              <main className="content-area">
                <div className="content-inner memory-content">{children}</div>
              </main>
            </div>
          </div>

          <FloatingMobileMenu />
          <ScrollToTopButton />
        </GlobalMusicProvider>
        <Analytics />
      </body>
    </html>
  );
}
