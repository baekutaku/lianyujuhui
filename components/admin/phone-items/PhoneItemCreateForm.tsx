"use client";

import { useMemo, useState } from "react";
import { createPhoneItemAction } from "@/app/admin/phone-items/new/actions";
import {
  parseMessageBulk,
  parseMomentBulk,
} from "@/lib/admin/phoneBulkParsers";

type Subtype = "message" | "moment" | "call" | "video_call" | "article";

const CHARACTER_OPTIONS = [
  { key: "baiqi", label: "백기" },
  { key: "lizeyan", label: "이택언" },
  { key: "zhouqiluo", label: "주기락" },
  { key: "xumo", label: "허묵" },
  { key: "lingxiao", label: "연시호" },
];

const messagePlaceholder = `title: 백기
preview: 이 계절에 갑자기 색다른 즐거움이 더해진 것…
threadKey: baiqi
characterKey: baiqi
avatarUrl: /images/baiqi.jpg

SYS: 오늘
L: 꽃 키우기가 쉬운 일이 아니네.
R: 과정을 즐긴다면 낭비가 아니에요~.
LIMG: /images/messages/baiqi-flower.jpg | 화분 사진
L: 네가 즐기는 모습을 보니 나도 기분이 좋아.`;

const momentPlaceholder = `=== post ===
characterKey: baiqi
authorName: 백기
authorAvatar: /images/baiqi.jpg
authorLevel: 45

body:
헬러윈 가면 무도회엔 이상한 옷차림이 많다…
변장이 이 정도로 자유로워진 건가?

quote:
유연 : 요즘은 엄청 자유로워졌어요.
백기답장유연 : 네가 곁에 있다면, 난 아무거나 괜찮아.

images:
/images/moments/baiqi-1.jpg
/images/moments/baiqi-2.jpg`;

export default function PhoneItemCreateForm() {
  const [subtype, setSubtype] = useState<Subtype>("call");
  const [messageRaw, setMessageRaw] = useState("");
  const [momentRaw, setMomentRaw] = useState("");

  const messagePreview = useMemo(() => {
    try {
      return messageRaw ? parseMessageBulk(messageRaw) : null;
    } catch {
      return null;
    }
  }, [messageRaw]);

  const momentPreview = useMemo(() => {
    try {
      return momentRaw ? parseMomentBulk(momentRaw) : [];
    } catch {
      return [];
    }
  }, [momentRaw]);

  return (
    <form
      action={createPhoneItemAction}
      className="form-panel"
      style={{ display: "grid", gap: "20px" }}
    >
      <div className="form-grid">
        <label className="form-field">
          <span>콘텐츠 타입</span>
          <select
            name="subtype"
            value={subtype}
            onChange={(e) => setSubtype(e.target.value as Subtype)}
          >
            <option value="message">메시지</option>
            <option value="moment">모멘트</option>
            <option value="call">전화</option>
            <option value="video_call">영상통화</option>
            <option value="article">기사</option>
          </select>
        </label>

        <label className="form-field">
          <span>서버</span>
          <select name="server_key" defaultValue="kr">
            <option value="kr">한국</option>
            <option value="cn">중국</option>
          </select>
        </label>

        <label className="form-field">
          <span>공개</span>
          <input name="is_published" type="checkbox" />
        </label>
      </div>

      {subtype === "message" ? (
        <>
          <label className="form-field form-field-full">
            <span>메시지 일괄 입력</span>
            <textarea
              name="message_bulk_raw"
              rows={18}
              value={messageRaw}
              onChange={(e) => setMessageRaw(e.target.value)}
              placeholder={messagePlaceholder}
              style={{ fontFamily: "monospace" }}
            />
          </label>

          {messagePreview ? (
            <div className="archive-card">
              <strong>{messagePreview.title}</strong>
              <div className="meta-row" style={{ marginTop: 12 }}>
                <span className="meta-pill">preview: {messagePreview.preview}</span>
                <span className="meta-pill">threadKey: {messagePreview.threadKey}</span>
                <span className="meta-pill">entries: {messagePreview.entries.length}</span>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {subtype === "moment" ? (
        <>
          <label className="form-field form-field-full">
            <span>모멘트 일괄 입력</span>
            <textarea
              name="moment_bulk_raw"
              rows={22}
              value={momentRaw}
              onChange={(e) => setMomentRaw(e.target.value)}
              placeholder={momentPlaceholder}
              style={{ fontFamily: "monospace" }}
            />
          </label>

          <div className="archive-card">
            <strong>posts: {momentPreview.length}</strong>
          </div>
        </>
      ) : null}

      {(subtype === "call" || subtype === "video_call") ? (
        <div className="form-grid">
          <label className="form-field">
            <span>캐릭터</span>
            <select name="character_key" defaultValue="baiqi">
              {CHARACTER_OPTIONS.map((character) => (
                <option key={character.key} value={character.key}>
                  {character.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>표시 이름</span>
            <input name="character_name" placeholder="비워두면 자동" />
          </label>

          <label className="form-field form-field-full">
            <span>제목</span>
            <input name="title" required placeholder="예: 평온" />
          </label>

          <label className="form-field">
            <span>slug</span>
            <input name="slug" placeholder="비워두면 제목으로 자동 생성" />
          </label>

          <label className="form-field">
            <span>호감도/레벨</span>
            <input name="level" type="number" placeholder="예: 45" />
          </label>

          <label className="form-field form-field-full">
            <span>아바타 이미지</span>
            <input name="avatar_url" placeholder="/images/baiqi.jpg" />
          </label>

          <label className="form-field form-field-full">
            <span>커버 이미지</span>
            <input name="cover_image" placeholder="/images/calls/peace.jpg" />
          </label>

          <label className="form-field form-field-full">
            <span>유튜브 링크</span>
            <input
              name="youtube_url"
              placeholder="일반 유튜브 링크 넣어도 저장 시 embed로 변환"
            />
          </label>

          <label className="form-field form-field-full">
            <span>메모</span>
            <textarea name="body" rows={6} placeholder="간단 설명" />
          </label>
        </div>
      ) : null}

      {subtype === "article" ? (
        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>제목</span>
            <input name="title" />
          </label>

          <label className="form-field">
            <span>slug</span>
            <input name="slug" />
          </label>

          <label className="form-field form-field-full">
            <span>미리보기</span>
            <input name="preview" />
          </label>

          <label className="form-field form-field-full">
            <span>아이콘 이미지</span>
            <input name="icon_url" />
          </label>

          <label className="form-field form-field-full">
            <span>대표 이미지</span>
            <input name="image_url" />
          </label>

          <label className="form-field">
            <span>출처</span>
            <input name="source_name" />
          </label>

          <label className="form-field">
            <span>작성자</span>
            <input name="author" />
          </label>

          <label className="form-field form-field-full">
            <span>본문</span>
            <textarea name="body" rows={12} />
          </label>
        </div>
      ) : null}

      <button type="submit" className="primary-button">
        저장
      </button>
    </form>
  );
}