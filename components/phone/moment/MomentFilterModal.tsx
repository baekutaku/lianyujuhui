"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthorOption = {
  key: string;
  label: string;
};

type MomentFilterModalProps = {
  open: boolean;
  onClose: () => void;
  basePath: string;
  showAuthor?: boolean;
  authorOptions?: AuthorOption[];
  selectedAuthor?: string;
  selectedCategories?: string[];
  selectedReply?: "all" | "replied" | "unreplied";
  selectedYears?: string[];
  availableYears: string[];
};

const CATEGORY_OPTIONS = [
  { key: "daily", label: "일상" },
  { key: "card", label: "카드" },
  { key: "story", label: "스토리" },
] as const;

const REPLY_OPTIONS = [
  { key: "replied", label: "답장 있음" },
  { key: "unreplied", label: "답장 없음" },
] as const;

function toggleValue(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export default function MomentFilterModal({
  open,
  onClose,
  basePath,
  showAuthor = false,
  authorOptions = [],
  selectedAuthor = "all",
  selectedCategories = [],
  selectedReply = "all",
  selectedYears = [],
  availableYears,
}: MomentFilterModalProps) {
  const router = useRouter();

  const [author, setAuthor] = useState(selectedAuthor);
  const [categories, setCategories] = useState<string[]>(selectedCategories);
  const [reply, setReply] = useState<"all" | "replied" | "unreplied">(
    selectedReply
  );
  const [years, setYears] = useState<string[]>(selectedYears);

  useEffect(() => {
    setAuthor(selectedAuthor);
    setCategories(selectedCategories);
    setReply(selectedReply);
    setYears(selectedYears);
  }, [selectedAuthor, selectedCategories, selectedReply, selectedYears, open]);

  if (!open) return null;

  const sortedYears = [...availableYears].sort((a, b) => Number(b) - Number(a));

  const handleReset = () => {
    setAuthor("all");
    setCategories([]);
    setReply("all");
    setYears([]);
  };

  const handleConfirm = () => {
    const params = new URLSearchParams();

    if (showAuthor && author !== "all") params.set("author", author);
    if (categories.length) params.set("category", categories.join(","));
    if (reply !== "all") params.set("reply", reply);
    if (years.length) params.set("year", years.join(","));

    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
    onClose();
  };

  const chipStyle = (active: boolean): React.CSSProperties => ({
    minHeight: 40,
    borderRadius: 10,
    border: active ? "1px solid #ea7e9f" : "1px solid #efbfd0",
    background: active ? "#ee8fb0" : "#f6b0c7",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(40, 34, 52, 0.36)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(92vw, 560px)",
          maxHeight: "82vh",
          overflowY: "auto",
          borderRadius: 18,
          padding: "20px 18px 18px",
          background: "rgba(255, 252, 255, 0.97)",
          boxShadow: "0 24px 60px rgba(56, 42, 84, 0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#7f6787",
            }}
          >
            모멘트 필터
          </div>

          <button
            type="button"
            onClick={handleReset}
            style={{
              border: 0,
              background: "transparent",
              color: "#ba94b3",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            초기화
          </button>
        </div>

        {showAuthor ? (
          <div style={{ marginTop: 18 }}>
            <div
              style={{
                marginBottom: 10,
                fontSize: 15,
                fontWeight: 700,
                color: "#8e798d",
              }}
            >
              캐릭터
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              <button
                type="button"
                style={chipStyle(author === "all")}
                onClick={() => setAuthor("all")}
              >
                전체
              </button>

              {authorOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  style={chipStyle(author === option.key)}
                  onClick={() => setAuthor(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 18 }}>
          <div
            style={{
              marginBottom: 10,
              fontSize: 15,
              fontWeight: 700,
              color: "#8e798d",
            }}
          >
            모멘트 타입
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {CATEGORY_OPTIONS.map((option) => {
              const active = categories.includes(option.key);
              return (
                <button
                  key={option.key}
                  type="button"
                  style={chipStyle(active)}
                  onClick={() =>
                    setCategories((prev) => toggleValue(prev, option.key))
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div
            style={{
              marginBottom: 10,
              fontSize: 15,
              fontWeight: 700,
              color: "#8e798d",
            }}
          >
            답장 여부
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            <button
              type="button"
              style={chipStyle(reply === "all")}
              onClick={() => setReply("all")}
            >
              전체
            </button>

            {REPLY_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                style={chipStyle(reply === option.key)}
                onClick={() => setReply(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div
            style={{
              marginBottom: 10,
              fontSize: 15,
              fontWeight: 700,
              color: "#8e798d",
            }}
          >
            연도
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {sortedYears.map((year) => {
              const active = years.includes(year);
              return (
                <button
                  key={year}
                  type="button"
                  style={chipStyle(active)}
                  onClick={() => setYears((prev) => toggleValue(prev, year))}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          style={{
            width: "100%",
            marginTop: 22,
            minHeight: 48,
            border: 0,
            borderRadius: 12,
            background: "linear-gradient(180deg, #ef93ae, #ea7e9f)",
            color: "#fff",
            fontSize: 17,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          적용
        </button>
      </div>
    </div>
  );
}