"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { parseMessageBulk } from "@/lib/admin/phoneBulkParsers";
import MessageBlockEditor from "@/components/admin/phone-items/MessageBlockEditor";
import {
  type MessageNode,
  buildEditorNodesFromStoredEntries,
  flattenMessageNodes,
} from "@/lib/admin/messageEditorTypes";
import SmartEditor from "@/components/editor/SmartEditor";
import {
  CALL_HISTORY_CATEGORIES,
  CALL_HISTORY_CATEGORY_LABEL_MAP,
} from "@/lib/phone/call-history";


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
    youtube_url_cn?: string;
    youtube_url_kr?: string;

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

    call_translation_html?: string;
    call_memo_html?: string;
    tag_labels?: string;

    moment_title?: string;
    moment_slug?: string;
    moment_author_key?: string;
    moment_author_name?: string;
    moment_author_avatar_url?: string;
    moment_author_has_profile?: boolean;

    moment_category?: string;
    moment_year?: number | string;
    moment_date_text?: string;

    moment_body?: string;
    moment_summary?: string;
    moment_source?: string;

    moment_image_urls_text?: string;
   
    moment_reply_lines_json?: string;
    moment_choice_options_json?: string;
moment_reaction_lines_json?: string;

moment_is_favorite?: boolean;
    moment_is_complete?: boolean;

    input_mode?: "simple" | "bulk";
  };
};

const CHARACTER_OPTIONS = [
  { key: "baiqi", label: "백기" },
  { key: "lizeyan", label: "이택언" },
  { key: "zhouqiluo", label: "주기락" },
  { key: "xumo", label: "허묵" },
  { key: "lingxiao", label: "연시호" },
  { key: "helios", label: "Helios (주기락 알트)" },
  { key: "unknown", label: "알 수 없음 (주기락 알트)" },
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
  helios: "/profile/helios.png",
  unknown: "/profile/npc.png",
};

const DEFAULT_CHARACTER_NAME_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
  helios: "Helios",
  unknown: "알 수 없음",
  mc: "유연",
  other: "",
};

type MomentChoiceFormItem = {
  id: string;
  label: string;
  replySpeakerKey: string;
  replySpeakerName: string;
  replyTargetName: string;
  replyContent: string;
  isHistory: boolean;
};



type MomentCommentFormItem = {
  id: string;
  speakerKey: string;
  speakerName: string;
  avatarUrl: string;
  content: string;
  likeCount: string;
};

const MOMENT_PARTICIPANT_OPTIONS = [
  ...CHARACTER_OPTIONS,
  { key: "mc", label: "유연" },
  { key: "other", label: "기타/NPC" },
] as const;

const createMomentRowId = () => Math.random().toString(36).slice(2, 11);

const getMomentDefaultName = (key: string) => {
  if (key === "mc") return "유연";
  if (key === "other") return "";
  return DEFAULT_CHARACTER_NAME_MAP[key] ?? "";
};

function parseMomentChoiceFormItems(value?: string): MomentChoiceFormItem[] {
  try {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: any, index: number) => ({
      id: item?.id ?? `choice-${index + 1}`,
      label: String(item?.label ?? ""),
      replySpeakerKey: String(item?.replySpeakerKey ?? item?.speakerKey ?? ""),
      replySpeakerName: String(item?.replySpeakerName ?? item?.speakerName ?? ""),
      replyTargetName: String(item?.replyTargetName ?? "유연"),
      replyContent: String(item?.replyContent ?? ""),
      isHistory: Boolean(item?.isHistory),
    }));
  } catch {
    return [];
  }
}



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

function formatMomentChoiceRaw(value?: string) {
  try {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) return "";
    return parsed
      .map((item) =>
        `${item?.isHistory ? "[history] " : ""}${String(item?.label ?? "").trim()}`
      )
      .filter(Boolean)
      .join("\n");
  } catch {
    return "";
  }
}

