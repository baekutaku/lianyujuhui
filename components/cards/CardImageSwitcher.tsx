"use client";

import { useState } from "react";

type Props = {
  title: string;
  beforeImageUrl: string;
  afterImageUrl?: string;
};

export default function CardImageSwitcher({
  title,
  beforeImageUrl,
  afterImageUrl = "",
}: Props) {
  const hasAfter = !!afterImageUrl;
  const [mode, setMode] = useState<"before" | "after">("before");

  const imageUrl =
    mode === "after" && hasAfter ? afterImageUrl : beforeImageUrl;

  return (
    <div style={{ width: "100%" }}>
      {hasAfter ? (
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "14px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="mini-button"
            onClick={() => setMode("before")}
            style={{
              opacity: mode === "before" ? 1 : 0.7,
            }}
          >
            진화 전
          </button>

          <button
            type="button"
            className="mini-button"
            onClick={() => setMode("after")}
            style={{
              opacity: mode === "after" ? 1 : 0.7,
            }}
          >
            진화 후
          </button>
        </div>
      ) : null}

      <div
        className="story-thumb-media"
        style={{ maxWidth: "360px", aspectRatio: "9 / 16", margin: "0 auto" }}
      >
        <img
          src={imageUrl}
          alt={title}
          className="story-thumb-image"
        />
      </div>
    </div>
  );
}