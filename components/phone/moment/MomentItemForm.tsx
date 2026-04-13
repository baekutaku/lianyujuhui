"use client";
import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import SmartEditor from "@/components/SmartEditor";
import { v4 as uuidv4 } from "uuid";

type MomentReply = {
  authorKey: string; // npc, baiqi, lizeyan 등
  text: string;
};

type MomentFormProps = {
  characterKey: string;
  serverId: string;
  isAdmin: boolean;
};

export default function MomentItemForm({ characterKey, serverId, isAdmin }: MomentFormProps) {
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [replyLines, setReplyLines] = useState<MomentReply[]>([]);

  const addReplyLine = () => setReplyLines([...replyLines, { authorKey: characterKey, text: "" }]);
  const updateReplyLine = (index: number, text: string) => {
    const copy = [...replyLines];
    copy[index].text = text;
    setReplyLines(copy);
  };
  const removeReplyLine = (index: number) => {
    const copy = [...replyLines];
    copy.splice(index, 1);
    setReplyLines(copy);
  };

  const handleSubmit = async () => {
    if (!isAdmin) return alert("관리자만 등록 가능합니다.");
    if (!title.trim()) return alert("제목을 입력하세요.");

    const slug = `${characterKey}-${uuidv4()}`;

    const payload = {
      content_id: uuidv4(),
      origin_key: slug,
      server_id: serverId,
      primary_character_id: characterKey,
      title,
      slug,
      subtype: "moment",
      is_published: true,
      content_json: {
        characterKey,
        title,
        contentHtml,
        imageUrl,
        replyLinesJson: JSON.stringify(replyLines),
      },
    };

    const { data, error } = await supabase.from("phone_items").insert(payload).select().single();
    if (error) {
      console.error(error);
      alert("모멘트 등록 실패: " + error.message);
      return;
    }

    alert("모멘트 등록 완료!");
    setTitle("");
    setContentHtml("");
    setImageUrl("");
    setReplyLines([]);
  };

  return (
    <div className="moment-form">
      <input
        type="text"
        placeholder="모멘트 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <SmartEditor value={contentHtml} onChange={setContentHtml} />

      <input
        type="text"
        placeholder="이미지 URL (선택)"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />

      <div className="reply-lines">
        {replyLines.map((r, idx) => (
          <div key={idx}>
            <input
              type="text"
              placeholder={`${r.authorKey} 답글`}
              value={r.text}
              onChange={(e) => updateReplyLine(idx, e.target.value)}
            />
            <button type="button" onClick={() => removeReplyLine(idx)}>삭제</button>
          </div>
        ))}
        <button type="button" onClick={addReplyLine}>답글 추가</button>
      </div>

      <button type="button" onClick={handleSubmit}>모멘트 등록</button>
    </div>
  );
}