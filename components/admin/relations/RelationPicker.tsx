"use client";

import { useMemo, useState } from "react";

export type RelationCandidate = {
  slug: string;
  title: string;
  subtype?: string | null;
  characterKey?: string | null;
  category?: string | null;
};

type SelectOption = {
  value: string;
  label: string;
};

type RelationPickerProps = {
  label: string;
  name: string;
  candidates: RelationCandidate[];
  initialSelected?: RelationCandidate[];
  subtypeOptions?: SelectOption[];
  characterOptions?: SelectOption[];
  categoryOptions?: SelectOption[];
};

export default function RelationPicker({
  label,
  name,
  candidates,
  initialSelected = [],
  subtypeOptions = [],
  characterOptions = [],
  categoryOptions = [],
}: RelationPickerProps) {
  const [query, setQuery] = useState("");
  const [subtype, setSubtype] = useState("all");
  const [character, setCharacter] = useState("all");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<RelationCandidate[]>(initialSelected);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return candidates.filter((item) => {
      const matchesSubtype = subtype === "all" || item.subtype === subtype;
      const matchesCharacter =
        character === "all" || item.characterKey === character;
      const matchesCategory = category === "all" || item.category === category;

      const matchesQuery =
        !q ||
        [
          item.title,
          item.slug,
          item.subtype,
          item.characterKey,
          item.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

      const notSelected = !selected.some((s) => s.slug === item.slug);

      return (
        matchesSubtype &&
        matchesCharacter &&
        matchesCategory &&
        matchesQuery &&
        notSelected
      );
    });
  }, [candidates, query, selected, subtype, character, category]);

  const serialized = selected.map((item) => item.slug).join("\n");

  function addItem(item: RelationCandidate) {
    setSelected((prev) => {
      if (prev.some((x) => x.slug === item.slug)) return prev;
      return [...prev, item];
    });
  }

  function removeItem(slug: string) {
    setSelected((prev) => prev.filter((item) => item.slug !== slug));
  }

  function moveItem(index: number, direction: -1 | 1) {
    setSelected((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <section className="detail-panel" style={{ marginTop: "24px" }}>
      <h3 className="detail-section-title">{label}</h3>

      <div className="form-grid" style={{ marginBottom: "16px" }}>
        {subtypeOptions.length > 0 ? (
          <label className="form-field">
            <span>유형</span>
            <select value={subtype} onChange={(e) => setSubtype(e.target.value)}>
              <option value="all">전체</option>
              {subtypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {characterOptions.length > 0 ? (
          <label className="form-field">
            <span>캐릭터</span>
            <select value={character} onChange={(e) => setCharacter(e.target.value)}>
              <option value="all">전체</option>
              {characterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {categoryOptions.length > 0 ? (
          <label className="form-field">
            <span>카테고리</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">전체</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="form-field form-field-full">
          <span>검색</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목, slug 검색"
          />
        </label>
      </div>

      <div style={{ display: "grid", gap: "12px", marginBottom: "18px" }}>
        {filtered.slice(0, 30).map((item) => (
          <div
            key={item.slug}
            className="link-card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{item.title}</div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-sub)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {[item.characterKey, item.subtype, item.category, item.slug]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>

            <button
              type="button"
              className="nav-link"
              style={{ border: "none", background: "transparent", cursor: "pointer" }}
              onClick={() => addItem(item)}
            >
              추가
            </button>
          </div>
        ))}

        {filtered.length === 0 ? (
          <div className="empty-box">조건에 맞는 항목이 없습니다.</div>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        {selected.map((item, index) => (
          <div
            key={item.slug}
            className="link-card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{item.title}</div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-sub)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {[item.characterKey, item.subtype, item.category, item.slug]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="nav-link"
                style={{ border: "none", background: "transparent", cursor: "pointer" }}
                onClick={() => moveItem(index, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="nav-link"
                style={{ border: "none", background: "transparent", cursor: "pointer" }}
                onClick={() => moveItem(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="nav-link"
                style={{ border: "none", background: "transparent", cursor: "pointer" }}
                onClick={() => removeItem(item.slug)}
              >
                삭제
              </button>
            </div>
          </div>
        ))}

        {selected.length === 0 ? (
          <div className="empty-box">아직 연결된 항목이 없습니다.</div>
        ) : null}
      </div>

      <textarea name={name} value={serialized} readOnly hidden />
    </section>
  );
}