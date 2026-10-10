"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RelatedItem = {
  id: string;
  title: string;
  href: string;
};

type Props = {
  stories: RelatedItem[];
  cards: RelatedItem[];
  phoneItems: RelatedItem[];
  events: RelatedItem[];
};

export default function StoryRelatedQuickAccess({
  stories,
  cards,
  phoneItems,
  events,
}: Props) {
  const tabs = useMemo(
    () => [
      { key: "stories", label: "스토리", items: stories },
      { key: "cards", label: "카드", items: cards },
      { key: "phone", label: "휴대폰", items: phoneItems },
      { key: "events", label: "이벤트", items: events },
    ],
    [stories, cards, phoneItems, events]
  );

  const total = tabs.reduce((sum, tab) => sum + tab.items.length, 0);
  const firstAvailable =
    tabs.find((tab) => tab.items.length > 0)?.key ?? "stories";

  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState(firstAvailable);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (total === 0) return null;

  const activeTab =
    tabs.find((tab) => tab.key === activeKey) ?? tabs[0];

  const scrollToFullPanel = () => {
    setOpen(false);

    window.setTimeout(() => {
      document
        .getElementById("story-related-content-anchor")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 80);
  };

  return (
    <>
      <button
        type="button"
        className="story-related-floating-trigger"
        onClick={() => setOpen(true)}
        aria-label={`연결 콘텐츠 ${total}개 보기`}
      >
        <span
          className="material-symbols-rounded"
          aria-hidden="true"
        >
          link
        </span>
        <span className="story-related-floating-label">
          연결
        </span>
        <span className="story-related-floating-count">
          {total}
        </span>
      </button>

      {open ? (
        <div className="story-related-quick-root">
          <button
            type="button"
            className="story-related-quick-backdrop"
            aria-label="연결 콘텐츠 닫기"
            onClick={() => setOpen(false)}
          />

          <aside
            className="story-related-quick-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="연결 콘텐츠"
          >
            <header className="story-related-quick-head">
              <div>
                <p>RELATED CONTENT</p>
                <h2>연결 콘텐츠</h2>
              </div>

              <div className="story-related-quick-head-right">
                <span>{total}</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="닫기"
                >
                  <span
                    className="material-symbols-rounded"
                    aria-hidden="true"
                  >
                    close
                  </span>
                </button>
              </div>
            </header>

            <div
              className="story-related-quick-tabs"
              role="tablist"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab.key === tab.key}
                  className={`story-related-quick-tab${
                    activeTab.key === tab.key
                      ? " is-active"
                      : ""
                  }`}
                  onClick={() => setActiveKey(tab.key)}
                >
                  {tab.label}
                  <span>{tab.items.length}</span>
                </button>
              ))}
            </div>

            <div
              className="story-related-quick-list"
              role="tabpanel"
            >
              {activeTab.items.length > 0 ? (
                activeTab.items.map((item) => (
                  <Link
                    key={`${activeTab.key}-${item.id}`}
                    href={item.href}
                    className="story-related-quick-link"
                    onClick={() => setOpen(false)}
                  >
                    <span>{item.title}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                ))
              ) : (
                <div className="story-related-quick-empty">
                  연결된 {activeTab.label} 콘텐츠가 없습니다.
                </div>
              )}
            </div>

            <button
              type="button"
              className="story-related-quick-jump"
              onClick={scrollToFullPanel}
            >
              본문 아래 전체 패널로 이동
              <span
                className="material-symbols-rounded"
                aria-hidden="true"
              >
                south
              </span>
            </button>
          </aside>
        </div>
      ) : null}
    </>
  );
}
