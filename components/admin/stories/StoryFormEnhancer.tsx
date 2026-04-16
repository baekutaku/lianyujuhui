"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

const FIELD_NAMES = [
  "title",
  "subtype",
  "releaseYear",
  "releaseDate",
  "summary",
  "serverKey",
  "characterKey",
  "translationTitleCn",
  "translationBodyCn",
  "translationTitleKr",
  "translationBodyKr",
  "youtubeUrlCn",
  "youtubeUrlKr",
  "coverImageUrl",
  "cardSlug",
  "visibility",
  "accessPassword",
  "accessHint",
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
  showViewButton,
}: {
  intent: string;
  setIntent: (next: "view" | "edit") => void;
  savedAtText: string;
  onClearDraft: () => void;
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
        {savedAtText ? `임시저장: ${savedAtText}` : "임시저장 없음"}
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
  const restoredRef = useRef(false);

  const savedAtText = useMemo(() => formatSavedAt(savedAt), [savedAt]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const form = wrapper.closest("form");
    if (!form) return;

    const rawDraft = window.localStorage.getItem(storageKey);
    if (!rawDraft || restoredRef.current) return;

    try {
      const parsed = JSON.parse(rawDraft) as DraftPayload;
      if (!parsed?.values || typeof parsed !== "object") return;

      setSavedAt(parsed.updatedAt ?? null);

      const ok = window.confirm("이전에 작성하던 임시저장을 복원할까요?");
      if (!ok) return;

      for (const [name, value] of Object.entries(parsed.values)) {
        writeFieldValue(form, name, value ?? "");
      }

      ["translationBodyCn", "translationBodyKr"].forEach((fieldName) => {
  const field = form.elements.namedItem(fieldName);
  if (field instanceof HTMLTextAreaElement) {
    field.dispatchEvent(
      new CustomEvent("story-draft-restore", { bubbles: false })
    );
  }
});

      restoredRef.current = true;
    } catch (error) {
      console.error("[StoryFormEnhancer] draft restore failed", error);
    }
  }, [storageKey]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const form = wrapper.closest("form");
    if (!form) return;

    const intervalId = window.setInterval(() => {
      const values: Record<string, string | string[]> = {};

      for (const fieldName of FIELD_NAMES) {
        values[fieldName] = readFieldValue(form, fieldName);
      }

      const payload: DraftPayload = {
        updatedAt: Date.now(),
        values,
      };

      window.localStorage.setItem(storageKey, JSON.stringify(payload));
      setSavedAt(payload.updatedAt);
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [storageKey]);

  return (
    <div ref={wrapperRef}>
      
      <StorySubmitButtons
        intent={intent}
        setIntent={setIntent}
        savedAtText={savedAtText}
        onClearDraft={() => {
          window.localStorage.removeItem(storageKey);
          setSavedAt(null);
        }}
        showViewButton={showViewButton}
      />
    </div>
  );
}