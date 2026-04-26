"use client";

import { useState } from "react";

type SiteUpdate = {
  id: string;
  title: string;
  body: string;
  category: string | null;
  target_area: string | null;
  is_pinned: boolean | null;
  published_at: string | null;
};

type HomeUpdateButtonProps = {
  updates: SiteUpdate[];
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

function formatDate(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function HomeUpdateButton({ updates }: HomeUpdateButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="hero-secondary-button home-update-open-button"
        onClick={() => setOpen(true)}
      >
        업데이트
      </button>

      {open ? (
        <div className="home-guide-backdrop" onClick={() => setOpen(false)}>
          <div
            className="home-guide-modal home-update-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="업데이트"
          >
            <div className="home-guide-modal-head">
              <div className="home-guide-modal-title-row">
                <span className="material-symbols-rounded home-guide-modal-icon">
                  campaign
                </span>

                <div>
                  <h3 className="home-guide-modal-title">업데이트</h3>
                  <p className="home-guide-modal-sub">
                    사이트 수정 내역과 예정 작업입니다
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="home-guide-modal-close"
                onClick={() => setOpen(false)}
                aria-label="닫기"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <div className="home-guide-modal-body">
              {updates.length > 0 ? (
                <div className="home-update-list">
                  {updates.map((item) => {
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

                        <h4 className="home-update-item-title">
                          {item.title}
                        </h4>

                        <p className="home-update-item-body">{item.body}</p>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="home-guide-info-box">
                  <p>등록된 업데이트 글이 없습니다.</p>
                </div>
              )}

              <button
                type="button"
                className="home-guide-confirm"
                onClick={() => setOpen(false)}
              >
                확인했습니다
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}