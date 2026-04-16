"use client";

import { useState } from "react";

type Option = {
  value: string;
  label: string;
};

type CardsFilterModalProps = {
  defaultValues: {
    q?: string;
    rarity?: string;
    category?: string;
    character?: string;
    year?: string;
  };
  yearOptions: string[];
  characterOptions: Option[];
  rarityOptions: Option[];
  categoryOptions: Option[];
};

export default function CardsFilterModal({
  defaultValues,
  yearOptions,
  characterOptions,
  rarityOptions,
  categoryOptions,
}: CardsFilterModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="cards-filter-trigger"
        onClick={() => setOpen(true)}
        aria-label="카드 필터 열기"
      >
        <span className="material-symbols-rounded">search</span>
      </button>

      {open ? (
        <div className="cards-filter-modal-root">
          <button
            type="button"
            className="cards-filter-backdrop"
            aria-label="필터 닫기"
            onClick={() => setOpen(false)}
          />

          <div className="cards-filter-modal">
            <div className="cards-filter-modal-head">
              <div>
                <div className="cards-filter-modal-eyebrow">SELECT</div>
                <h2>카드 필터</h2>
              </div>

              <button
                type="button"
                className="cards-filter-close"
                onClick={() => setOpen(false)}
                aria-label="닫기"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <form method="get" className="cards-filter-form">
              <label className="form-field form-field-full">
                <span>검색</span>
                <input
                  name="q"
                  defaultValue={defaultValues.q ?? ""}
                  placeholder="카드 제목 검색"
                />
              </label>

              <label className="form-field">
                <span>캐릭터</span>
                <select name="character" defaultValue={defaultValues.character ?? ""}>
                  <option value="">전체</option>
                  {characterOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>연도</span>
                <select name="year" defaultValue={defaultValues.year ?? ""}>
                  <option value="">전체</option>
                  {yearOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>등급</span>
                <select name="rarity" defaultValue={defaultValues.rarity ?? ""}>
                  <option value="">전체</option>
                  {rarityOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>카드 분류</span>
                <select name="category" defaultValue={defaultValues.category ?? ""}>
                  <option value="">전체</option>
                  {categoryOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="cards-filter-actions">
  <a href="/cards" className="cards-filter-reset">
    초기화
  </a>

  <button type="submit" className="primary-button cards-filter-apply">
    적용
  </button>
</div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}