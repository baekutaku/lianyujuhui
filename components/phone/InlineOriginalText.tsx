"use client";

import { useState } from "react";

type InlineOriginalTextProps = {
  text: string;
  originalText?: string | null;
  iconColor?: string;
  originalColor?: string;
  originalBackground?: string;
  originalFontSize?: number | string;
};

export default function InlineOriginalText({
  text,
  originalText,
  iconColor = "#ad91c6",
  originalColor = "#786d79",
  originalBackground = "rgba(247, 239, 246, 0.82)",
  originalFontSize = "0.9em",
}: InlineOriginalTextProps) {
  const [open, setOpen] = useState(false);
  const original = String(originalText || "").trim();

  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      <span>{text}</span>
      {original ? (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "원문 닫기" : "원문 보기"}
          title={open ? "원문 닫기" : "원문 보기"}
          aria-expanded={open}
          style={{
            width: 20,
            height: 20,
            marginLeft: 4,
            padding: 0,
            border: "1px solid rgba(187, 170, 199, 0.45)",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.68)",
            color: iconColor,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            verticalAlign: "-4px",
            cursor: "pointer",
            flex: "0 0 auto",
          }}
        >
          <span
            className="material-symbols-rounded"
            style={{ fontSize: 13, lineHeight: 1 }}
          >
            translate
          </span>
        </button>
      ) : null}

      {open && original ? (
        <span
          style={{
            display: "block",
            marginTop: 6,
            padding: "7px 9px",
            borderRadius: 7,
            background: originalBackground,
            color: originalColor,
            fontSize: originalFontSize,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}
        >
          {original}
        </span>
      ) : null}
    </span>
  );
}
