"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function AdminVisualCreateMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div className="admin-visual-create" ref={rootRef}>
      <button type="button" className="primary-button admin-visual-create-trigger" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        <span>＋</span> 새 자료 등록 <span className="material-symbols-rounded">expand_more</span>
      </button>
      {open ? (
        <div className="admin-visual-create-menu">
          <Link href="/admin/cards/new" onClick={() => setOpen(false)}>
            <span className="admin-visual-create-kind is-card">CARD</span>
            <span><strong>카드 등록</strong><small>등급 · 속성 · 진화 이미지 포함</small></span>
          </Link>
          <Link href="/admin/illustrations/new" onClick={() => setOpen(false)}>
            <span className="admin-visual-create-kind is-illust">ILLUST</span>
            <span><strong>카드 외 일러스트</strong><small>원본 비율 이미지 자료</small></span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
