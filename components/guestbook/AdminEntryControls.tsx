"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  entryId: string;
  initialReply: string;
  initialApproved: boolean;
};

export default function AdminEntryControls({
  entryId,
  initialReply,
  initialApproved,
}: Props) {
  const router = useRouter();
  const [reply, setReply] = useState(initialReply);
  const [approved, setApproved] = useState(initialApproved);
  const [loading, setLoading] = useState(false);

  async function saveReply() {
    setLoading(true);
    try {
      const res = await fetch(`/api/guestbook/${entryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminReply: reply }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.message || "답글 저장 실패");
        return;
      }

      router.refresh();
    } catch {
      alert("답글 저장 실패");
    } finally {
      setLoading(false);
    }
  }

  async function toggleApprove() {
    setLoading(true);
    try {
      const nextApproved = !approved;

      const res = await fetch(`/api/guestbook/${entryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isApproved: nextApproved }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.message || "승인 상태 변경 실패");
        return;
      }

      setApproved(nextApproved);
      router.refresh();
    } catch {
      alert("승인 상태 변경 실패");
    } finally {
      setLoading(false);
    }
  }

  async function deleteAsAdmin() {
    if (!window.confirm("관리자 권한으로 삭제할까?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/guestbook/${entryId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.message || "삭제 실패");
        return;
      }

      router.refresh();
    } catch {
      alert("삭제 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="guestbook-admin-box">
      <textarea
        className="guestbook-admin-textarea"
        placeholder="관리자 답글"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
      />
      <div className="guestbook-admin-actions">
        <button
          type="button"
          className="guestbook-inline-button"
          onClick={saveReply}
          disabled={loading}
        >
          답글 저장
        </button>
        <button
          type="button"
          className="guestbook-inline-button"
          onClick={toggleApprove}
          disabled={loading}
        >
          {approved ? "승인취소" : "공개승인"}
        </button>
        <button
          type="button"
          className="guestbook-inline-button danger"
          onClick={deleteAsAdmin}
          disabled={loading}
        >
          관리자삭제
        </button>
      </div>
    </div>
  );
}