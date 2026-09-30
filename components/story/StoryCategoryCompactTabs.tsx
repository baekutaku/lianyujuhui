"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type StoryCategoryItem = {
  key: string;
  label: string;
  href: string;
};

type Props = {
  items: StoryCategoryItem[];
  activeKey: string;
  primaryKeys?: string[];
  storageKey?: string;
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function StoryCategoryCompactTabs({
  items,
  activeKey,
  primaryKeys = ["all", "main", "card"],
  storageKey,
}: Props) {
  const primarySet = useMemo(() => new Set(primaryKeys), [primaryKeys]);

  const primaryItems = useMemo(
    () => items.filter((item) => primarySet.has(item.key)),
    [items, primarySet]
  );

  const secondaryItems = useMemo(
    () => items.filter((item) => !primarySet.has(item.key)),
    [items, primarySet]
  );

  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem(storageKey);
    if (saved === "1") {
      setExpanded(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKey, expanded ? "1" : "0");
  }, [expanded, storageKey]);

  return (
    <div className="story-category-compact">
      <div className="story-category-row story-category-row-primary">
        {primaryItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "story-category-chip",
              item.key === activeKey && "is-active"
            )}
          >
            {item.label}
          </Link>
        ))}

        {secondaryItems.length > 0 ? (
          <button
            type="button"
            className={cn(
              "story-category-chip",
              "story-category-toggle",
              expanded && "is-active"
            )}
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
          >
            {expanded ? "접기" : "+ 더보기"}
          </button>
        ) : null}
      </div>

      {secondaryItems.length > 0 ? (
        <div
          className={cn(
            "story-category-row",
            "story-category-row-secondary",
            expanded && "is-open"
          )}
        >
          {secondaryItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "story-category-chip",
                item.key === activeKey && "is-active"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}