function parseMomentChoiceRaw(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const isHistory = line.startsWith("[history]");
      const label = isHistory ? line.replace(/^\[history\]\s*/, "").trim() : line;
      return {
        id: `choice-${index + 1}`,
        label,
        ...(isHistory ? { isHistory: true } : {}),
      };
    })
    .filter((item) => item.label);
}






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
  history_category:
    initialValues?.history_category ??
    (initialValues?.subtype === "call" || initialValues?.subtype === "video_call"
      ? "story"
      : "daily"),
  level: initialValues?.level?.toString?.() ?? "",

  avatar_url: initialValues?.avatar_url ?? "",
  cover_image: initialValues?.cover_image ?? "",
   youtube_url: initialValues?.youtube_url ?? "",
  youtube_url_cn: initialValues?.youtube_url_cn ?? "",
  youtube_url_kr: initialValues?.youtube_url_kr ?? "",

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

  call_translation_html: initialValues?.call_translation_html ?? "",
  call_memo_html: initialValues?.call_memo_html ?? "",

  moment_title: initialValues?.moment_title ?? "",
  moment_slug: initialValues?.moment_slug ?? "",
moment_author_key: initialValues?.moment_author_key ?? "baiqi",
moment_author_name:
  initialValues?.moment_author_name ??
  DEFAULT_CHARACTER_NAME_MAP[initialValues?.moment_author_key ?? "baiqi"] ??
  "백기",
moment_author_avatar_url: initialValues?.moment_author_avatar_url ?? "",
moment_author_has_profile: initialValues?.moment_author_has_profile ?? true,

  moment_category: initialValues?.moment_category ?? "daily",
  moment_year: initialValues?.moment_year?.toString?.() ?? "",
  moment_date_text: initialValues?.moment_date_text ?? "",

  moment_body: initialValues?.moment_body ?? "",
  moment_summary: initialValues?.moment_summary ?? "",
  moment_source: initialValues?.moment_source ?? "",

  moment_image_urls_text: initialValues?.moment_image_urls_text ?? "",
  moment_choice_options_json: initialValues?.moment_choice_options_json ?? "",
moment_reaction_lines_json:
  initialValues?.moment_reaction_lines_json ??
  initialValues?.moment_reply_lines_json ??
  "",


  moment_is_favorite: initialValues?.moment_is_favorite ?? false,
  moment_is_complete: initialValues?.moment_is_complete ?? true,
};

const [subtype, setSubtype] = useState<Subtype>(values.subtype);
const [messageRaw, setMessageRaw] = useState(values.message_bulk_raw);

const [characterKey, setCharacterKey] = useState(values.character_key);
const [avatarUrl, setAvatarUrl] = useState(values.avatar_url);
const [coverImage, setCoverImage] = useState(values.cover_image);

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

const [momentAuthorKey, setMomentAuthorKey] = useState(
  values.moment_author_key || "baiqi"
);

const [momentAuthorName, setMomentAuthorName] = useState(
  values.moment_author_name?.trim() ||
    getMomentDefaultName(values.moment_author_key || "baiqi")
);


const resolvedMomentAuthorName = useMemo(() => {
  const rawName = momentAuthorName.trim();
  if (rawName) return rawName;
  return getMomentDefaultName(momentAuthorKey || "baiqi");
}, [momentAuthorName, momentAuthorKey]);
const DEFAULT_TARGET_NAME = "유연";

useEffect(() => {
  setMomentReactionLines((prev) =>
    prev.map((line) => {
      const currentSpeakerKey = String(line.speakerKey || "").trim();
      const currentSpeakerName = String(line.speakerName || "").trim();

      if (!currentSpeakerKey || !currentSpeakerName) {
        return {
          ...line,
          speakerKey: momentAuthorKey || "baiqi",
          speakerName: resolvedMomentAuthorName || "백기",
        };
      }

      return line;
    })
  );
}, [momentAuthorKey, resolvedMomentAuthorName]);

