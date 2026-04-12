"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  parseMessageBulk,
  parseMomentBulk,
} from "@/lib/admin/phoneBulkParsers";
import MessageBlockEditor from "@/components/admin/phone-items/MessageBlockEditor";
import {
  type MessageNode,
  buildEditorNodesFromStoredEntries,
  flattenMessageNodes,
} from "@/lib/admin/messageEditorTypes";

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
    character_name?: string;
    thread_key?: string;
    history_category?: string;
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

    history_summary?: string;
history_source?: string;

    message_bulk_raw?: string;
    moment_bulk_raw?: string;
        editor_entries_json?: string;

    article_title?: string;
    article_slug?: string;
    article_publisher?: string;
    article_publisher_slug?: string;
    article_preview?: string;
    article_icon_url?: string;
    article_author?: string;
    article_image_url?: string;
    article_body?: string;
    article_subscriber_count?: number | string;
    article_like_count?: number | string;
    article_related_story_slug?: string;
    article_related_story_label?: string;
    article_related_event_slug?: string;
article_related_event_label?: string;

    article_comment_0_avatar_url?: string;
    article_comment_0_nickname?: string;
    article_comment_0_content?: string;
    article_comment_0_like_count?: number | string;

    article_comment_1_avatar_url?: string;
    article_comment_1_nickname?: string;
    article_comment_1_content?: string;
    article_comment_1_like_count?: number | string;

    article_comment_2_avatar_url?: string;
    article_comment_2_nickname?: string;
    article_comment_2_content?: string;
    article_comment_2_like_count?: number | string;

    article_comment_3_avatar_url?: string;
    article_comment_3_nickname?: string;
    article_comment_3_content?: string;
    article_comment_3_like_count?: number | string;

    input_mode?: "simple" | "bulk";
  };
};

const CHARACTER_OPTIONS = [
  { key: "baiqi", label: "백기" },
  { key: "lizeyan", label: "이택언" },
  { key: "zhouqiluo", label: "주기락" },
  { key: "xumo", label: "허묵" },
  { key: "lingxiao", label: "연시호" },
] as const;

const ARTICLE_PUBLISHERS = [
  {
    slug: "news-preview",
    name: "뉴스 미리보기",
    iconUrl: "/article/news-preview.png",
  },
  {
    slug: "bonjour-francais",
    name: "오늘의 불어",
    iconUrl: "/article/bonjour-francais.png",
  },
  {
    slug: "ym-communication",
    name: "스캔들 공작소",
    iconUrl: "/article/scandal-lab.png",
  },
  {
    slug: "romirro-diner",
    name: "연모식도락",
    iconUrl: "/article/romirro-diner.png",
  },
  {
    slug: "entertainverse",
    name: "연예버스",
    iconUrl: "/article/entertainverse.png",
  },
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

const messagePlaceholder = `L: 글쎄, 내 관심사는 아닙니다.
L: 확실한 건 위 실장이라면 빨대를 챙겼을 겁니다.
R: 가져오는 길에 떨어뜨렸나... 아쉬운 대로 마셔 보시면 안... 될까요?
L: ...당신을 만나고 나서 '아쉬운 대로' 하는 일들이 느네요.
CHOICE: 하루라도 안 마시면 힘들어요. | 푸딩을 더 좋아해요! | 달달한 건 다 좋아요!
LIMG: /images/messages/lizeyan-milktea.jpg | 책상 위 밀크티
LAUD: /audio/messages/lizeyan-milktea.mp3 | 00:07 | 지금 들어봐.
SYS: 확인완료`;

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
    character_name: initialValues?.character_name ?? "",
    thread_key: initialValues?.thread_key ?? "",
    history_category: initialValues?.history_category ?? "daily",
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

    history_summary: initialValues?.history_summary ?? "",
history_source: initialValues?.history_source ?? "",

    message_bulk_raw: initialValues?.message_bulk_raw ?? "",
    moment_bulk_raw: initialValues?.moment_bulk_raw ?? "",
    editor_entries_json: initialValues?.editor_entries_json ?? "",
    input_mode: initialValues?.input_mode ?? "simple",

    
  };

  const [subtype, setSubtype] = useState<Subtype>(values.subtype);
  const [messageRaw, setMessageRaw] = useState(values.message_bulk_raw);
  const [momentRaw, setMomentRaw] = useState(values.moment_bulk_raw);

  const [characterKey, setCharacterKey] = useState(values.character_key);
  const [avatarUrl, setAvatarUrl] = useState(values.avatar_url);
  const [coverImage, setCoverImage] = useState(values.cover_image);
  const [iconUrl, setIconUrl] = useState(values.icon_url);
  const [imageUrl, setImageUrl] = useState(values.image_url);

  const [messageCharacterKey, setMessageCharacterKey] = useState(
    values.character_key
  );
  const [messageCharacterName, setMessageCharacterName] = useState(
    values.character_name || DEFAULT_CHARACTER_NAME_MAP[values.character_key] || ""
  );
  const [messageAvatarUrl, setMessageAvatarUrl] = useState(values.avatar_url);

    const [messageInputMode, setMessageInputMode] = useState<"simple" | "bulk">(
    values.input_mode
  );

  const [articlePublisherSlug, setArticlePublisherSlug] = useState(
  initialValues?.article_publisher_slug?.trim() || "news-preview"
);

