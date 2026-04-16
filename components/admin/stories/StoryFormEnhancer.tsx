"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

const FIELD_NAMES = [
  // 공통
  "title",
  "subtype",
  "releaseYear",
  "serverKey",
  "characterKey",
  "tagLabels",
  "visibility",
  "accessPassword",
  "accessHint",

  // story
  "releaseDate",
  "translationTitleCn",
  "translationBodyCn",
  "translationTitleKr",
  "translationBodyKr",
  "youtubeUrlCn",
  "youtubeUrlKr",
  "coverImageUrl",
  "cardSlug",
  "part_no",
  "volume_no",
  "main_season",
  "chapter_no",
  "main_kind",
  "route_scope",
  "primary_character_id",
  "manual_sort_order",
  "arc_title",
  "episode_title",
  "appearing_character_ids",

  // event
  "startDate",
  "endDate",
  "summary",
  "translationTitle",
  "translationBody",
  "youtubeUrl",
  "thumbnailUrl",
  "relatedEventSlug",
  "isPublished",
] as const;

type StoryFormEnhancerProps = {
  storageKey: string;
  showViewButton?: boolean;
};

type DraftPayload = {
  updatedAt: number;
  values: Record<string, string | string[]>;
};

function formatSavedAt(timestamp: number | null) {
  if (!timestamp) return "";
  try {
    return new Date(timestamp).toLocaleString("ko-KR");
  } catch {
    return "";
  }
}

function readFieldValue(form: HTMLFormElement, name: string) {
  const fields = form.querySelectorAll(`[name="${name}"]`);

  if (!fields.length) return "";

  if (fields.length > 1) {
    const values: string[] = [];

    fields.forEach((field) => {
      if (field instanceof HTMLInputElement) {
        if ((field.type === "checkbox" || field.type === "radio") && field.checked) {
          values.push(field.value);
        }
      }
    });

    return values;
  }

  const field = form.elements.namedItem(name);

  if (!field) return "";

  if (field instanceof RadioNodeList) {
    const checked = Array.from(field).find((item) => {
      return item instanceof HTMLInputElement && item.checked;
    });

    return checked instanceof HTMLInputElement ? checked.value : "";
  }

  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLTextAreaElement ||
    field instanceof HTMLSelectElement
  ) {
    return field.value ?? "";
  }

  return "";
}

function writeFieldValue(form: HTMLFormElement, name: string, value: string | string[]) {
  const fields = form.querySelectorAll(`[name="${name}"]`);

  if (!fields.length) return;

  if (fields.length > 1) {
    const values = Array.isArray(value) ? value : [value];

    fields.forEach((field) => {
      if (field instanceof HTMLInputElement) {
        if (field.type === "checkbox" || field.type === "radio") {
          field.checked = values.includes(field.value);
          field.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    });

    return;
  }

  const field = form.elements.namedItem(name);

  if (!field) return;

  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLTextAreaElement ||
    field instanceof HTMLSelectElement
  ) {
    field.value = Array.isArray(value) ? value[0] ?? "" : value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  if (field instanceof RadioNodeList) {
    Array.from(field).forEach((item) => {
      if (item instanceof HTMLInputElement) {
        item.checked = item.value === value;
      }
    });
  }
}

function StorySubmitButtons({
  intent,
  setIntent,
  savedAtText,
  onClearDraft,
  onSaveNow,
  onToggleDraftList,
  showDraftList,
  showViewButton,
}: {
  intent: string;
  setIntent: (next: "view" | "edit") => void;
  savedAtText: string;
  onClearDraft: () => void;
  onSaveNow: () => void;
  onToggleDraftList: () => void;
  showDraftList: boolean;
  showViewButton: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        marginTop: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {showViewButton ? (
          <button
            type="submit"
            className="primary-button"
            onClick={() => setIntent("view")}
            disabled={pending}
          >
            {pending && intent === "view" ? "저장 중..." : "저장 후 공개보기"}
          </button>
        ) : null}

        <button
          type="submit"
          className="nav-link"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
          onClick={() => setIntent("edit")}
          disabled={pending}
        >
          {pending && intent === "edit" ? "저장 중..." : "저장 후 계속 편집"}
        </button>

        <button
          type="button"
          className="nav-link"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
          onClick={onSaveNow}
        >
          지금 임시저장
        </button>

        <button
          type="button"
          className="nav-link"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
          onClick={onToggleDraftList}
        >
          {showDraftList ? "임시저장 목록 닫기" : "임시저장 목록"}
        </button>

        <button
          type="button"
          className="nav-link"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
          onClick={onClearDraft}
        >
          임시저장 비우기
        </button>
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#b8adb9",
        }}
      >
        {savedAtText ? `최근 임시저장: ${savedAtText}` : "임시저장 없음"}
      </div>
    </div>
  );
}