type MomentReactionLineInput = {
  speakerKey: string;
  speakerName: string;
  targetName: string;
  isReplyToMc: boolean;
  content: string;
};

function parseMomentReactionLines(raw: string): MomentReactionLineInput[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      speakerKey: String(item?.speakerKey || "baiqi").trim() || "baiqi",
      speakerName: String(item?.speakerName || "백기").trim() || "백기",
      targetName: String(item?.targetName || DEFAULT_TARGET_NAME).trim() || DEFAULT_TARGET_NAME,
      isReplyToMc: Boolean(item?.isReplyToMc ?? false),
      content: String(item?.content || "").trim(),
    }));
  } catch {
    return [];
  }
}

function createEmptyMomentReactionLine(
  speakerKey: string,
  speakerName: string
): MomentReactionLineInput {
  return {
    speakerKey: speakerKey || "baiqi",
    speakerName: speakerName || "백기",
    targetName: DEFAULT_TARGET_NAME,
    isReplyToMc: false,
    content: "",
  };
}

const [momentReactionLines, setMomentReactionLines] = useState<MomentReactionLineInput[]>(
  values.moment_reaction_lines_json.trim()
    ? parseMomentReactionLines(values.moment_reaction_lines_json)
    : []
); 



const [momentAuthorAvatarUrl, setMomentAuthorAvatarUrl] = useState(
  values.moment_author_avatar_url || ""
);


const isMaleLeadMoment = CHARACTER_OPTIONS.some(
  (item) => item.key === momentAuthorKey
);
const isMcMoment = momentAuthorKey === "mc";
const isNpcMoment = !isMaleLeadMoment && !isMcMoment;

const initialMomentChoiceItems = useMemo(() => {
  const parsed = parseMomentChoiceFormItems(values.moment_choice_options_json);
  const historyIndex = parsed.findIndex((item) => item.isHistory);

  return Array.from({ length: 3 }, (_, index) => {
    const base =
      parsed[index] ?? {
        id: `choice-${index + 1}`,
        label: "",
        replySpeakerKey: momentAuthorKey,
        replySpeakerName:
          values.moment_author_name || getMomentDefaultName(momentAuthorKey),
        replyTargetName: "유연",
        replyContent: "",
        isHistory: false,
      };

    return {
      ...base,
      isHistory: historyIndex === -1 ? index === 0 : index === historyIndex,
    };
  });
}, [
  values.moment_choice_options_json,
  values.moment_author_name,
  momentAuthorKey,
]);

const [momentChoiceItems, setMomentChoiceItems] = useState<MomentChoiceFormItem[]>(
  initialMomentChoiceItems
);



const updateMomentChoiceItem = (
  index: number,
  patch: Partial<MomentChoiceFormItem>
) => {
  setMomentChoiceItems((prev) =>
    prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
  );
};

const setMomentHistoryChoice = (index: number) => {
  setMomentChoiceItems((prev) =>
    prev.map((item, i) => ({
      ...item,
      isHistory: i === index,
    }))
  );
};



const momentChoicePayload = useMemo(() => {
  if (!isMaleLeadMoment) return [];

  return momentChoiceItems
    .filter((item) => item.label.trim())
    .map((item, index) => ({
      id: item.id || `choice-${index + 1}`,
      label: item.label.trim(),
      isHistory: item.isHistory,
      replySpeakerKey: item.replySpeakerKey,
      replySpeakerName:
        item.replySpeakerName.trim() ||
        getMomentDefaultName(item.replySpeakerKey),
      replyTargetName: item.replyTargetName.trim() || "유연",
      replyContent: item.replyContent.trim(),
    }));
}, [isMaleLeadMoment, momentChoiceItems]);

