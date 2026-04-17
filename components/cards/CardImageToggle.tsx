"use client";

import { useMemo, useState } from "react";

type CardMedia = {
  beforeThumb?: string | null;
  afterThumb?: string | null;
  beforeCover?: string | null;
  afterCover?: string | null;
  title: string;
};

export default function CardImageToggle({
  media,
}: {
  media: CardMedia;
}) {
  const hasAfter = Boolean(media.afterCover || media.afterThumb);
  const [mode, setMode] = useState<"before" | "after">("before");

  const imageUrl = useMemo(() => {
    return mode === "after"
      ? media.afterCover || media.afterThumb || media.beforeCover || media.beforeThumb || ""
      : media.beforeCover || media.beforeThumb || media.afterCover || media.afterThumb || "";
  }, [media, mode]);

  if (!imageUrl) {
    return <div className="empty-box">등록된 카드 이미지가 없습니다.</div>;
  }

  return (
    <div className="card-detail-media-shell">
      {hasAfter ? (
        <div className="card-detail-media-tabs">
          <button
            type="button"
            className={`card-detail-tab ${mode === "before" ? "is-active" : ""}`}
            onClick={() => setMode("before")}
          >
            진화 전
          </button>
          <button
            type="button"
            className={`card-detail-tab ${mode === "after" ? "is-active" : ""}`}
            onClick={() => setMode("after")}
          >
            진화 후
          </button>
        </div>
      ) : null}

      <div className="card-detail-media-frame">
        <img
          src={imageUrl}
          alt={`${media.title} ${mode === "after" ? "진화 후" : "진화 전"}`}
          className="card-detail-main-image"
        />
      </div>
    </div>
  );
}