export default function StoryFormEnhancer({
  storageKey,
  showViewButton = true,
}: StoryFormEnhancerProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [intent, setIntent] = useState<"view" | "edit">("view");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [draftHistory, setDraftHistory] = useState<DraftPayload[]>([]);
  const [showDraftList, setShowDraftList] = useState(false);

  const savedAtText = useMemo(() => formatSavedAt(savedAt), [savedAt]);

  const historyKey = `${storageKey}:history`;
  const MAX_DRAFTS = 4;
  const AUTOSAVE_MS = 10 * 60 * 1000;

  function readHistory(): DraftPayload[] {
    try {
      const raw = window.localStorage.getItem(historyKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item) =>
          item &&
          typeof item === "object" &&
          typeof item.updatedAt === "number" &&
          item.values
      ) as DraftPayload[];
    } catch {
      return [];
    }
  }

  function writeHistory(next: DraftPayload[]) {
    window.localStorage.setItem(historyKey, JSON.stringify(next));
    setDraftHistory(next);
    setSavedAt(next[0]?.updatedAt ?? null);
  }

  function collectDraft(form: HTMLFormElement): DraftPayload {
    const values: Record<string, string | string[]> = {};

    for (const fieldName of FIELD_NAMES) {
      values[fieldName] = readFieldValue(form, fieldName);
    }

    return {
      updatedAt: Date.now(),
      values,
    };
  }

  function saveDraft(form: HTMLFormElement) {
    const payload = collectDraft(form);
    const current = readHistory();

    const next = [payload, ...current].slice(0, MAX_DRAFTS);
    writeHistory(next);

    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }

  function restoreDraft(form: HTMLFormElement, payload: DraftPayload) {
    for (const [name, value] of Object.entries(payload.values)) {
      writeFieldValue(form, name, value ?? "");
    }

    ["translationBodyCn", "translationBodyKr", "translationBody"].forEach((fieldName) => {
      const field = form.elements.namedItem(fieldName);
      if (field instanceof HTMLTextAreaElement) {
        field.dispatchEvent(
          new CustomEvent("story-draft-restore", { bubbles: false })
        );
      }
    });

    setSavedAt(payload.updatedAt ?? null);
  }

  useEffect(() => {
    const rawHistory = readHistory();
    setDraftHistory(rawHistory);
    setSavedAt(rawHistory[0]?.updatedAt ?? null);
  }, [historyKey]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const form = wrapper.closest("form");
    if (!form) return;

    const intervalId = window.setInterval(() => {
      saveDraft(form);
    }, AUTOSAVE_MS);

    return () => window.clearInterval(intervalId);
  }, [storageKey]);

  return (
    <div ref={wrapperRef}>
<input type="hidden" name="submitIntent" value={intent} />
      
      <StorySubmitButtons
        intent={intent}
        setIntent={setIntent}
        savedAtText={savedAtText}
        onClearDraft={() => {
          window.localStorage.removeItem(storageKey);
          window.localStorage.removeItem(historyKey);
          setDraftHistory([]);
          setSavedAt(null);
        }}
        onSaveNow={() => {
          const wrapper = wrapperRef.current;
          if (!wrapper) return;
          const form = wrapper.closest("form");
          if (!form) return;
          saveDraft(form);
        }}
        onToggleDraftList={() => {
          setShowDraftList((prev) => !prev);
        }}
        showDraftList={showDraftList}
        showViewButton={showViewButton}
      />

      {showDraftList ? (
        <div
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(176, 203, 224, 0.35)",
            background: "rgba(255,255,255,0.7)",
            display: "grid",
            gap: 10,
          }}
        >
          {draftHistory.length === 0 ? (
            <div style={{ fontSize: 13, color: "#8e9aa5" }}>
              저장된 임시저장이 없습니다.
            </div>
          ) : (
            draftHistory.map((draft, index) => (
              <div
                key={`${draft.updatedAt}-${index}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: 13, color: "#6e8090" }}>
                  {formatSavedAt(draft.updatedAt) || "시간 없음"}
                </div>

                <button
                  type="button"
                  className="nav-link"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    const wrapper = wrapperRef.current;
                    if (!wrapper) return;
                    const form = wrapper.closest("form");
                    if (!form) return;
                    restoreDraft(form, draft);
                  }}
                >
                  불러오기
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}