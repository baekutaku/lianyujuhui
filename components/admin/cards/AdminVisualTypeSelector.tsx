"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminVisualTypeSelector() {
  const pathname = usePathname();
  const isIllustration = pathname.startsWith("/admin/illustrations");
  const isCard = !isIllustration;

  return (
    <section className="admin-visual-type-selector" aria-label="등록 자료 종류">
      <div className="admin-visual-type-selector-label">자료 분류</div>

      <div className="admin-visual-type-selector-grid">
        <Link
          href="/admin/cards/new"
          className={`admin-visual-type-option${isCard ? " is-active" : ""}`}
          aria-current={isCard ? "page" : undefined}
        >
          <span className="admin-visual-type-code">CARD</span>
          <span className="admin-visual-type-copy">
            <strong>카드</strong>
            <small>등급 · 속성 · 진화 전후 이미지</small>
          </span>
          <span className="material-symbols-rounded">chevron_right</span>
        </Link>

        <Link
          href="/admin/illustrations/new"
          className={`admin-visual-type-option${
            isIllustration ? " is-active" : ""
          }`}
          aria-current={isIllustration ? "page" : undefined}
        >
          <span className="admin-visual-type-code">ILLUST</span>
          <span className="admin-visual-type-copy">
            <strong>카드 외 일러스트</strong>
            <small>원본 비율의 일반 일러스트 자료</small>
          </span>
          <span className="material-symbols-rounded">chevron_right</span>
        </Link>
      </div>
    </section>
  );
}
