"use client";

import { useMemo, useState } from "react";

type Option = {
  value: string;
  label: string;
};

type StoriesFilterModalProps = {
  defaultValues: {
    tab: string;
    sub?: string;
    q?: string;
    scope?: string;
    sort?: string;
    tag?: string;
    years?: string[];
    characters?: string[];
  };
  yearOptions: string[];
  characterOptions: Option[];
  scopeOptions: Option[];
  sortOptions: Option[];
};

export default function StoriesFilterModal({
  defaultValues,
  yearOptions,
  characterOptions,
  scopeOptions,
  sortOptions,
}: StoriesFilterModalProps) {
  const [open, setOpen] = useState(false);

  const resetHref = useMemo(() => {
    const params = new URLSearchParams();

    if (defaultValues.tab) params.set("tab", defaultValues.tab);
    if (defaultValues.sub && defaultValues.sub !== "all") {
      params.set("sub", defaultValues.sub);
    }
    if (defaultValues.tag) {
      params.set("tag", defaultValues.tag);
    }

    const query = params.toString();
    return query ? `/stories?${query}` : "/stories";
  }, [defaultValues.tab, defaultValues.sub, defaultValues.tag]);

  return (
    <>
      <button
        type="button"
        className="stories-filter-trigger"
        onClick={() => setOpen(true)}
        aria-label="스토리 필터 열기"
      >
        <span className="material-symbols-rounded">tune</span>
      </button>

      {open ? (
        <div className="stories-filter-modal-root">
          <button
            type="button"
            className="stories-filter-backdrop"
            aria-label="필터 닫기"
            onClick={() => setOpen(false)}
          />

          <div className="stories-filter-modal">
            <div className="stories-filter-modal-head">
              <div>
                <div className="stories-filter-modal-eyebrow">FILTER</div>
                <h2>스토리 필터</h2>
              </div>

              <button
                type="button"
                className="stories-filter-close"
                onClick={() => setOpen(false)}
                aria-label="닫기"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <form method="get" className="stories-filter-form">
              <input type="hidden" name="tab" value={defaultValues.tab} />
              {defaultValues.sub && defaultValues.sub !== "all" ? (
                <input type="hidden" name="sub" value={defaultValues.sub} />
              ) : null}
               {/* tag는 위 입력 필드로 대체 */}

            <label className="form-field form-field-full">
                <span>검색</span>
                <input
                  name="q"
                  defaultValue={defaultValues.q ?? ""}
                  placeholder="제목 / 스토리 내용 검색"
                />
              </label>

              <label className="form-field form-field-full">
                <span>해시태그</span>
                <input
                  name="tag"
                  defaultValue={defaultValues.tag ?? ""}
                  placeholder="예: 생일, 키스, 크리스마스"
                  autoComplete="off"
                />
              </label>

              <label className="form-field">
                <span>등장 범위</span>
                <select name="scope" defaultValue={defaultValues.scope ?? ""}>
                  {scopeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>정렬</span>
                <select name="sort" defaultValue={defaultValues.sort ?? "latest"}>
                  {sortOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="form-field form-field-full">
  <span>캐릭터</span>
  <div className="stories-filter-check-grid">
    {characterOptions.map((item) => (
      <label key={item.value} className="stories-filter-check">
        <input
          type="checkbox"
          name="character"
          value={item.value}
          defaultChecked={(defaultValues.characters ?? []).includes(item.value)}
          className="stories-filter-check-input"
        />
        <span className="stories-filter-check-box" aria-hidden="true" />
        <span className="stories-filter-check-text">{item.label}</span>
      </label>
    ))}
  </div>
</fieldset>

              <fieldset className="form-field form-field-full">
  <span>연도</span>
  <div className="stories-filter-check-grid">
    {yearOptions.map((item) => (
      <label key={item} className="stories-filter-check">
        <input
          type="checkbox"
          name="year"
          value={item}
          defaultChecked={(defaultValues.years ?? []).includes(item)}
          className="stories-filter-check-input"
        />
        <span className="stories-filter-check-box" aria-hidden="true" />
        <span className="stories-filter-check-text">{item}</span>
      </label>
    ))}
  </div>
</fieldset>

              <div className="stories-filter-actions">
                <a href={resetHref} className="stories-filter-reset">
                  초기화
                </a>

                <button type="submit" className="primary-button stories-filter-apply">
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