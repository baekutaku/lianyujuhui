"use client";

import { type ReactNode, useMemo, useState } from "react";
import { parseMessageBulk } from "@/lib/admin/phoneBulkParsers";
import MakerMessageBlockEditor from "@/components/maker/message/MakerMessageBlockEditor";
import {
  buildMakerEditorNodesFromStoredEntries,
  flattenMakerMessageNodes,
} from "@/lib/maker/message-serializer";
import { type MakerMessageNode } from "@/lib/maker/message-types";
import {
  MAKER_CHARACTER_AVATAR_MAP,
  MAKER_CHARACTER_NAME_MAP,
} from "@/lib/maker/defaults";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
  hiddenFields?: ReactNode;
  initialValues?: {
    title?: string;
    character_key?: string;
    character_name?: string;
    avatar_url?: string;
    preview?: string;
    message_bulk_raw?: string;
    editor_entries_json?: string;
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

const messagePlaceholder = `L: 뭐 하고 있어?
R: 야근 중이에요...
L: 곧 도착할거야.
CHOICE: 집에 가고 있어요. | 아직 회사예요.
SYS: 확인완료`;

export default function MakerMessageForm({
  action,
  submitLabel = "저장",
  hiddenFields,
  initialValues,
}: Props) {
  const values = {
    title: initialValues?.title ?? "",
    character_key: initialValues?.character_key ?? "baiqi",
    character_name: initialValues?.character_name ?? "",
    avatar_url: initialValues?.avatar_url ?? "",
    preview: initialValues?.preview ?? "",
    message_bulk_raw: initialValues?.message_bulk_raw ?? "",
    editor_entries_json: initialValues?.editor_entries_json ?? "",
    input_mode: initialValues?.input_mode ?? "simple",
  };

  const [messageRaw, setMessageRaw] = useState(values.message_bulk_raw);
  const [messageCharacterKey, setMessageCharacterKey] = useState(values.character_key);
  const [messageCharacterName, setMessageCharacterName] = useState(
    values.character_name ||
      MAKER_CHARACTER_NAME_MAP[values.character_key] ||
      ""
  );
  const [messageAvatarUrl, setMessageAvatarUrl] = useState(values.avatar_url);
  const [messageInputMode, setMessageInputMode] = useState<"simple" | "bulk">(
    values.input_mode
  );

  const initialMessageEditorEntries = useMemo(() => {
    try {
      if (values.editor_entries_json.trim()) {
        return buildMakerEditorNodesFromStoredEntries(
          JSON.parse(values.editor_entries_json)
        );
      }

      return buildMakerEditorNodesFromStoredEntries(
        values.message_bulk_raw ? parseMessageBulk(values.message_bulk_raw) : []
      );
    } catch {
      return [];
    }
  }, [values.editor_entries_json, values.message_bulk_raw]);

  const [messageEditorEntries, setMessageEditorEntries] = useState<MakerMessageNode[]>(
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
      ? flattenMakerMessageNodes(messageEditorEntries)
      : bulkEntries;
  }, [messageInputMode, messageEditorEntries, bulkEntries]);

  const currentEditorEntries = useMemo(() => {
    return messageInputMode === "simple"
      ? messageEditorEntries
      : buildMakerEditorNodesFromStoredEntries(bulkEntries);
  }, [messageInputMode, messageEditorEntries, bulkEntries]);

  const resolvedMessageAvatarPreview = useMemo(() => {
    return (
      messageAvatarUrl.trim() ||
      MAKER_CHARACTER_AVATAR_MAP[messageCharacterKey] ||
      "/profile/npc.png"
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
        <label className="form-field form-field-full">
          <span>대화 제목</span>
          <input
            name="title"
            defaultValue={values.title}
            placeholder="예: 문자 예시"
          />
        </label>

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
                  MAKER_CHARACTER_NAME_MAP[nextKey] ?? ""
                );
                setMessageAvatarUrl(MAKER_CHARACTER_AVATAR_MAP[nextKey] ?? "");
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
            placeholder="예: 백기 / 기타 인물"
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

        <label className="form-field form-field-full">
          <span>목록 프리뷰</span>
          <input
            name="preview"
            defaultValue={values.preview}
            placeholder="메시지 목록에 보일 한 줄"
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

          <MakerMessageBlockEditor
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

      <button type="submit" className="primary-button">
        {submitLabel}
      </button>
    </form>
  );
}