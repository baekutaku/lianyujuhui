"use client";

import { useEffect, useState } from "react";

type ViewMode = "large" | "compact";

type Props = {
  storageKey?: string;
};

export default function StoryArchiveViewToggle({
  storageKey = "story-archive-event-view",
}: Props) {
  const [mode, setMode] = useState<ViewMode>("large");

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);

    const nextMode: ViewMode =
      stored === "compact" ||
      (!stored &&
        document.documentElement.classList.contains(
          "story-archive-compact"
        ))
        ? "compact"
        : "large";

    setMode(nextMode);

    document.documentElement.classList.toggle(
      "story-archive-compact",
      nextMode === "compact"
    );

    return () => {
      document.documentElement.classList.remove(
        "story-archive-compact"
      );
    };
  }, [storageKey]);

  function changeMode(nextMode: ViewMode) {
    setMode(nextMode);

    window.localStorage.setItem(storageKey, nextMode);

    document.documentElement.classList.toggle(
      "story-archive-compact",
      nextMode === "compact"
    );
  }

  return (
    <div
      className="story-view-toggle"
      role="group"
      aria-label="목록 보기 방식"
    >
      <button
        type="button"
        className={`story-view-toggle-button ${
          mode === "large" ? "is-active" : ""
        }`}
        onClick={() => changeMode("large")}
        aria-pressed={mode === "large"}
      >
        <span className="material-symbols-rounded">
          view_agenda
        </span>
        크게
      </button>

      <button
        type="button"
        className={`story-view-toggle-button ${
          mode === "compact" ? "is-active" : ""
        }`}
        onClick={() => changeMode("compact")}
        aria-pressed={mode === "compact"}
      >
        <span className="material-symbols-rounded">
          grid_view
        </span>
        작게
      </button>
    </div>
  );
}
