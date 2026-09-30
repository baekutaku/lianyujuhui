"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MAKER_DEFAULT_MY_AVATAR } from "@/lib/maker/defaults";

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

type Props = {
  entries: MessageEntry[];
  otherAvatarUrl: string;
  myAvatarUrl: string;
  otherProfileHref: string;
  myProfileHref: string;
};

const DEFAULT_OTHER_AVATAR = "/profile/baiqi.png";

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

function SafeAvatar({
  src,
  fallbackSrc,
}: {
  src?: string;
  fallbackSrc: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src?.trim() || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src?.trim() || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <img
      src={currentSrc}
      alt=""
      className="thread-mini-avatar"
      onError={() => setCurrentSrc(fallbackSrc)}
    />
  );
}

function ChoiceBlock({
  otherAvatarUrl,
  myAvatarUrl,
  otherProfileHref,
  myProfileHref,
  entry,
}: {
  otherAvatarUrl: string;
  myAvatarUrl: string;
  otherProfileHref: string;
  myProfileHref: string;
  entry: ChoiceEntry;
}) {
  const options = (entry.options || []).map(normalizeChoiceOption);

  const persistedIndex = Math.min(
    typeof entry.selectedIndex === "number" ? entry.selectedIndex : 0,
    Math.max(options.length - 1, 0)
  );

  const [selectedIndex, setSelectedIndex] = useState(persistedIndex);
  const [draftSelectedIndex, setDraftSelectedIndex] = useState(persistedIndex);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSelectedIndex(persistedIndex);
    setDraftSelectedIndex(persistedIndex);
  }, [persistedIndex]);

  useEffect(() => {
    if (!isOpen) return;

    setDraftSelectedIndex(selectedIndex);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, selectedIndex]);

  const selected = options[selectedIndex] ?? null;
  const selectedResult = Array.isArray(selected?.result) ? selected.result : [];

  const handleConfirm = () => {
    if (!options.length) return;

    setSelectedIndex(draftSelectedIndex);
    setIsOpen(false);
  };

  return (
    <div className="thread-choice-block">
      {selected ? (
        <div className="thread-row right thread-choice-row">
          <button
            type="button"
            className="thread-choice-inline-btn"
            onClick={() => setIsOpen(true)}
            aria-label="회상 선택지"
            title="회상 선택지"
          >
            <span className="material-symbols-rounded">autorenew</span>
          </button>

          <div className="thread-bubble thread-choice-selected">
            {selected.label}
          </div>

          <Link href={myProfileHref} className="thread-mini-avatar-link">
            <SafeAvatar
              src={myAvatarUrl}
              fallbackSrc={MAKER_DEFAULT_MY_AVATAR}
            />
          </Link>
        </div>
      ) : null}

      {selectedResult.length > 0 ? (
        <div className="thread-choice-result">
          <ThreadEntries
            otherAvatarUrl={otherAvatarUrl}
            myAvatarUrl={myAvatarUrl}
            otherProfileHref={otherProfileHref}
            myProfileHref={myProfileHref}
            entries={selectedResult}
          />
        </div>
      ) : null}

      {isOpen ? (
        <div
          className="moment-choice-modal-backdrop thread-choice-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="회상 선택지"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="moment-choice-modal thread-choice-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="moment-choice-modal-header">
              <h3 className="moment-choice-modal-title">회상 선택지</h3>

              <button
                type="button"
                className="moment-choice-modal-close"
                onClick={() => setIsOpen(false)}
                aria-label="닫기"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <p className="moment-choice-modal-desc">
              선택지를 바꾸면 이 대화에 표시되는 답변이 변경됩니다.
            </p>

            <div className="moment-choice-option-list thread-choice-modal-list">
              {options.map((option, index) => {
                const active = draftSelectedIndex === index;

                return (
                  <button
                    key={`${option.label}-${index}`}
                    type="button"
                    className={`moment-choice-option thread-choice-modal-item ${
                      active ? "active" : ""
                    }`}
                    onClick={() => setDraftSelectedIndex(index)}
                  >
                    <span className="moment-choice-option-label thread-choice-modal-label">
                      {option.label}
                    </span>

                    {active ? (
                      <span className="moment-choice-option-badge thread-choice-modal-badge">
                        회상
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="moment-choice-modal-footer">
              <button
                type="button"
                className="moment-choice-confirm"
                onClick={handleConfirm}
                disabled={!options.length}
              >
                확인 변경
              </button>

              <p className="moment-choice-modal-note">
                회상 선택지를 바꿔도 원본 채팅 기록은 바뀌지 않습니다.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ThreadEntries({
  otherAvatarUrl,
  myAvatarUrl,
  otherProfileHref,
  myProfileHref,
  entries,
}: {
  otherAvatarUrl: string;
  myAvatarUrl: string;
  otherProfileHref: string;
  myProfileHref: string;
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
          return (
            <ChoiceBlock
              key={index}
              otherAvatarUrl={otherAvatarUrl}
              myAvatarUrl={myAvatarUrl}
              otherProfileHref={otherProfileHref}
              myProfileHref={myProfileHref}
              entry={entry}
            />
          );
        }

        if (entry.type === "image") {
          if (entry.side === "left") {
            return (
              <div key={index} className="thread-row left">
                <Link href={otherProfileHref} className="thread-mini-avatar-link">
                  <SafeAvatar
                    src={otherAvatarUrl}
                    fallbackSrc={DEFAULT_OTHER_AVATAR}
                  />
                </Link>
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

          return (
            <div key={index} className="thread-row right">
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
              <Link href={myProfileHref} className="thread-mini-avatar-link">
                <SafeAvatar src={myAvatarUrl} fallbackSrc={MAKER_DEFAULT_MY_AVATAR} />
              </Link>
            </div>
          );
        }

        if (entry.type === "audio") {
          if (entry.side === "left") {
            return (
              <div key={index} className="thread-row left">
                <Link href={otherProfileHref} className="thread-mini-avatar-link">
                  <SafeAvatar
                    src={otherAvatarUrl}
                    fallbackSrc={DEFAULT_OTHER_AVATAR}
                  />
                </Link>
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
            <div key={index} className="thread-row right">
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
              <Link href={myProfileHref} className="thread-mini-avatar-link">
                <SafeAvatar src={myAvatarUrl} fallbackSrc={MAKER_DEFAULT_MY_AVATAR} />
              </Link>
            </div>
          );
        }

        if (entry.side === "left") {
          return (
            <div key={index} className="thread-row left">
              <Link href={otherProfileHref} className="thread-mini-avatar-link">
                <SafeAvatar src={otherAvatarUrl} fallbackSrc={DEFAULT_OTHER_AVATAR} />
              </Link>
              <div className="thread-bubble">{entry.text}</div>
            </div>
          );
        }

        return (
          <div key={index} className="thread-row right">
            <div className="thread-bubble">{entry.text}</div>
            <Link href={myProfileHref} className="thread-mini-avatar-link">
              <SafeAvatar src={myAvatarUrl} fallbackSrc={MAKER_DEFAULT_MY_AVATAR} />
            </Link>
          </div>
        );
      })}
    </>
  );
}

export default function MakerMessageThreadView({
  entries,
  otherAvatarUrl,
  myAvatarUrl,
  otherProfileHref,
  myProfileHref,
}: Props) {
  return (
    <div className="thread-wrap">
      <ThreadEntries
        otherAvatarUrl={otherAvatarUrl}
        myAvatarUrl={myAvatarUrl}
        otherProfileHref={otherProfileHref}
        myProfileHref={myProfileHref}
        entries={entries}
      />
    </div>
  );
}