"use client";

import { useState } from "react";

type TextEntry = {
  type: "text";
  side: "left" | "right";
  text: string;
};

type ImageEntry = {
  type: "image";
  side: "left" | "right";
  url: string;
  caption?: string;
};

type AudioEntry = {
  type: "audio";
  side: "left" | "right";
  url: string;
  duration?: string;
  transcript?: string;
};

type SystemEntry = {
  type: "system";
  text: string;
};

type ChoiceOption =
  | string
  | {
      id?: string;
      label: string;
      result?: MessageEntry[];
    };

type ChoiceEntry = {
  type: "choice";
  options: ChoiceOption[];
  selectedIndex?: number;
};

type MessageEntry =
  | TextEntry
  | ImageEntry
  | AudioEntry
  | SystemEntry
  | ChoiceEntry;

type MessageThreadViewProps = {
  avatarUrl: string;
  entries: MessageEntry[];
};

function normalizeChoiceOption(option: ChoiceOption) {
  if (typeof option === "string") {
    return {
      label: option,
      result: [] as MessageEntry[],
    };
  }

  return {
    label: option.label ?? "",
    result: Array.isArray(option.result) ? option.result : [],
  };
}

function ThreadEntries({
  avatarUrl,
  entries,
}: {
  avatarUrl: string;
  entries: MessageEntry[];
}) {
  return (
    <>
      {entries.map((entry, index) => {
        if (entry.type === "system") {
          return (
            <div key={index} className="thread-date">
              {entry.text}
            </div>
          );
        }

        if (entry.type === "choice") {
          return <ChoiceBlock key={index} avatarUrl={avatarUrl} entry={entry} />;
        }

        if (entry.type === "image") {
          return (
            <div key={index} className={`thread-row ${entry.side}`}>
              {entry.side === "left" ? (
                <img src={avatarUrl} alt="" className="thread-mini-avatar" />
              ) : null}

              <div className="thread-bubble thread-image-bubble">
                <img
                  src={entry.url}
                  alt={entry.caption ?? "message image"}
                  className="thread-image"
                />
                {entry.caption ? (
                  <div className="thread-image-caption">{entry.caption}</div>
                ) : null}
              </div>
            </div>
          );
        }

        if (entry.type === "audio") {
          return (
            <div key={index} className={`thread-row ${entry.side}`}>
              {entry.side === "left" ? (
                <img src={avatarUrl} alt="" className="thread-mini-avatar" />
              ) : null}

              <div className="thread-bubble thread-audio-bubble">
                <audio controls src={entry.url} className="thread-audio" />
                {entry.duration ? (
                  <div className="thread-audio-duration">{entry.duration}</div>
                ) : null}
                {entry.transcript ? (
                  <div className="thread-audio-transcript">
                    {entry.transcript}
                  </div>
                ) : null}
              </div>
            </div>
          );
        }

        return (
          <div key={index} className={`thread-row ${entry.side}`}>
            {entry.side === "left" ? (
              <img src={avatarUrl} alt="" className="thread-mini-avatar" />
            ) : null}

            <div className="thread-bubble">{entry.text}</div>
          </div>
        );
      })}
    </>
  );
}

function ChoiceBlock({
  avatarUrl,
  entry,
}: {
  avatarUrl: string;
  entry: ChoiceEntry;
}) {
  const options = (entry.options || []).map(normalizeChoiceOption);
  const [selectedIndex, setSelectedIndex] = useState(
    Math.min(entry.selectedIndex ?? 0, Math.max(options.length - 1, 0))
  );
  const [isOpen, setIsOpen] = useState(false);

  const selected = options[selectedIndex];

  return (
    <div className="thread-choice-block">
      {selected ? (
        <div className="thread-row right thread-choice-row">
          <button
            type="button"
            className="thread-choice-inline-btn"
            onClick={() => setIsOpen(true)}
            aria-label="선택지 변경"
            title="선택지 변경"
          >
            ↻
          </button>
          <div className="thread-bubble thread-choice-selected">
            {selected.label}
          </div>
        </div>
      ) : null}

      {selected?.result?.length ? (
        <div className="thread-choice-result">
          <ThreadEntries avatarUrl={avatarUrl} entries={selected.result} />
        </div>
      ) : null}

      {isOpen ? (
        <div className="thread-choice-modal-backdrop">
          <div className="thread-choice-modal">
            <div className="thread-choice-modal-head">
              <strong>회상 선택지</strong>
              <button
                type="button"
                className="thread-choice-close-btn"
                onClick={() => setIsOpen(false)}
              >
                닫기
              </button>
            </div>

            <div className="thread-choice-modal-list">
              {options.map((option, index) => (
                <button
                  key={`${option.label}-${index}`}
                  type="button"
                  className={`thread-choice-modal-item ${
                    selectedIndex === index ? "is-active" : ""
                  }`}
                  onClick={() => {
                    setSelectedIndex(index);
                    setIsOpen(false);
                  }}
                >
                  <span className="thread-choice-modal-label">
                    {option.label}
                  </span>
                  {selectedIndex === index ? (
                    <span className="thread-choice-modal-badge">현재</span>
                  ) : null}
                </button>
              ))}
            </div>

            <div className="thread-choice-modal-note">
              선택지를 바꿔도 원본 기록은 바뀌지 않습니다.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function MessageThreadView({
  avatarUrl,
  entries,
}: MessageThreadViewProps) {
  return (
    <>
      <div className="thread-wrap">
        <ThreadEntries avatarUrl={avatarUrl} entries={entries} />
      </div>

      <div className="thread-toolbar">
  <button type="button" className="thread-toolbar-btn" aria-label="음성">
    <span className="material-symbols-rounded">volume_up</span>
  </button>

  <div className="thread-toolbar-input" />

  <button type="button" className="thread-toolbar-btn" aria-label="이모지">
    <span className="material-symbols-rounded">mood</span>
  </button>

  <button type="button" className="thread-toolbar-btn" aria-label="추가">
    <span className="material-symbols-rounded">add</span>
  </button>
</div>
    </>
  );
}