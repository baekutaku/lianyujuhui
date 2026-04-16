"use client";

import { useMemo, useState } from "react";

type Option = {
  value: string;
  label: string;
};

type CardsSortModalProps = {
  defaultValue?: string;
  sortOptions: Option[];
  preserveValues?: {
    q?: string;
    rarity?: string;
    category?: string;
    character?: string;
    year?: string;
    tag?: string;
  };
};

export default function CardsSortModal({
  defaultValue = "latest",
  sortOptions,
  preserveValues,
}: CardsSortModalProps) {
  const [open, setOpen] = useState(false);

  const resetHref = useMemo(() => {
    const params = new URLSearchParams();

    if (preserveValues?.q) params.set("q", preserveValues.q);
    if (preserveValues?.rarity) params.set("rarity", preserveValues.rarity);
    if (preserveValues?.category) params.set("category", preserveValues.category);
    if (preserveValues?.character) params.set("character", preserveValues.character);
    if (preserveValues?.year) params.set("year", preserveValues.year);
    if (preserveValues?.tag) params.set("tag", preserveValues.tag);

    const query = params.toString();
    return query ? `/cards?${query}` : "/cards";
  }, [preserveValues]);

  return (
    <>
      <button
        type="button"
        className="cards-filter-trigger"
        onClick={() => setOpen(true)}
        aria-label="카드 정렬 열기"
      >
      <span className="material-symbols-rounded">sort</span>
      </button>

      {open ? (
        <div className="cards-filter-modal-root">
          <button
            type="button"
            className="cards-filter-backdrop"
            aria-label="정렬 닫기"
            onClick={() => setOpen(false)}
          />

          <div className="cards-filter-modal">
            <div className="cards-filter-modal-head">
              <div>
                <div className="cards-filter-modal-eyebrow">SORT</div>
                <h2>카드 정렬</h2>
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
              {preserveValues?.q ? (
                <input type="hidden" name="q" value={preserveValues.q} />
              ) : null}
              {preserveValues?.rarity ? (
                <input type="hidden" name="rarity" value={preserveValues.rarity} />
              ) : null}
              {preserveValues?.category ? (
                <input type="hidden" name="category" value={preserveValues.category} />
              ) : null}
              {preserveValues?.character ? (
                <input type="hidden" name="character" value={preserveValues.character} />
              ) : null}
              {preserveValues?.year ? (
                <input type="hidden" name="year" value={preserveValues.year} />
              ) : null}
              {preserveValues?.tag ? (
                <input type="hidden" name="tag" value={preserveValues.tag} />
              ) : null}

              <label className="form-field form-field-full">
                <span>정렬</span>
                <select name="sort" defaultValue={defaultValue}>
                  {sortOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="cards-filter-actions">
                <a href={resetHref} className="cards-filter-reset">
                  정렬 해제
                </a>

                <button
                  type="submit"
                  className="primary-button cards-filter-apply"
                >
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