const momentReactionPayload = useMemo(() => {
  return momentReactionLines
    .map((line) => ({
      speakerKey: String(line.speakerKey || "").trim(),
      speakerName: String(line.speakerName || "").trim(),
      targetName: String(line.targetName || "").trim() || "유연",
      isReplyToMc: Boolean(line.isReplyToMc),
      content: String(line.content || "").trim(),
    }))
    .filter((line) => line.content);
}, [momentReactionLines]);


const handleMomentAuthorKeyChange = (nextKey: string) => {
  const currentName = momentAuthorName.trim();
  const defaultNames = Object.values(DEFAULT_CHARACTER_NAME_MAP);

  setMomentAuthorKey(nextKey);

  if (!currentName || defaultNames.includes(currentName)) {
    setMomentAuthorName(getMomentDefaultName(nextKey));
  }
};
const resolvedMomentAvatarPreview = useMemo(() => {
  return (
    (momentAuthorAvatarUrl || "").trim() ||
    DEFAULT_AVATAR_MAP[momentAuthorKey] ||
    "/profile/npc.png"
  );
}, [momentAuthorAvatarUrl, momentAuthorKey]);

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

    {subtype === "moment" && (
  <>
    <input
      type="hidden"
      name="moment_choice_options_json"
      value={JSON.stringify(momentChoicePayload)}
    />

    <input
      type="hidden"
      name="moment_reaction_lines_json"
      value={JSON.stringify(momentReactionPayload)}
    />

    <input
      type="hidden"
      name="moment_reply_lines_json"
      value={JSON.stringify(momentReactionPayload)}
    />

    <div className="form-grid">
      <label className="form-field">
        <span>작성자</span>
        <select
          name="moment_author_key"
          value={momentAuthorKey}
          onChange={(e) => handleMomentAuthorKeyChange(e.target.value)}
        >
          {CHARACTER_OPTIONS.map((character) => (
            <option key={character.key} value={character.key}>
              {character.label}
            </option>
          ))}
          <option value="mc">유연</option>
          <option value="other">NPC/기타</option>
        </select>
      </label>

      <label className="form-field">
        <span>표시 이름</span>
        <input
          name="moment_author_name"
          value={momentAuthorName}
          onChange={(e) => setMomentAuthorName(e.target.value)}
          placeholder="예: 백기 / 유연"
        />
      </label>

      <label className="form-field form-field-full">
        <span>작성자 프사</span>
        <input
          name="moment_author_avatar_url"
          value={momentAuthorAvatarUrl}
          onChange={(e) => setMomentAuthorAvatarUrl(e.target.value)}
          placeholder="비워두면 기본 프사 / NPC는 직접 입력"
        />
        {resolvedMomentAvatarPreview ? (
          <div style={{ marginTop: "10px" }}>
            <img
              src={resolvedMomentAvatarPreview}
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
        <span>제목</span>
        <input
          name="moment_title"
          defaultValue={values.moment_title}
          placeholder="예: 눈 내리는 밤"
        />
      </label>

      <label className="form-field">
        <span>slug</span>
        <input
          name="moment_slug"
          defaultValue={values.moment_slug}
          placeholder="예: baiqi-first-snow"
        />
      </label>

      <label className="form-field">
        <span>카테고리</span>
        <select name="moment_category" defaultValue={values.moment_category}>
          <option value="daily">일상</option>
          <option value="card">카드</option>
          <option value="story">스토리</option>
        </select>
      </label>

      <label className="form-field">
        <span>연도</span>
        <input
          name="moment_year"
          type="number"
          defaultValue={values.moment_year}
          placeholder="예: 2026"
        />
      </label>

      <label className="form-field">
        <span>날짜 텍스트</span>
        <input
          name="moment_date_text"
          defaultValue={values.moment_date_text}
          placeholder="예: 2026년 4월 13일"
        />
      </label>

      <label className="form-field form-field-full">
        <span>본문</span>
        <textarea
          name="moment_body"
          rows={8}
          defaultValue={values.moment_body}
          placeholder="모멘트 본문"
        />
      </label>

      <label className="form-field form-field-full">
        <span>히스토리 요약</span>
        <input
          name="moment_summary"
          defaultValue={values.moment_summary}
          placeholder="예: 화이트데이 / 메인 3장 이후"
        />
      </label>

      <label className="form-field form-field-full">
        <span>출처 / 메모</span>
        <input
          name="moment_source"
          defaultValue={values.moment_source}
          placeholder="예: KR 서버 / 카드 스토리 / 관련 모멘트"
        />
      </label>

      <label className="form-field form-field-full">
        <span>이미지 URL 목록</span>
        <textarea
          name="moment_image_urls_text"
          rows={5}
          defaultValue={values.moment_image_urls_text}
          placeholder={`/images/moments/baiqi-1.jpg\n/images/moments/baiqi-2.jpg`}
          style={{ fontFamily: "monospace" }}
        />
      </label>
    </div>

    {isMaleLeadMoment && (
      <div className="archive-card" style={{ display: "grid", gap: "16px" }}>
        <strong>선택지 3개 + 남주 답장</strong>

        {momentChoiceItems.map((item, index) => (
          <div
            key={item.id}
            style={{
              display: "grid",
              gap: "12px",
              padding: "16px",
              borderRadius: "16px",
              border: "1px solid #d7e0ec",
              background: "rgba(255,255,255,0.75)",
            }}
          >
            <div style={{ fontWeight: 700 }}>선택지 {index + 1}</div>

            <label className="form-field">
              <span>선택지 문구</span>
              <input
                value={item.label}
                onChange={(e) =>
                  updateMomentChoiceItem(index, { label: e.target.value })
                }
                placeholder="예: 오늘은 조금 쉬어."
              />
            </label>

            <div className="form-grid">
              <label className="form-field">
                <span>답장 화자</span>
                <select
                  value={item.replySpeakerKey}
                  onChange={(e) =>
                    updateMomentChoiceItem(index, {
                      replySpeakerKey: e.target.value,
                      replySpeakerName:
                        item.replySpeakerName ||
                        getMomentDefaultName(e.target.value),
                    })
                  }
                >
                  {MOMENT_PARTICIPANT_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>답장 화자 이름</span>
                <input
                  value={item.replySpeakerName}
                  onChange={(e) =>
                    updateMomentChoiceItem(index, {
                      replySpeakerName: e.target.value,
                    })
                  }
                  placeholder="예: 백기"
                />
              </label>

              <label className="form-field">
                <span>대상 이름</span>
                <input
                  value={item.replyTargetName || "유연"}
                  onChange={(e) =>
                    updateMomentChoiceItem(index, {
                      replyTargetName: e.target.value,
                    })
                  }
                  placeholder="예: 유연"
                />
              </label>
            </div>

            <label className="form-field">
              <span>답장 내용</span>
              <textarea
                rows={4}
                value={item.replyContent}
                onChange={(e) =>
                  updateMomentChoiceItem(index, {
                    replyContent: e.target.value,
                  })
                }
                placeholder="예: 네가 곁에 있다면, 난 아무거나 괜찮아."
              />
            </label>
          </div>
        ))}
      </div>
    )}

    <div className="archive-card" style={{ display: "grid", gap: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <strong>추가 반응</strong>

        <button
          type="button"
          className="nav-link"
          onClick={() =>
            setMomentReactionLines((prev) => [
              ...prev,
              createEmptyMomentReactionLine(
                momentAuthorKey || "baiqi",
                resolvedMomentAuthorName || "백기"
              ),
            ])
          }
        >
          반응 추가
        </button>
      </div>

      {momentReactionLines.length === 0 ? (
        <div style={{ color: "#7d8794" }}>아직 추가된 반응이 없음</div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {momentReactionLines.map((line, index) => (
            <div
              key={`reaction-${index}`}
              style={{
                display: "grid",
                gap: "12px",
                padding: "16px",
                borderRadius: "16px",
                border: "1px solid #d7e0ec",
                background: "rgba(255,255,255,0.75)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <strong>반응</strong>
                <button
                  type="button"
                  className="nav-link"
                  onClick={() =>
                    setMomentReactionLines((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                >
                  삭제
                </button>
              </div>

              <div className="form-grid">
                <label className="form-field">
                  <span>화자</span>
                  <select
                    value={line.speakerKey}
                    onChange={(e) => {
                      const nextKey = e.target.value;
                      const nextName =
                        getMomentDefaultName(nextKey) || line.speakerName;

                      setMomentReactionLines((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                speakerKey: nextKey,
                                speakerName: nextName,
                              }
                            : item
                        )
                      );
                    }}
                  >
                    {MOMENT_PARTICIPANT_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>화자 이름</span>
                  <input
                    value={line.speakerName}
                    onChange={(e) =>
                      setMomentReactionLines((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? { ...item, speakerName: e.target.value }
                            : item
                        )
                      )
                    }
                    placeholder="예: 백기 / 유연 / NPC"
                  />
                </label>

                <label className="form-field">
                  <span>대상 이름</span>
                  <input
                    value={line.targetName}
                    onChange={(e) =>
                      setMomentReactionLines((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? { ...item, targetName: e.target.value }
                            : item
                        )
                      )
                    }
                    placeholder="예: 유연"
                  />
                </label>

                <label className="form-field">
                  <span>유연에게 답장</span>
                  <input
                    type="checkbox"
                    checked={line.isReplyToMc}
                    onChange={(e) =>
                      setMomentReactionLines((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? { ...item, isReplyToMc: e.target.checked }
                            : item
                        )
                      )
                    }
                  />
                </label>
              </div>

              <label className="form-field">
                <span>내용</span>
                <textarea
                  rows={4}
                  value={line.content}
                  onChange={(e) =>
                    setMomentReactionLines((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, content: e.target.value } : item
                      )
                    )
                  }
                  placeholder="반응 내용"
                />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  </>
)}
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

          <label className="form-field">
  <span>기록 카테고리</span>
  <select
    name="history_category"
    defaultValue={values.history_category}
  >
    {CALL_HISTORY_CATEGORIES.filter((item) => item.value !== "all").map((item) => (
      <option key={item.value} value={item.value}>
        {item.label}
      </option>
    ))}
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
    placeholder="예: 생일 통화 / 이벤트 / 카드 획득 후"
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
            <span>유튜브 링크 (CN)</span>
            <input
              name="youtube_url_cn"
              defaultValue={values.youtube_url_cn}
              placeholder="중국 서버 유튜브 링크"
            />
          </label>

          <label className="form-field form-field-full">
            <span>유튜브 링크 (KR)</span>
            <input
              name="youtube_url_kr"
              defaultValue={values.youtube_url_kr}
              placeholder="한국 서버 유튜브 링크"
            />
          </label>

<label className="form-field form-field-full">
  <span>메모</span>
  <textarea
    name="body"
    rows={6}
    defaultValue={values.body}
    placeholder="휴대폰 UI 안에 들어갈 공개용 설명"
  />
</label>

<div className="form-field form-field-full">
  <span>번역문 (관리용)</span>
  <SmartEditor
    name="call_translation_html"
    initialValue={values.call_translation_html}
  />
</div>

<div className="form-field form-field-full">
  <span>작업 메모 (관리용)</span>
  <SmartEditor
    name="call_memo_html"
    initialValue={values.call_memo_html}
  />
</div>
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

 <div className="form-grid">
        <label className="form-field form-field-full">
          <span>해시태그</span>
          <input
            name="tag_labels"
            defaultValue={initialValues?.tag_labels ?? ""}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="예: 생일, 카드스토리, 키스 (쉼표로 구분)"
          />
        </label>
      </div>

      <button type="submit" className="primary-button">
        {submitLabel}
      </button>
    </form>
  );
}