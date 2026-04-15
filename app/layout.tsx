import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { isAdmin } from "@/lib/utils/admin-auth";
import FloatingMobileMenu from "@/components/FloatingMobileMenu";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { adminLogout } from "@/app/admin/auth-actions";

export const metadata: Metadata = {
  title: "연모고 동창회 / Baiqi Archive",
  description: "Love and Producer memory archive styled as an in-game record system",
};

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isAdmin();

  return (
    <html lang="ko">
      <body>
        <div className="site-shell">
          <div className="memory-shell">
            <div className="memory-bg" aria-hidden="true">
              <span className="memory-orb orb-a" />
              <span className="memory-orb orb-b" />
              <span className="memory-orb orb-c" />
              <span className="memory-noise" />
            </div>

            <aside className="sidebar">
              <div className="sidebar-inner">
                <Link href="/" className="brand">
                  <span className="brand-sub">LOVE AND PRODUCER</span>
                  <strong className="brand-title">아카이브</strong>
                  <span className="brand-desc">Baiqi Archive · KR / CN</span>
                </Link>

                <div className="archive-record-box">
                  <div className="archive-record-label">Archive Record</div>
                  <div className="archive-record-title">백기유연 CP</div>
                  <p className="archive-record-text">PC 전용</p>
                </div>

                <nav className="sidebar-nav">
                  <Link href="/" className="nav-link">
                    홈
                  </Link>
                  <Link href="/cards" className="nav-link">
                    카드
                  </Link>
                  <Link href="/stories" className="nav-link">
                    스토리
                  </Link>
                  <Link href="/phone-items" className="nav-link">
                    휴대폰
                  </Link>
                  <Link href="/events" className="nav-link">
                    이벤트
                  </Link>
                </nav>

                {admin ? (
                  <nav className="sidebar-nav sidebar-admin-nav">
                    <Link href="/characters" className="nav-link">
                      캐릭터 허브
                    </Link>
                    <Link href="/admin" className="nav-link">
                      관리자
                    </Link>
                  </nav>
                ) : null}

                <div className="sidebar-auth">
                  {!admin ? (
                    <Link
                      href="/admin/login"
                      className="secondary-button sidebar-auth-button"
                    >
                      로그인
                    </Link>
                  ) : (
                    <form action={adminLogout}>
                      <button
                        type="submit"
                        className="secondary-button sidebar-auth-button"
                      >
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
      </body>
    </html>
  );
}