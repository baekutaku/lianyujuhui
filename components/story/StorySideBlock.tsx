"use client";

import { useState } from "react";

type Props = {
  title: string;
  count: number;
  children: React.ReactNode;
};

export default function StorySideBlock({ title, count, children }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="story-side-block">
      <button
        type="button"
        className="story-side-summary"
        onClick={() => setOpen((prev) => !prev)}
        style={{ width: "100%", background: "none", border: 0, padding: 0, cursor: "pointer", textAlign: "left" }}
      >
        <div className="story-side-title-row">
          <h2 className="story-side-title">{title}</h2>
          <span className="story-side-count">{count}</span>
        </div>
        <span
          className="story-side-toggle"
          aria-hidden="true"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block", transition: "transform 0.18s ease" }}
        >
          ▾
        </span>
      </button>

  {open ? (
<div
          style={{
            paddingTop: 6,
            overflowX: "auto",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            maxHeight: 120,
            marginLeft: -11,
            marginRight: -11,
            paddingLeft: 11,
            paddingRight: 11,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 5,
            }}
          >
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}