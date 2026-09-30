// components/phone/moment/MomentThreadView.tsx
import { useState } from "react";

// 답장 데이터 타입
type MomentReplyLine = {
  authorKey: string;      // 작성자 캐릭터 키
  authorName: string;     // 작성자 이름
  content: string;        // 답장 내용
  avatarUrl?: string;     // 프로필 이미지 (없으면 NPC 기본 이미지)
};

// Props 타입
type MomentThreadProps = {
  momentReplyLinesJson?: string; // 서버에서 오는 기존 JSON 문자열, optional
};

export default function MomentThreadView({ momentReplyLinesJson }: MomentThreadProps) {
  // JSON이 없거나 잘못된 경우에도 빈 배열로 초기화
  const [momentReplyLines, setMomentReplyLines] = useState<MomentReplyLine[]>(() => {
    try {
      return JSON.parse(momentReplyLinesJson || "[]");
    } catch {
      return [];
    }
  });

  // 답장이 없는 경우도 빈 화면 표시
  if (!momentReplyLines.length) {
    return (
      <div className="moment-thread-empty">
        <p>답장이 없습니다.</p>
      </div>
    );
  }

  // 답장 렌더링
  return (
    <div className="moment-thread">
      {momentReplyLines.map((line, idx) => (
        <div key={idx} className="moment-reply">
          <img
            src={line.avatarUrl?.trim() || "/profile/npc.png"}
            alt={line.authorName}
            className="moment-reply-avatar"
          />
          <span className="moment-reply-author">{line.authorName}</span>:
          <span className="moment-reply-content">{line.content}</span>
        </div>
      ))}
    </div>
  );
}