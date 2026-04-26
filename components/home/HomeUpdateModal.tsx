"use client";

import { useMemo, useState } from "react";

type SiteUpdate = {
  id: string;
  title: string;
  body: string;
  category: string | null;
  target_area: string | null;
  is_pinned: boolean | null;
  published_at: string | null;
};

type HomeUpdateModalProps = {
  updates: SiteUpdate[];
  className?: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  update: "업데이트",
  fix: "수정",
  notice: "공지",
  todo: "예정",
};

const TARGET_LABELS: Record<string, string> = {
  all: "전체",
  home: "홈",
  cards: "카드",
  stories: "스토리",
  events: "이벤트",
  phone: "휴대폰",
  maker: "커스텀",
  admin: "관리자",
};

function formatDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function HomeUpdateModal({
  updates,
  className,
}: HomeUpdateModalProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("all");

  const filteredUpdates = useMemo(() => {
    if (category === "all") return updates;

    return updates.filter((item) => item.category === category);
  }, [updates, category]);

  const categoryTabs = useMemo(() => {
    const categories = Array.from(
      new Set(updates.map((item) => item.category).filter(Boolean))
    ) as string[];

    return ["all", ...categories];
  }, [updates]);

  return (
    <>
      <button
        type="button"
        className={className ?? "home-update-open-button"}
        onClick={() => setOpen(true)}
      >
        업데이트
        {updates.length > 0 ? (
          <span className="home-update-count">{updates.length}</span>
        ) : null}
      </button>

      {open ? (
        <div className="home-update-backdrop" role="presentation">
          <div
            className="home-update-modal"
            role="dialog"
            aria-modal="true"
            aria-label="업데이트"
          >
            <div className="home-update-head">
              <div>
                <p className="home-update-eyebrow">Archive Updates</p>
                <h2 className="home-update-title">업데이트</h2>
                <p className="home-update-sub">
                  사이트 수정 내역과 예정 작업을 정리합니다.
                </p>
              </div>

              <button
                type="button"
                className="home-update-close"
                onClick={() => setOpen(false)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <div className="home-update-body">
              {categoryTabs.length > 1 ? (
                <div className="home-update-tabs">
                  {categoryTabs.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`home-update-tab ${
                        category === item ? "is-active" : ""
                      }`}
                      onClick={() => setCategory(item)}
                    >
                      {item === "all"
                        ? "전체"
                        : CATEGORY_LABELS[item] ?? item}
                    </button>
                  ))}
                </div>
              ) : null}

              {filteredUpdates.length > 0 ? (
                <div className="home-update-list">
                  {filteredUpdates.map((item) => {
                    const categoryLabel =
                      CATEGORY_LABELS[item.category ?? ""] ??
                      item.category ??
                      "업데이트";

                    const targetLabel =
                      TARGET_LABELS[item.target_area ?? ""] ??
                      item.target_area ??
                      "전체";

                    return (
                      <article key={item.id} className="home-update-item">
                        <div className="home-update-item-head">
                          <div>
                            <div className="home-update-meta-row">
                              {item.is_pinned ? (
                                <span className="home-update-badge is-pinned">
                                  고정
                                </span>
                              ) : null}
                              <span className="home-update-badge">
                                {categoryLabel}
                              </span>
                              <span className="home-update-badge is-target">
                                {targetLabel}
                              </span>
                              <span className="home-update-date">
                                {formatDate(item.published_at)}
                              </span>
                            </div>

                            <h3 className="home-update-item-title">
                              {item.title}
                            </h3>
                          </div>
                        </div>

                        <p className="home-update-item-body">{item.body}</p>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="home-update-empty">
                  등록된 업데이트 글이 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}