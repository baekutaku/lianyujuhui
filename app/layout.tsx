import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { isAdmin } from "@/lib/utils/admin-auth";
import FloatingMobileMenu from "@/components/FloatingMobileMenu";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { adminLogout } from "@/app/admin/auth-actions";

export const metadata: Metadata = {
  title: "연모고 동창회 아카이브",
  description: "백기유연 중심 번역 아카이브",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await isAdmin();

  return (
    <html lang="ko">
      <body>
        <div className="site-shell">
          <aside className="sidebar">
            <div className="sidebar-inner">
              <Link href="/" className="brand">
                <span className="brand-sub">LOVE AND PRODUCER ARCHIVE</span>
                <strong className="brand-title">연모고 동창회</strong>
                <span className="brand-desc">Baiqi Archive / KR · CN</span>
              </Link>

              <nav className="sidebar-nav">
                <Link href="/" className="nav-link">홈</Link>
                <Link href="/cards" className="nav-link">카드</Link>
                <Link href="/stories" className="nav-link">데이트·스토리</Link>
                <Link href="/phone-items" className="nav-link">휴대폰</Link>
                <Link href="/events" className="nav-link">이벤트</Link>
              </nav>

              {admin && (
                <nav className="sidebar-nav sidebar-admin-nav">
                  <Link href="/characters" className="nav-link">캐릭터 허브</Link>
                  <Link href="/admin" className="nav-link">관리자</Link>
                </nav>
              )}

              <div className="sidebar-auth">
                {!admin ? (
                  <Link href="/admin/login" className="secondary-button sidebar-auth-button">
                    관리자 로그인
                  </Link>
                ) : (
                  <form action={adminLogout}>
                    <button type="submit" className="secondary-button sidebar-auth-button">
                      로그아웃
                    </button>
                  </form>
                )}
              </div>

              <div className="sidebar-box">
                <p className="sidebar-box-title">CP 백업</p>
                <p className="sidebar-box-text">
                  백기유연
                </p>
              </div>
            </div>
          </aside>

          <main className="content-area">
            <div className="content-inner">{children}</div>
          </main>
        </div>

        <FloatingMobileMenu />
        <ScrollToTopButton />
      </body>
    </html>
  );
}