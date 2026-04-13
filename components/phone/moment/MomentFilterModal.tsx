"use client";

import { useEffect } from "react";
import {
  MOMENT_AUTHOR_KEYS,
  MOMENT_AUTHOR_LABEL_MAP,
  MOMENT_CATEGORY_KEYS,
  MOMENT_CATEGORY_LABEL_MAP,
} from "@/lib/phone/moment-filters";

type MomentFilterModalProps = {
  open: boolean;
  selectedAuthor: string;
  selectedCategory: string;
  selectedYear: string;
  availableYears: string[];
  showAuthor?: boolean;
  onAuthorChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
};

export default function MomentFilterModal({
  open,
  selectedAuthor,
  selectedCategory,
  selectedYear,
  availableYears,
  showAuthor = true,
  onAuthorChange,
  onCategoryChange,
  onYearChange,
  onClose,
  onApply,
  onReset,
}: MomentFilterModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="moment-choice-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="모멘트 필터"
    >
      <div
        className="moment-choice-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="moment-choice-modal-header">
          <h3 className="moment-choice-modal-title">필터</h3>
          <button
            type="button"
            className="moment-choice-modal-close"
            onClick={onClose}
            aria-label="닫기"
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div style={{ display: "grid", gap: 18, marginTop: 14 }}>
          {showAuthor ? (
            <section>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#8e84a1",
                  marginBottom: 10,
                }}
              >
                발행자
              </div>

              <div className="message-history-filter-row">
                {MOMENT_AUTHOR_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`message-history-chip ${
                      selectedAuthor === key ? "active" : ""
                    }`}
                    onClick={() => onAuthorChange(key)}
                  >
                    {MOMENT_AUTHOR_LABEL_MAP[key] || key}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#8e84a1",
                marginBottom: 10,
              }}
            >
              카테고리
            </div>

            <div className="message-history-filter-row">
              {MOMENT_CATEGORY_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`message-history-chip ${
                    selectedCategory === key ? "active" : ""
                  }`}
                  onClick={() => onCategoryChange(key)}
                >
                  {MOMENT_CATEGORY_LABEL_MAP[key] || key}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#8e84a1",
                marginBottom: 10,
              }}
            >
              연도
            </div>

            <div className="message-history-filter-row" style={{ flexWrap: "wrap" }}>
              <button
                type="button"
                className={`message-history-chip ${selectedYear ? "" : "active"}`}
                onClick={() => onYearChange("")}
              >
                전체연도
              </button>

              {availableYears.map((year) => (
                <button
                  key={year}
                  type="button"
                  className={`message-history-chip ${
                    selectedYear === year ? "active" : ""
                  }`}
                  onClick={() => onYearChange(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginTop: 20,
          }}
        >
          <button
            type="button"
            className="secondary-button"
            onClick={onReset}
            style={{ marginTop: 0 }}
          >
            초기화
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={onApply}
            style={{ marginTop: 0 }}
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}