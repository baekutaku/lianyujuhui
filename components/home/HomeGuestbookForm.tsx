"use client";

import { useState } from "react";

type Props = {
  onSuccess?: () => void;
};

export default function HomeGuestbookForm({ onSuccess }: Props) {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const homepage = String(formData.get("homepage") || "");

    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname,
          password,
          content,
          isPrivate,
          homepage,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setMessage(data.message || "등록 실패");
        return;
      }

      setNickname("");
      setPassword("");
      setContent("");
      setIsPrivate(false);
      setMessage("등록됨. 공개글은 관리자 승인 후 표시됨.");

      onSuccess?.();
    } catch {
      setMessage("등록 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="home-guestbook-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="home-guestbook-input"
        placeholder="닉네임(선택)"
        maxLength={20}
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      <input
        type="password"
        className="home-guestbook-input"
        placeholder="글 비밀번호"
        minLength={4}
        maxLength={20}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <textarea
        className="home-guestbook-textarea"
        placeholder="최대 2000자"
        maxLength={2000}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />

      <input
        type="text"
        name="homepage"
        tabIndex={-1}
        autoComplete="off"
        className="guestbook-honeypot"
      />

      <label className="home-guestbook-check">
  <input
    type="checkbox"
    checked={isPrivate}
    onChange={(e) => setIsPrivate(e.target.checked)}
  />
  <span>비공개</span>
</label>

      <button type="submit" className="home-guestbook-submit" disabled={loading}>
        {loading ? "등록 중..." : "등록"}
      </button>

      {message ? <p className="home-guestbook-feedback">{message}</p> : null}
    </form>
  );
}