const selectedArticlePublisher =
  ARTICLE_PUBLISHERS.find((item) => item.slug === articlePublisherSlug) ||
  ARTICLE_PUBLISHERS[0];

  const initialMessageEditorEntries = useMemo(() => {
    try {
      if (values.editor_entries_json.trim()) {
        return buildEditorNodesFromStoredEntries(
          JSON.parse(values.editor_entries_json)
        );
      }

      return buildEditorNodesFromStoredEntries(
        values.message_bulk_raw ? parseMessageBulk(values.message_bulk_raw) : []
      );
    } catch {
      return [];
    }
  }, [values.editor_entries_json, values.message_bulk_raw]);

  const [messageEditorEntries, setMessageEditorEntries] = useState<MessageNode[]>(
    initialMessageEditorEntries
  );

  const bulkEntries = useMemo(() => {
    try {
      return messageRaw ? parseMessageBulk(messageRaw) : [];
    } catch {
      return [];
    }
  }, [messageRaw]);

  const currentFlatEntries = useMemo(() => {
    return messageInputMode === "simple"
      ? flattenMessageNodes(messageEditorEntries)
      : bulkEntries;
  }, [messageInputMode, messageEditorEntries, bulkEntries]);

  const currentEditorEntries = useMemo(() => {
    return messageInputMode === "simple"
      ? messageEditorEntries
      : buildEditorNodesFromStoredEntries(bulkEntries);
  }, [messageInputMode, messageEditorEntries, bulkEntries]);
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

  const resolvedMessageAvatarPreview = useMemo(() => {
    return (
      messageAvatarUrl.trim() ||
      DEFAULT_AVATAR_MAP[messageCharacterKey] ||
      ""
    );
  }, [messageAvatarUrl, messageCharacterKey]);

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
          <div className="form-grid">
            <label className="form-field">
              <span>상대 캐릭터</span>
              <select
                name="character_key"
                value={messageCharacterKey}
                onChange={(e) => {
                  const nextKey = e.target.value;
                  setMessageCharacterKey(nextKey);
                  if (CHARACTER_OPTIONS.some((item) => item.key === nextKey)) {
                    setMessageCharacterName(
                      DEFAULT_CHARACTER_NAME_MAP[nextKey] ?? ""
                    );
                  }
                }}
              >
                {CHARACTER_OPTIONS.map((character) => (
                  <option key={character.key} value={character.key}>
                    {character.label}
                  </option>
                ))}
                <option value="npc">NPC</option>
              </select>
            </label>

            <label className="form-field">
              <span>표시 이름</span>
              <input
                name="character_name"
                value={messageCharacterName}
                onChange={(e) => setMessageCharacterName(e.target.value)}
                placeholder="예: 택언 / 알 수 없음"
              />
            </label>

            <label className="form-field">
              <span>threadKey</span>
              <input
                name="thread_key"
                defaultValue={values.thread_key}
                placeholder="예: lizeyan-milktea"
              />
            </label>

            <label className="form-field form-field-full">
              <span>대화기록 제목</span>
              <input
                name="title"
                defaultValue={values.title}
                placeholder="기록 목록에만 보이는 제목"
              />
            </label>

            <label className="form-field form-field-full">
              <span>메인 목록 프리뷰</span>
              <input
                name="preview"
                defaultValue={values.preview}
                placeholder="메시지 목록에 보일 한 줄"
              />
            </label>

            <label className="form-field form-field-full">
              <span>상대 프사</span>
              <input
                name="avatar_url"
                value={messageAvatarUrl}
                onChange={(e) => setMessageAvatarUrl(e.target.value)}
                placeholder="비워두면 기본 프사"
              />
              {resolvedMessageAvatarPreview ? (
                <div style={{ marginTop: "10px" }}>
                  <img
                    src={resolvedMessageAvatarPreview}
                    alt="message avatar preview"
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

            <label className="form-field">
              <span>레벨</span>
              <input
                name="level"
                type="number"
                defaultValue={values.level}
                placeholder="예: 45"
              />
            </label>

            <label className="form-field">
  <span>기록 카테고리</span>
  <select
    name="history_category"
    defaultValue={values.history_category}
  >
    <option value="daily">일상</option>
    <option value="companion">동반</option>
    <option value="card_story">카드</option>
    <option value="main_story">메인스토리</option>
  </select>
</label>

<label className="form-field form-field-full">
  <span>기록 요약</span>
  <input
    name="history_summary"
    defaultValue={values.history_summary}
    placeholder="타이틀 아래 아주 작게 보일 설명"
  />
</label>

<label className="form-field form-field-full">
  <span>출처 / 메모</span>
  <input
    name="history_source"
    defaultValue={values.history_source}
    placeholder="예: KR 서버 / 카드 스토리 / 메인 1부"
  />
</label>

<label className="form-field">
  <span>slug</span>
  <input
    name="slug"
    defaultValue={values.slug}
    placeholder="비워두면 threadKey 사용"
  />
</label>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "8px",
            }}
          >
            <button
              type="button"
              className={messageInputMode === "simple" ? "primary-button" : "nav-link"}
              style={messageInputMode === "simple" ? { marginTop: 0 } : undefined}
              onClick={() => setMessageInputMode("simple")}
            >
              간편 입력
            </button>
            <button
              type="button"
              className={messageInputMode === "bulk" ? "primary-button" : "nav-link"}
              style={messageInputMode === "bulk" ? { marginTop: 0 } : undefined}
              onClick={() => setMessageInputMode("bulk")}
            >
              문법 입력
            </button>
          </div>

          <input
            type="hidden"
            name="entries_json"
            value={JSON.stringify(currentFlatEntries)}
          />
          <input
            type="hidden"
            name="editor_entries_json"
            value={JSON.stringify(currentEditorEntries)}
          />

          {messageInputMode === "simple" ? (
            <div style={{ display: "grid", gap: "16px" }}>
              <div className="archive-card">
                <strong>간편 입력</strong>
                <div style={{ marginTop: "8px", color: "#5b6573" }}>
                  상대 대사 / 내 대사 / 시스템 문구 / 이미지 / 음성 / 선택지를
                  블록 단위로 추가합니다.
                </div>
              </div>

              <MessageBlockEditor
                value={messageEditorEntries}
                onChange={setMessageEditorEntries}
              />
            </div>
          ) : (
            <label className="form-field form-field-full">
              <span>메시지 본문 일괄 입력</span>
              <textarea
                name="message_bulk_raw"
                rows={18}
                value={messageRaw}
                onChange={(e) => setMessageRaw(e.target.value)}
                placeholder={messagePlaceholder}
                style={{ fontFamily: "monospace" }}
              />
            </label>
          )}

          <div className="archive-card">
            <strong>entries: {currentFlatEntries.length}</strong>
            <div className="meta-row" style={{ marginTop: 12 }}>
              <span className="meta-pill">
                character: {messageCharacterKey}
              </span>
              <span className="meta-pill">
                name: {messageCharacterName || "이름 없음"}
              </span>
              <span className="meta-pill">
                mode: {messageInputMode === "simple" ? "simple" : "bulk"}
              </span>
            </div>
          </div>
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

      {subtype === "call" || subtype === "video_call" ? (
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
            <input
              type="hidden"
              name="character_name"
              value={resolvedCharacterName}
            />
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
  <section className="content-card" style={{ marginTop: 20 }}>
    <div
      style={{
        fontSize: 18,
        fontWeight: 800,
        marginBottom: 14,
      }}
    >
      핫이슈 기사 정보
    </div>

    <div className="form-grid">
      <label className="form-field">
        <span>기사 제목</span>
        <input
          name="article_title"
          defaultValue={initialValues?.article_title ?? ""}
          placeholder="연모시에서 총격전 발생. 스나이퍼 출동으로 위기 모면"
        />
      </label>

      <label className="form-field">
        <span>기사 slug</span>
        <input
          name="article_slug"
          defaultValue={initialValues?.article_slug ?? ""}
          placeholder="sniper-rescue-incident"
        />
      </label>

      <label className="form-field">
        <span>신문사 선택</span>
        <select
          value={articlePublisherSlug}
          onChange={(e) => setArticlePublisherSlug(e.target.value)}
        >
          {ARTICLE_PUBLISHERS.map((publisher) => (
            <option key={publisher.slug} value={publisher.slug}>
              {publisher.name}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span>신문사명</span>
        <input value={selectedArticlePublisher.name} readOnly />
        <input
          type="hidden"
          name="article_publisher"
          value={selectedArticlePublisher.name}
        />
      </label>

      <label className="form-field">
        <span>신문사 slug</span>
        <input value={selectedArticlePublisher.slug} readOnly />
        <input
          type="hidden"
          name="article_publisher_slug"
          value={selectedArticlePublisher.slug}
        />
      </label>

      <label className="form-field">
        <span>신문사 아이콘 URL</span>
        <input value={selectedArticlePublisher.iconUrl} readOnly />
        <input
          type="hidden"
          name="article_icon_url"
          value={selectedArticlePublisher.iconUrl}
        />
      </label>

      <label className="form-field form-field-full">
        <span>미리보기</span>
        <input
          name="article_preview"
          defaultValue={initialValues?.article_preview ?? ""}
          placeholder="백화점 인질사건 발생. 백모 경위가 여성을 구출했고..."
        />
      </label>

      <label className="form-field">
        <span>작성자</span>
        <input
          name="article_author"
          defaultValue={initialValues?.article_author ?? ""}
          placeholder="편집자 오궁"
        />
      </label>

      <label className="form-field form-field-full">
        <span>대표 이미지 URL</span>
        <input
          name="article_image_url"
          defaultValue={initialValues?.article_image_url ?? ""}
          placeholder="/phone/article/rainbow.png"
        />
      </label>

      <label className="form-field form-field-full">
        <span>기사 내용</span>
        <textarea
          name="article_body"
          rows={10}
          defaultValue={initialValues?.article_body ?? ""}
          placeholder="기사 본문"
        />
      </label>

      <label className="form-field">
        <span>구독자 수</span>
        <input
          type="number"
          name="article_subscriber_count"
          defaultValue={initialValues?.article_subscriber_count ?? 0}
          min={0}
        />
      </label>

      <label className="form-field">
        <span>좋아요 수</span>
        <input
          type="number"
          name="article_like_count"
          defaultValue={initialValues?.article_like_count ?? 0}
          min={0}
        />
      </label>

      <label className="form-field">
        <span>관련 스토리 slug</span>
        <input
          name="article_related_story_slug"
          defaultValue={initialValues?.article_related_story_slug ?? ""}
          placeholder="baiqi-gun"
        />
      </label>

      <label className="form-field">
        <span>관련 스토리 표시명</span>
        <input
          name="article_related_story_label"
          defaultValue={initialValues?.article_related_story_label ?? ""}
          placeholder="gun"
        />
      </label>

      <div className="form-field form-field-full">
        <span>베스트 댓글</span>

        <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              style={{
                padding: 14,
                borderRadius: 14,
                border: "1px solid rgba(220, 224, 232, 0.9)",
                background: "rgba(255,255,255,0.7)",
                display: "grid",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                댓글 {index + 1}
              </div>

              <label className="form-field">
                <span>프사 URL</span>
                <input
                  name={`article_comment_${index}_avatar_url`}
                  defaultValue={
                    (initialValues?.[
                      `article_comment_${index}_avatar_url` as keyof typeof initialValues
                    ] as string) ?? ""
                  }
                  placeholder="/profile/comment1.png"
                />
              </label>

              <label className="form-field">
                <span>닉네임</span>
                <input
                  name={`article_comment_${index}_nickname`}
                  defaultValue={
                    (initialValues?.[
                      `article_comment_${index}_nickname` as keyof typeof initialValues
                    ] as string) ?? ""
                  }
                  placeholder="채식주의자각"
                />
              </label>

              <label className="form-field">
                <span>댓글 내용</span>
                <textarea
                  name={`article_comment_${index}_content`}
                  rows={3}
                  defaultValue={
                    (initialValues?.[
                      `article_comment_${index}_content` as keyof typeof initialValues
                    ] as string) ?? ""
                  }
                  placeholder="헐 대박 멋지…"
                />
              </label>

              <label className="form-field">
                <span>좋아요 수</span>
                <input
                  type="number"
                  name={`article_comment_${index}_like_count`}
                  defaultValue={
                    (initialValues?.[
                      `article_comment_${index}_like_count` as keyof typeof initialValues
                    ] as number | string) ?? 0
                  }
                  min={0}
                />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
) : null}

      <button type="submit" className="primary-button">
        {submitLabel}
      </button>
    </form>
  );
}