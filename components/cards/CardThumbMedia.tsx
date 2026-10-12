"use client";

import { useState } from "react";

type Props = {
  beforeSrc: string;
  afterSrc?: string | null;
  title: string;
  badge?: string | null;
  eager?: boolean;
};

export default function CardThumbMedia({
  beforeSrc,
  afterSrc,
  title,
  badge,
  eager = false,
}: Props) {
  const [loadAfter, setLoadAfter] = useState(false);
  const hasAfter = Boolean(afterSrc);

  function activateAfter() {
    if (hasAfter) setLoadAfter(true);
  }

  return (
    <div
      className={`card-thumb-media${hasAfter ? " has-after" : ""}`}
      onPointerEnter={activateAfter}
      onFocusCapture={activateAfter}
      onTouchStart={activateAfter}
    >
      {badge ? (
        <div className="card-thumb-badges">
          <span className="card-thumb-rarity">{badge}</span>
        </div>
      ) : null}

      <img
        src={beforeSrc}
        alt={title}
        className="card-thumb-image card-thumb-image-before"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "low"}
      />

      {hasAfter && loadAfter ? (
        <img
          src={afterSrc || ""}
          alt={`${title} evolution after`}
          className="card-thumb-image card-thumb-image-after"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
        />
      ) : null}

      <div className="card-thumb-overlay">
        <div className="card-thumb-overlay-inner">
          <h2 className="card-thumb-overlay-title">{title}</h2>
        </div>
      </div>
    </div>
  );
}
