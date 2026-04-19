"use client";

import { type ReactNode, useState } from "react";
import {
  createMakerChoiceOption,
  createMakerComment,
  createMakerReplyLine,
  type MakerMomentChoiceOption,
  type MakerMomentComment,
  type MakerMomentReplyLine,
} from "@/lib/maker/moment-types";
import {
  MAKER_CHARACTER_AVATAR_MAP,
  MAKER_CHARACTER_NAME_MAP,
} from "@/lib/maker/defaults";

const REPLY_SPEAKER_OPTIONS = [
  { key: "baiqi", label: "백기" },
  { key: "lizeyan", label: "이택언" },
  { key: "zhouqiluo", label: "주기락" },
  { key: "xumo", label: "허묵" },
  { key: "lingxiao", label: "연시호" },
  { key: "npc", label: "NPC" },
] as const;

function getReplySpeakerName(key: string) {
  const found = REPLY_SPEAKER_OPTIONS.find((item) => item.key === key);
  return found?.label ?? "NPC";
}

function isNpcLikeKey(key?: string) {
  return key === "npc" || key === "other";
}

function replaceAt<T>(array: T[], index: number, value: T) {
  return array.map((item, i) => (i === index ? value : item));
}

function removeAt<T>(array: T[], index: number) {
  return array.filter((_, i) => i !== index);
}

function parseReplyLines(value?: string): MakerMomentReplyLine[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : [createMakerReplyLine()];
  } catch {
    return [createMakerReplyLine()];
  }
}

function parseChoiceOptions(value?: string): MakerMomentChoiceOption[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : [createMakerChoiceOption()];
  } catch {
    return [createMakerChoiceOption()];
  }
}

function parseComments(value?: string): MakerMomentComment[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
  hiddenFields?: ReactNode;
  initialValues?: {
    moment_title?: string;
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
    moment_comments_json?: string;
    moment_is_favorite?: boolean;
    moment_is_complete?: boolean;
  };
};

const CHARACTER_OPTIONS = [
  { key: "baiqi", label: "백기" },
  { key: "lizeyan", label: "이택언" },
  { key: "zhouqiluo", label: "주기락" },
  { key: "xumo", label: "허묵" },
  { key: "lingxiao", label: "연시호" },
  { key: "mc", label: "유연" },
  { key: "other", label: "기타/NPC" },
] as const;

