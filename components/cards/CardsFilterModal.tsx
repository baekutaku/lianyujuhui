"use client";

import { useMemo, useState } from "react";

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
    sort?: string;
    tag?: string;
  };
  yearOptions: string[];
  characterOptions: Option[];
  rarityOptions: Option[];
  categoryOptions: Option[];
};

function ChoiceChip({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="cards-filter-choice">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
      />
      <span>{label}</span>
    </label>
  );
}

export default function CardsFilterModal({
  defaultValues,
  yearOptions,
  characterOptions,
  rarityOptions,
  categoryOptions,
}: CardsFilterModalProps) {
  const [open, setOpen] = useState(false);

  const resetHref = useMemo(() => {
    const params = new URLSearchParams();

    if (defaultValues.sort) {
      params.set("sort", defaultValues.sort);
    }

    if (defaultValues.tag) {
      params.set("tag", defaultValues.tag);
    }

    const query = params.toString();
    return query ? `/cards?${query}` : "/cards";
  }, [defaultValues.sort, defaultValues.tag]);

  const showCharacter = characterOptions.length > 1;

  return (
    <>
      <button
        type="button"
        className="cards-filter-trigger"
        onClick={() => setOpen(true)}
        aria-label="카드 필터 열기"
      >
        <span className="material-symbols-rounded">tune</span>
      </button>

      {open ? (
        <div className="cards-filter-modal-root">
          <button
            type="button"
            className="cards-filter-backdrop"
            aria-label="필터 닫기"
            onClick={() => setOpen(false)}
          />

          <section
            className="cards-filter-modal cards-filter-modal-v2"
            role="dialog"
            aria-modal="true"
            aria-label="카드 검색 및 필터"
          >
            <div className="cards-filter-modal-head">
              <div>
                <div className="cards-filter-modal-eyebrow">
                  ARCHIVE FILTER
                </div>
                <h2>검색 · 필터</h2>
                <p>카드명, 요약, 태그와 분류 조건을 함께 검색합니다.</p>
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

            <form method="get" className="cards-filter-form cards-filter-form-v2">
              {defaultValues.sort ? (
                <input type="hidden" name="sort" value={defaultValues.sort} />
              ) : null}

              {defaultValues.tag ? (
                <input type="hidden" name="tag" value={defaultValues.tag} />
              ) : null}

              <div className="cards-filter-search-wrap">
                <span className="material-symbols-rounded">search</span>
                <input
                  name="q"
                  defaultValue={defaultValues.q ?? ""}
                  placeholder="카드명 / 요약 / 태그 검색"
                  autoComplete="off"
                />
              </div>

              <div className="cards-filter-section">
                <div className="cards-filter-section-head">
                  <span>등급</span>
                  <small>RARITY</small>
                </div>

                <div className="cards-filter-choice-row">
                  <ChoiceChip
                    name="rarity"
                    value=""
                    label="전체"
                    defaultChecked={!defaultValues.rarity}
                  />
                  {rarityOptions.map((item) => (
                    <ChoiceChip
                      key={item.value}
                      name="rarity"
                      value={item.value}
                      label={item.label}
                      defaultChecked={defaultValues.rarity === item.value}
                    />
                  ))}
                </div>
              </div>

              <div className="cards-filter-section">
                <div className="cards-filter-section-head">
                  <span>카드 분류</span>
                  <small>CATEGORY</small>
                </div>

                <div className="cards-filter-choice-row cards-filter-category-row">
                  <ChoiceChip
                    name="category"
                    value=""
                    label="전체"
                    defaultChecked={!defaultValues.category}
                  />
                  {categoryOptions.map((item) => (
                    <ChoiceChip
                      key={item.value}
                      name="category"
                      value={item.value}
                      label={item.label}
                      defaultChecked={defaultValues.category === item.value}
                    />
                  ))}
                </div>
              </div>

              <div
                className={`cards-filter-select-grid${
                  showCharacter ? "" : " is-single"
                }`}
              >
                {showCharacter ? (
                  <label className="cards-filter-select-field">
                    <span>캐릭터</span>
                    <div className="cards-filter-select-shell">
                      <select
                        name="character"
                        defaultValue={defaultValues.character ?? ""}
                      >
                        <option value="">전체</option>
                        {characterOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-rounded">
                        expand_more
                      </span>
                    </div>
                  </label>
                ) : null}

                <label className="cards-filter-select-field">
                  <span>연도</span>
                  <div className="cards-filter-select-shell">
                    <select
                      name="year"
                      defaultValue={defaultValues.year ?? ""}
                    >
                      <option value="">전체 연도</option>
                      {yearOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-rounded">
                      expand_more
                    </span>
                  </div>
                </label>
              </div>

              <div className="cards-filter-actions">
                <a href={resetHref} className="cards-filter-reset">
                  초기화
                </a>

                <button
                  type="submit"
                  className="cards-filter-apply"
                >
                  적용
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
