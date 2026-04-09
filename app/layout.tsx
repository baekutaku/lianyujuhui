import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { isAdmin } from "@/lib/utils/admin-auth";

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
                <Link href="/" className="nav-link">
                  홈
                </Link>
                <Link href="/cards" className="nav-link">
                  카드
                </Link>
                <Link href="/stories" className="nav-link">
                  데이트·스토리
                </Link>
                <Link href="/phone-items" className="nav-link">
                  휴대폰
                </Link>
                <Link href="/events" className="nav-link">
                  이벤트
                </Link>

                {admin && (
                  <>
                    <Link href="/admin" className="nav-link">
                      관리자
                    </Link>
                    <Link href="/admin/phone-items" className="nav-link">
                      휴대폰 관리
                    </Link>
                  </>
                )}
              </nav>

              <div className="sidebar-box">
                <p className="sidebar-box-title">인게임 축</p>
                <p className="sidebar-box-text">
                  카드 · 데이트 · 휴대폰 · 이벤트
                </p>
              </div>
            </div>
          </aside>

          <main className="content-area">
            <div className="content-inner">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}