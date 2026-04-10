"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  parseMessageBulk,
  parseMomentBulk,
} from "@/lib/admin/phoneBulkParsers";

type Subtype = "message" | "moment" | "call" | "video_call" | "article";

type PhoneItemFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
  hiddenFields?: ReactNode;
  initialValues?: {
    subtype?: Subtype;
    server_key?: "kr" | "cn";
    is_published?: boolean;

    title?: string;
    slug?: string;
    character_key?: string;
    level?: string | number;

    avatar_url?: string;
    cover_image?: string;
    youtube_url?: string;

    preview?: string;
    icon_url?: string;
    image_url?: string;
    source_name?: string;
    author?: string;
    body?: string;

    message_bulk_raw?: string;
    moment_bulk_raw?: string;
  };
};

const CHARACTER_OPTIONS = [
  { key: "baiqi", label: "백기" },
  { key: "lizeyan", label: "이택언" },
  { key: "zhouqiluo", label: "주기락" },
  { key: "xumo", label: "허묵" },
  { key: "lingxiao", label: "연시호" },
] as const;

const DEFAULT_AVATAR_MAP: Record<string, string> = {
  baiqi: "/profile/baiqi.png",
  lizeyan: "/profile/lizeyan.png",
  zhouqiluo: "/profile/zhouqiluo.png",
  xumo: "/profile/xumo.png",
  lingxiao: "/profile/lingxiao.png",
};

const DEFAULT_CHARACTER_NAME_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
};

const messagePlaceholder = `title: 백기
preview: 이 계절에 갑자기 색다른 즐거움이 더해진 것…
threadKey: baiqi
characterKey: baiqi
avatarUrl: /profile/baiqi.png

SYS: 오늘
L: 꽃 키우기가 쉬운 일이 아니네.
R: 과정을 즐긴다면 낭비가 아니에요~.
LIMG: /images/messages/baiqi-flower.jpg | 화분 사진
L: 네가 즐기는 모습을 보니 나도 기분이 좋아.`;

