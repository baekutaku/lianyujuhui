"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ConnectedItem = {
  id: string;
  title: string;
  href: string;
  kicker?: string | null;
};

type ConnectedTab = {
  key: "story" | "phone" | "card" | "event";
  label: string;
  emptyLabel: string;
  items: ConnectedItem[];
};

type Props = {
  storyLabel?: string;
  stories: ConnectedItem[];
  phoneItems: ConnectedItem[];
  cards: ConnectedItem[];
  events: ConnectedItem[];
};

export default function CardConnectedContent({
  storyLabel = "스토리",
  stories,
  phoneItems,
  cards,
  events,
}: Props) {
  const tabs = useMemo<ConnectedTab[]>(
    () => [
      {
        key: "story",
        label: storyLabel,
        emptyLabel: "연결된 스토리가 없습니다.",
        items: stories,
      },
      {
        key: "phone",
        label: "휴대폰",
        emptyLabel: "연결된 휴대폰 콘텐츠가 없습니다.",
        items: phoneItems,
      },
      {
        key: "card",
        label: "카드",
        emptyLabel: "연결된 카드가 없습니다.",
        items: cards,
      },
      {
        key: "event",
        label: "이벤트",
        emptyLabel: "관련 이벤트가 없습니다.",
        items: events,
      },
    ],
    [storyLabel, stories, phoneItems, cards, events]
  );

  const firstNonEmptyKey =
    tabs.find((tab) => tab.items.length > 0)?.key ?? "story";
  const [activeKey, setActiveKey] =
    useState<ConnectedTab["key"]>(firstNonEmptyKey);

  const activeTab =
    tabs.find((tab) => tab.key === activeKey) ?? tabs[0];

  const total = tabs.reduce((sum, tab) => sum + tab.items.length, 0);

  return (
    <section className="card-connected-panel">
      <div className="card-connected-panel-head">
        <div>
          <p className="card-connected-eyebrow">CONNECTED CONTENT</p>
          <h2 className="card-connected-title">연결 콘텐츠</h2>
        </div>
        {total > 0 ? (
          <span className="card-connected-total">{total}</span>
        ) : null}
      </div>

      <div className="card-connected-tabs" role="tablist" aria-label="연결 콘텐츠">
        {tabs.map((tab) => {
          const active = tab.key === activeTab.key;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`card-connected-tab${active ? " is-active" : ""}${
                tab.items.length === 0 ? " is-empty" : ""
              }`}
              onClick={() => setActiveKey(tab.key)}
            >
              {tab.label}
              {tab.items.length > 0 ? (
                <span className="card-connected-tab-count">
                  {tab.items.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        className="card-connected-content"
        role="tabpanel"
        aria-label={activeTab.label}
      >
        {activeTab.items.length > 0 ? (
          <div className="card-connected-list">
            {activeTab.items.map((item) => (
              <Link
                key={`${activeTab.key}-${item.id}`}
                href={item.href}
                className="card-connected-link"
              >
                <span className="card-connected-link-copy">
                  {item.kicker ? (
                    <span className="card-connected-kicker">
                      {item.kicker}
                    </span>
                  ) : null}
                  <strong>{item.title}</strong>
                </span>
                <span className="card-connected-arrow" aria-hidden="true">
                  ›
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card-connected-empty">{activeTab.emptyLabel}</div>
        )}
      </div>
    </section>
  );
}
