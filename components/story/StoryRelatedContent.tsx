"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type RelatedItem = {
  id: string;
  title: string;
  href: string;
};

type Props = {
  stories: RelatedItem[];
  cards: RelatedItem[];
  phoneItems: RelatedItem[];
  events: RelatedItem[];
};

export default function StoryRelatedContent({
  stories,
  cards,
  phoneItems,
  events,
}: Props) {
  const tabs = useMemo(
    () => [
      { key: "stories", label: "스토리", items: stories },
      { key: "cards", label: "카드", items: cards },
      { key: "phone", label: "휴대폰", items: phoneItems },
      { key: "events", label: "이벤트", items: events },
    ],
    [stories, cards, phoneItems, events]
  );

  const total = tabs.reduce((sum, tab) => sum + tab.items.length, 0);
  const firstAvailable =
    tabs.find((tab) => tab.items.length > 0)?.key ?? "stories";

  const [activeKey, setActiveKey] = useState(firstAvailable);
  const activeTab = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];

  if (total === 0) return null;

  return (
    <section className="story-related-figma">
      <div className="story-related-figma-head">
        <div>
          <p>RELATED CONTENT</p>
          <h2>연결 콘텐츠</h2>
        </div>
        <span className="story-related-figma-total">{total}</span>
      </div>

      <div className="story-related-figma-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab.key === tab.key}
            className={`story-related-figma-tab${
              activeTab.key === tab.key ? " is-active" : ""
            }${tab.items.length === 0 ? " is-empty" : ""}`}
            onClick={() => setActiveKey(tab.key)}
          >
            {tab.label}
            {tab.items.length > 0 ? <span>{tab.items.length}</span> : null}
          </button>
        ))}
      </div>

      <div className="story-related-figma-body" role="tabpanel">
        {activeTab.items.length > 0 ? (
          <div className="story-related-figma-grid">
            {activeTab.items.map((item) => (
              <Link
                key={`${activeTab.key}-${item.id}`}
                href={item.href}
                className="story-related-figma-link"
              >
                <span>{item.title}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="story-related-figma-empty">
            연결된 {activeTab.label} 콘텐츠가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}
