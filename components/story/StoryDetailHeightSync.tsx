"use client";

import { useEffect } from "react";

export default function StoryDetailHeightSync() {
  useEffect(() => {
    const grid = document.querySelector<HTMLElement>(".story-main-grid");
    if (!grid) return;

    const target =
      grid.querySelector<HTMLElement>(".media-embed-wrap") ||
      grid.querySelector<HTMLElement>(".story-detail-image") ||
      grid.querySelector<HTMLElement>(".story-media-box");

    if (!target) return;

    const sync = () => {
      if (window.innerWidth <= 1100) {
        grid.style.removeProperty("--story-media-height");
        return;
      }

      const rect = target.getBoundingClientRect();
      if (!rect.height) return;

      grid.style.setProperty("--story-media-height", `${Math.round(rect.height)}px`);
    };

    const ro = new ResizeObserver(sync);
    ro.observe(target);
    window.addEventListener("resize", sync);
    sync();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  return null;
}