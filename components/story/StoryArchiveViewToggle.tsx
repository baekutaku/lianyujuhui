"use client";

import { useEffect, useState } from "react";

type ViewMode = "large" | "compact";

const STORAGE_KEY = "story-archive-view-mode";
const ROOT_CLASS = "story-archive-compact";

export default function StoryArchiveViewToggle() {
  const [mode, setMode] = useState<ViewMode>("large");

  const applyMode = (next: ViewMode) => {
    document.documentElement.classList.toggle(
      ROOT_CLASS,
      next === "compact"
    );
  };

  useEffect(() => {
    const saved =
      window.localStorage.getItem(STORAGE_KEY) === "compact"
        ? "compact"
        : "large";

    setMode(saved);
    applyMode(saved);

    return () => {
      document.documentElement.classList.remove(ROOT_CLASS);
    };
  }, []);

  const changeMode = (next: ViewMode) => {
    setMode(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyMode(next);
  };

  return (
    <div className="story-view-toggle" aria-label="스토리 보기 방식">
      <button
        type="button"
        className={`story-view-toggle-button ${
          mode === "large" ? "is-active" : ""
        }`}
        onClick={() => changeMode("large")}
        aria-pressed={mode === "large"}
        title="크게 보기"
      >
        <span className="material-symbols-rounded" aria-hidden="true">
          view_agenda
        </span>
        <span>크게</span>
      </button>

      <button
        type="button"
        className={`story-view-toggle-button ${
          mode === "compact" ? "is-active" : ""
        }`}
        onClick={() => changeMode("compact")}
        aria-pressed={mode === "compact"}
        title="작게 보기"
      >
        <span className="material-symbols-rounded" aria-hidden="true">
          grid_view
        </span>
        <span>작게</span>
      </button>
    </div>
  );
}
