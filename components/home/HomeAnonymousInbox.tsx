"use client";

import { useState } from "react";

export default function HomeAnonymousInbox() {
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/anonymous-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname,
          content,
          isPrivate,
          homepage: "",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setMessage(data.message || "등록 실패");
        return;
      }

      setNickname("");
      setContent("");
      setIsPrivate(false);
      setMessage("등록됨");
    } catch {
      setMessage("등록 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="home-anon-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="home-anon-input"
        placeholder="닉네임(선택)"
        maxLength={20}
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      <textarea
        className="home-anon-textarea"
        placeholder="(비밀글이면 체크)."
        maxLength={500}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />

      <input
        type="text"
        name="homepage"
        tabIndex={-1}
        autoComplete="off"
        className="home-anon-honeypot"
      />

      <label className="home-anon-check">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
        />
        <span>관리자만 보기</span>
      </label>

      <button type="submit" className="home-anon-submit" disabled={loading}>
        {loading ? "전송 중..." : "남기기"}
      </button>

      {message ? <p className="home-anon-feedback">{message}</p> : null}
    </form>
  );
}