const momentPlaceholder = `=== post ===
characterKey: baiqi
authorName: 백기
authorAvatar: /profile/baiqi.png
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

export default function PhoneItemForm({
  action,
  submitLabel = "저장",
  hiddenFields,
  initialValues,
}: PhoneItemFormProps) {
  const values = {
    subtype: initialValues?.subtype ?? "call",
    server_key: initialValues?.server_key ?? "kr",
    is_published: initialValues?.is_published ?? true,

    title: initialValues?.title ?? "",
    slug: initialValues?.slug ?? "",
    character_key: initialValues?.character_key ?? "baiqi",
    level: initialValues?.level?.toString?.() ?? "",

    avatar_url: initialValues?.avatar_url ?? "",
    cover_image: initialValues?.cover_image ?? "",
    youtube_url: initialValues?.youtube_url ?? "",

    preview: initialValues?.preview ?? "",
    icon_url: initialValues?.icon_url ?? "",
    image_url: initialValues?.image_url ?? "",
    source_name: initialValues?.source_name ?? "",
    author: initialValues?.author ?? "",
    body: initialValues?.body ?? "",

    message_bulk_raw: initialValues?.message_bulk_raw ?? "",
    moment_bulk_raw: initialValues?.moment_bulk_raw ?? "",
  };

  const [subtype, setSubtype] = useState<Subtype>(values.subtype);
  const [messageRaw, setMessageRaw] = useState(values.message_bulk_raw);
  const [momentRaw, setMomentRaw] = useState(values.moment_bulk_raw);

  const [characterKey, setCharacterKey] = useState(values.character_key);
  const [avatarUrl, setAvatarUrl] = useState(values.avatar_url);
  const [coverImage, setCoverImage] = useState(values.cover_image);
  const [iconUrl, setIconUrl] = useState(values.icon_url);
  const [imageUrl, setImageUrl] = useState(values.image_url);

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

  const resolvedCharacterName = useMemo(() => {
    return DEFAULT_CHARACTER_NAME_MAP[characterKey] ?? "";
  }, [characterKey]);

  const resolvedAvatarPreview = useMemo(() => {
    return avatarUrl.trim() || DEFAULT_AVATAR_MAP[characterKey] || "";
  }, [avatarUrl, characterKey]);

  return (
    <form
      action={action}
      className="form-panel"
      style={{ display: "grid", gap: "20px" }}
    >
      {hiddenFields}

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
          <select name="server_key" defaultValue={values.server_key}>
            <option value="kr">한국</option>
            <option value="cn">중국</option>
          </select>
        </label>

        <label className="form-field">
          <span>공개</span>
          <input
            name="is_published"
            type="checkbox"
            defaultChecked={values.is_published}
          />
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
            <select
              name="character_key"
              value={characterKey}
              onChange={(e) => setCharacterKey(e.target.value)}
            >
              {CHARACTER_OPTIONS.map((character) => (
                <option key={character.key} value={character.key}>
                  {character.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>표시 이름</span>
            <input value={resolvedCharacterName} readOnly />
            <input type="hidden" name="character_name" value={resolvedCharacterName} />
          </label>

          <label className="form-field form-field-full">
            <span>제목</span>
            <input
              name="title"
              required
              defaultValue={values.title}
              placeholder="예: 평온"
            />
          </label>

          <label className="form-field">
            <span>slug</span>
<input
  name="slug"
  defaultValue={values.slug}
  placeholder="비워두면 제목으로 자동 생성"
/>
          </label>

          <label className="form-field">
            <span>호감도/레벨</span>
            <input
              name="level"
              type="number"
              defaultValue={values.level}
              placeholder="예: 45"
            />
          </label>

          <label className="form-field form-field-full">
            <span>아바타 이미지</span>
            <input
              name="avatar_url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="비워두면 캐릭터 기본 프사 사용"
            />
            {resolvedAvatarPreview ? (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={resolvedAvatarPreview}
                  alt="avatar preview"
                  style={{
                    width: "88px",
                    height: "88px",
                    borderRadius: "999px",
                    objectFit: "cover",
                    border: "1px solid #d7e0ec",
                    background: "#fff",
                  }}
                />
              </div>
            ) : null}
          </label>

          <label className="form-field form-field-full">
            <span>커버 이미지</span>
            <input
              name="cover_image"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="/images/calls/peace.jpg 또는 외부 이미지 주소"
            />
            {coverImage.trim() ? (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={coverImage}
                  alt="cover preview"
                  style={{
                    width: "100%",
                    maxHeight: "240px",
                    objectFit: "cover",
                    borderRadius: "14px",
                    border: "1px solid #d7e0ec",
                    background: "#fff",
                  }}
                />
              </div>
            ) : null}
          </label>

          <label className="form-field form-field-full">
            <span>유튜브 링크</span>
            <input
              name="youtube_url"
              defaultValue={values.youtube_url}
              placeholder="일반 유튜브 링크 넣어도 저장 시 embed로 변환"
            />
          </label>

          <label className="form-field form-field-full">
            <span>메모</span>
            <textarea
              name="body"
              rows={6}
              defaultValue={values.body}
              placeholder="간단 설명"
            />
          </label>
        </div>
      ) : null}

      {subtype === "article" ? (
        <div className="form-grid">
          <label className="form-field form-field-full">
            <span>제목</span>
            <input name="title" defaultValue={values.title} />
          </label>

          <label className="form-field">
            <span>slug</span>
            <input name="slug" defaultValue={values.slug} />
          </label>

          <label className="form-field form-field-full">
            <span>미리보기</span>
            <input name="preview" defaultValue={values.preview} />
          </label>

          <label className="form-field form-field-full">
            <span>아이콘 이미지</span>
            <input
              name="icon_url"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder="/images/articles/news-icon.png 또는 외부 이미지 주소"
            />
            {iconUrl.trim() ? (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={iconUrl}
                  alt="icon preview"
                  style={{
                    width: "88px",
                    height: "88px",
                    borderRadius: "18px",
                    objectFit: "cover",
                    border: "1px solid #d7e0ec",
                    background: "#fff",
                  }}
                />
              </div>
            ) : null}
          </label>

          <label className="form-field form-field-full">
            <span>대표 이미지</span>
            <input
              name="image_url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/images/articles/cover.jpg 또는 외부 이미지 주소"
            />
            {imageUrl.trim() ? (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={imageUrl}
                  alt="article preview"
                  style={{
                    width: "100%",
                    maxHeight: "240px",
                    objectFit: "cover",
                    borderRadius: "14px",
                    border: "1px solid #d7e0ec",
                    background: "#fff",
                  }}
                />
              </div>
            ) : null}
          </label>

          <label className="form-field">
            <span>출처</span>
            <input name="source_name" defaultValue={values.source_name} />
          </label>

          <label className="form-field">
            <span>작성자</span>
            <input name="author" defaultValue={values.author} />
          </label>

          <label className="form-field form-field-full">
            <span>본문</span>
            <textarea name="body" rows={12} defaultValue={values.body} />
          </label>
        </div>
      ) : null}

      <button type="submit" className="primary-button">
        {submitLabel}
      </button>
    </form>
  );
}