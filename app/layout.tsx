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
                <strong className="brand-title">
                  연모고 동창회 백기유연 위주 아카이브
                </strong>
                <span className="brand-desc">Baiqi Archive / KR · CN</span>
              </Link>

              <nav className="sidebar-nav">
                <Link href="/" className="nav-link">
                  홈
                </Link>
                <Link href="/stories" className="nav-link">
                  스토리
                </Link>
                <Link href="/cards" className="nav-link">
                  카드
                </Link>
                <Link href="/events" className="nav-link">
                  이벤트
                </Link>

                {admin && (
                  <Link href="/admin" className="nav-link">
                    관리자
                  </Link>
                )}
              </nav>

              <div className="sidebar-box">
                <p className="sidebar-box-title">테마</p>
                <p className="sidebar-box-text">
                  백기 테마의 연한 하늘빛 아카이브
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
