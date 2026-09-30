"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  entryId: string;
};

export default function DeleteGuestbookButton({ entryId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const password = window.prompt("글 비밀번호 입력");
    if (!password) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/guestbook/${entryId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
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
    <button
      type="button"
      className="guestbook-inline-button"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? "삭제 중..." : "삭제"}
    </button>
  );
}