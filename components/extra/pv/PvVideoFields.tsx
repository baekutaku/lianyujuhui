"use client";

import { useState } from "react";

export type PvVideoItem = {
  server: "CN" | "KR" | "OTHER";
  url: string;
};

function emptyVideo(): PvVideoItem {
  return {
    server: "CN",
    url: "",
  };
}

export default function PvVideoFields({
  initialVideos = [],
}: {
  initialVideos?: PvVideoItem[];
}) {
  const [items, setItems] = useState<PvVideoItem[]>(
    initialVideos.length
      ? initialVideos
      : [emptyVideo()]
  );

  function update(
    index: number,
    patch: Partial<PvVideoItem>
  ) {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, ...patch }
          : item
      )
    );
  }

  function remove(index: number) {
    setItems((prev) => {
      const next = prev.filter(
        (_, itemIndex) => itemIndex !== index
      );

      return next.length
        ? next
        : [emptyVideo()];
    });
  }

  function add() {
    setItems((prev) => [
      ...prev,
      emptyVideo(),
    ]);
  }

  const serialized = items
    .map((item) => ({
      server: item.server,
      url: item.url.trim(),
    }))
    .filter((item) => item.url);

  return (
    <div className="extra-pv-video-editor">

      <input
        type="hidden"
        name="videosJson"
        value={JSON.stringify(serialized)}
      />

      <div className="extra-pv-video-editor-list">

        {items.map((item, index) => (
          <div
            key={index}
            className="extra-pv-video-editor-row"
          >

            <select
              value={item.server}
              onChange={(event) =>
                update(index, {
                  server:
                    event.target.value as
                      | "CN"
                      | "KR"
                      | "OTHER",
                })
              }
            >
              <option value="CN">
                CN
              </option>

              <option value="KR">
                KR
              </option>

              <option value="OTHER">
                기타
              </option>
            </select>

            <input
              type="url"
              value={item.url}
              onChange={(event) =>
                update(index, {
                  url: event.target.value,
                })
              }
              placeholder="YouTube / Bilibili / Weibo / MP4 URL"
            />

            <button
              type="button"
              onClick={() =>
                remove(index)
              }
              className="extra-pv-video-remove"
            >
              삭제
            </button>

          </div>
        ))}

      </div>

      <button
        type="button"
        className="extra-pv-video-add"
        onClick={add}
      >
        + 영상 추가
      </button>

      <p className="extra-pv-video-help">
        YouTube · Bilibili · 직접 MP4는 페이지 안에서 재생됩니다.
        웨이보 일반 페이지 주소는 외부 영상 카드로 표시됩니다.
      </p>

    </div>
  );
}