export default function MakerMomentForm({
  action,
  submitLabel = "저장",
  hiddenFields,
  initialValues,
}: Props) {
  const values = {
    moment_title: initialValues?.moment_title ?? "",
    moment_author_key: initialValues?.moment_author_key ?? "baiqi",
    moment_author_name: initialValues?.moment_author_name ?? "",
    moment_author_avatar_url: initialValues?.moment_author_avatar_url ?? "",
    moment_author_has_profile: initialValues?.moment_author_has_profile ?? true,
    moment_category: initialValues?.moment_category ?? "daily",
    moment_year: initialValues?.moment_year?.toString?.() ?? "",
    moment_date_text: initialValues?.moment_date_text ?? "",
    moment_body: initialValues?.moment_body ?? "",
    moment_summary: initialValues?.moment_summary ?? "",
    moment_source: initialValues?.moment_source ?? "",
    moment_image_urls_text: initialValues?.moment_image_urls_text ?? "",
    moment_reply_lines_json: initialValues?.moment_reply_lines_json ?? "",
    moment_choice_options_json: initialValues?.moment_choice_options_json ?? "",
    moment_comments_json: initialValues?.moment_comments_json ?? "",
    moment_is_favorite: initialValues?.moment_is_favorite ?? false,
    moment_is_complete: initialValues?.moment_is_complete ?? false,
  };

  const [authorKey, setAuthorKey] = useState(values.moment_author_key);
  const [authorName, setAuthorName] = useState(
    values.moment_author_name ||
      MAKER_CHARACTER_NAME_MAP[values.moment_author_key] ||
      ""
  );
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState(
    values.moment_author_avatar_url ||
      MAKER_CHARACTER_AVATAR_MAP[values.moment_author_key] ||
      "/profile/npc.png"
  );

  const [replyLines, setReplyLines] = useState<MakerMomentReplyLine[]>(
    parseReplyLines(values.moment_reply_lines_json)
  );
  const [choiceOptions, setChoiceOptions] = useState<MakerMomentChoiceOption[]>(
    parseChoiceOptions(values.moment_choice_options_json)
  );
  const [comments, setComments] = useState<MakerMomentComment[]>(
    parseComments(values.moment_comments_json)
  );

  return (
    <form
      action={action}
      className="form-panel"
      style={{ display: "grid", gap: 20 }}
    >
      {hiddenFields}

      <div className="form-grid">
        <label className="form-field form-field-full">
          <span>모멘트 제목</span>
          <input
            name="moment_title"
            defaultValue={values.moment_title}
            placeholder="예: 오늘의 기록"
          />
        </label>

        <label className="form-field">
          <span>작성자</span>
          <select
            name="moment_author_key"
            value={authorKey}
            onChange={(e) => {
              const nextKey = e.target.value;
              setAuthorKey(nextKey);

              if (nextKey === "other") {
                setAuthorName((prev) =>
                  prev && prev !== "NPC" ? prev : ""
                );
                setAuthorAvatarUrl("/profile/npc.png");
                return;
              }

              setAuthorName(MAKER_CHARACTER_NAME_MAP[nextKey] ?? "NPC");
              setAuthorAvatarUrl(
                MAKER_CHARACTER_AVATAR_MAP[nextKey] ?? "/profile/npc.png"
              );
            }}
          >
            {CHARACTER_OPTIONS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>작성자 이름</span>
          <input
            name="moment_author_name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="NPC/기타면 직접 이름 입력"
          />
        </label>

        <input
          type="hidden"
          name="moment_author_avatar_url"
          value={authorAvatarUrl}
          readOnly
        />

        <label className="form-field form-field-full">
          <span>본문</span>
          <textarea
            name="moment_body"
            rows={8}
            defaultValue={values.moment_body}
          />
        </label>

        <label className="form-field form-field-full">
          <span>이미지 URL들 (줄바꿈 구분)</span>
          <textarea
            name="moment_image_urls_text"
            rows={4}
            defaultValue={values.moment_image_urls_text}
            style={{ fontFamily: "monospace" }}
          />
        </label>
      </div>

      <input
        type="hidden"
        name="moment_reply_lines_json"
        value={JSON.stringify(replyLines)}
        readOnly
      />
      <input
        type="hidden"
        name="moment_choice_options_json"
        value={JSON.stringify(choiceOptions)}
        readOnly
      />
      <input
        type="hidden"
        name="moment_comments_json"
        value={JSON.stringify(comments)}
        readOnly
      />

      <div className="archive-card" style={{ display: "grid", gap: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <strong>답글 라인</strong>
          <button
            type="button"
            className="primary-button"
            style={{ marginTop: 0 }}
            onClick={() =>
              setReplyLines((prev) => [
                ...prev,
                {
                  ...createMakerReplyLine(),
                  speakerKey: "baiqi",
                  speakerName: "백기",
                  targetName: "유연",
                },
              ])
            }
          >
            답글 추가
          </button>
        </div>

        {replyLines.map((line, index) => (
          <div
            key={line.id}
            className="form-grid"
            style={{
              padding: 12,
              border: "1px solid #d7e0ec",
              borderRadius: 12,
            }}
          >
            <label className="form-field">
              <span>답장 화자</span>
              <select
                value={line.speakerKey || "npc"}
                onChange={(e) =>
                  setReplyLines(
                    replaceAt(replyLines, index, {
                      ...line,
                      speakerKey: e.target.value,
                      speakerName: isNpcLikeKey(e.target.value)
                        ? line.speakerName || ""
                        : getReplySpeakerName(e.target.value),
                    })
                  )
                }
              >
                {REPLY_SPEAKER_OPTIONS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>화자 이름</span>
              <input
                value={line.speakerName || ""}
                onChange={(e) =>
                  setReplyLines(
                    replaceAt(replyLines, index, {
                      ...line,
                      speakerName: e.target.value,
                    })
                  )
                }
                placeholder="NPC/기타면 직접 이름 입력"
              />
            </label>

            <label className="form-field">
              <span>대상 이름</span>
              <input
                value={line.targetName || ""}
                onChange={(e) =>
                  setReplyLines(
                    replaceAt(replyLines, index, {
                      ...line,
                      targetName: e.target.value,
                    })
                  )
                }
              />
            </label>

            <label className="form-field">
              <span>유연 답글 여부</span>
              <input
                type="checkbox"
                checked={Boolean(line.isReplyToMc)}
                onChange={(e) =>
                  setReplyLines(
                    replaceAt(replyLines, index, {
                      ...line,
                      isReplyToMc: e.target.checked,
                    })
                  )
                }
              />
            </label>

            <label className="form-field form-field-full">
              <span>내용</span>
              <textarea
                rows={3}
                value={line.content || ""}
                onChange={(e) =>
                  setReplyLines(
                    replaceAt(replyLines, index, {
                      ...line,
                      content: e.target.value,
                    })
                  )
                }
              />
            </label>

            <button
              type="button"
              className="nav-link"
              onClick={() => setReplyLines(removeAt(replyLines, index))}
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      <div className="archive-card" style={{ display: "grid", gap: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <strong>선택지</strong>
          <button
            type="button"
            className="primary-button"
            style={{ marginTop: 0 }}
            onClick={() =>
              setChoiceOptions((prev) => [
                ...prev,
                {
                  ...createMakerChoiceOption(),
                  replySpeakerKey: "baiqi",
                  replySpeakerName: "백기",
                  replyTargetName: "유연",
                },
              ])
            }
          >
            선택지 추가
          </button>
        </div>

        {choiceOptions.map((option, index) => (
          <div
            key={option.id}
            className="form-grid"
            style={{
              padding: 12,
              border: "1px solid #d7e0ec",
              borderRadius: 12,
            }}
          >
            <label className="form-field form-field-full">
              <span>선택지 문구</span>
              <input
                value={option.label || ""}
                onChange={(e) =>
                  setChoiceOptions(
                    replaceAt(choiceOptions, index, {
                      ...option,
                      label: e.target.value,
                    })
                  )
                }
              />
            </label>

            <label className="form-field">
              <span>회상 선택지</span>
              <input
                type="checkbox"
                checked={Boolean(option.isHistory)}
                onChange={(e) =>
                  setChoiceOptions(
                    replaceAt(choiceOptions, index, {
                      ...option,
                      isHistory: e.target.checked,
                    })
                  )
                }
              />
            </label>

            <label className="form-field">
              <span>답장 화자</span>
              <select
                value={option.replySpeakerKey || "npc"}
                onChange={(e) =>
                  setChoiceOptions(
                    replaceAt(choiceOptions, index, {
                      ...option,
                      replySpeakerKey: e.target.value,
                      replySpeakerName: isNpcLikeKey(e.target.value)
                        ? option.replySpeakerName || ""
                        : getReplySpeakerName(e.target.value),
                    })
                  )
                }
              >
                {REPLY_SPEAKER_OPTIONS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>답장 화자 이름</span>
              <input
                value={option.replySpeakerName || ""}
                onChange={(e) =>
                  setChoiceOptions(
                    replaceAt(choiceOptions, index, {
                      ...option,
                      replySpeakerName: e.target.value,
                    })
                  )
                }
                placeholder="NPC/기타면 직접 이름 입력"
              />
            </label>

            <label className="form-field">
              <span>대상 이름</span>
              <input
                value={option.replyTargetName || ""}
                onChange={(e) =>
                  setChoiceOptions(
                    replaceAt(choiceOptions, index, {
                      ...option,
                      replyTargetName: e.target.value,
                    })
                  )
                }
                placeholder="예: 유연"
              />
            </label>

            <label className="form-field form-field-full">
              <span>답글 내용</span>
              <textarea
                rows={3}
                value={option.replyContent || ""}
                onChange={(e) =>
                  setChoiceOptions(
                    replaceAt(choiceOptions, index, {
                      ...option,
                      replyContent: e.target.value,
                    })
                  )
                }
              />
            </label>

            <button
              type="button"
              className="nav-link"
              onClick={() => setChoiceOptions(removeAt(choiceOptions, index))}
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      <div className="archive-card" style={{ display: "grid", gap: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <strong>댓글</strong>
          <button
            type="button"
            className="primary-button"
            style={{ marginTop: 0 }}
            onClick={() =>
              setComments((prev) => [
                ...prev,
                {
                  ...createMakerComment(),
                  speakerKey: "npc",
                  speakerName: "",
                  avatarUrl: "/profile/npc.png",
                },
              ])
            }
          >
            댓글 추가
          </button>
        </div>

        {comments.map((comment, index) => (
          <div
            key={comment.id}
            className="form-grid"
            style={{
              padding: 12,
              border: "1px solid #d7e0ec",
              borderRadius: 12,
            }}
          >
            <label className="form-field">
              <span>화자</span>
              <select
                value={comment.speakerKey || "npc"}
                onChange={(e) =>
                  setComments(
                    replaceAt(comments, index, {
                      ...comment,
                      speakerKey: e.target.value,
                      speakerName: isNpcLikeKey(e.target.value)
                        ? comment.speakerName || ""
                        : getReplySpeakerName(e.target.value),
                      avatarUrl:
                        e.target.value === "npc" || e.target.value === "other"
                          ? "/profile/npc.png"
                          : MAKER_CHARACTER_AVATAR_MAP[e.target.value] ||
                            "/profile/npc.png",
                    })
                  )
                }
              >
                {REPLY_SPEAKER_OPTIONS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>화자 이름</span>
              <input
                value={comment.speakerName || ""}
                onChange={(e) =>
                  setComments(
                    replaceAt(comments, index, {
                      ...comment,
                      speakerName: e.target.value,
                    })
                  )
                }
                placeholder="NPC/기타면 직접 이름 입력"
              />
            </label>

            <label className="form-field">
              <span>프사 URL</span>
              <input
                value={comment.avatarUrl || ""}
                onChange={(e) =>
                  setComments(
                    replaceAt(comments, index, {
                      ...comment,
                      avatarUrl: e.target.value,
                    })
                  )
                }
              />
            </label>

            <label className="form-field form-field-full">
              <span>내용</span>
              <textarea
                rows={3}
                value={comment.content || ""}
                onChange={(e) =>
                  setComments(
                    replaceAt(comments, index, {
                      ...comment,
                      content: e.target.value,
                    })
                  )
                }
              />
            </label>

            <button
              type="button"
              className="nav-link"
              onClick={() => setComments(removeAt(comments, index))}
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      <button type="submit" className="primary-button">
        {submitLabel}
      </button>
    </form>
  );
}