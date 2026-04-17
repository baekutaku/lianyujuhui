"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HomeGuestbookForm from "@/components/home/HomeGuestbookForm";

type GuestbookListRow = {
  id: string;
  nickname: string | null;
  content: string | null;
  is_private: boolean;
  admin_reply: string | null;
  created_at: string;
};

type Props = {
  isAdmin: boolean;
  guestbookItems?: GuestbookListRow[];
};



function shorten(value: string, max = 34) {
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export default function HomeGuestbookTabs({
  isAdmin,
  guestbookItems = [],
}: Props) {
  const [tab, setTab] = useState<"write" | "list">("write");

  return (
    <section className="home-widget-panel">
      <div className="home-guestbook-tabs">
        <button
          type="button"
          className={`home-guestbook-tab ${tab === "write" ? "is-active" : ""}`}
          onClick={() => setTab("write")}
        >
          <span>Anonymous</span>
        </button>

        <button
          type="button"
          className={`home-guestbook-tab ${tab === "list" ? "is-active" : ""}`}
          onClick={() => setTab("list")}
        >
          <span>guestbook</span>
        </button>
      </div>

      {tab === "write" ? (
        <HomeGuestbookForm onSuccess={() => setTab("list")} />
      ) : (
        <GuestbookListPanel
          isAdmin={isAdmin}
          items={guestbookItems}
        />
      )}
    </section>
  );
}

function GuestbookListPanel({
  isAdmin,
  items = [],
}: {
  isAdmin: boolean;
  items?: GuestbookListRow[];
}) {
  const router = useRouter();

  return (
    <div className="home-guestbook-list-scroll">
      <div className="home-guestbook-preview-list">
        {items.length === 0 ? (
          <p className="home-guestbook-empty">아직 등록된 글이 없음.</p>
        ) : (
          items.map((item) =>
            item.is_private ? (
              <SecretGuestbookRow
                key={item.id}
                item={item}
                isAdmin={isAdmin}
                onChanged={() => router.refresh()}
              />
            ) : (
              <OpenGuestbookRow
                key={item.id}
                item={item}
                isAdmin={isAdmin}
                onChanged={() => router.refresh()}
              />
            )
          )
        )}
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function OpenGuestbookRow({
  item,
  isAdmin,
  onChanged,
}: {
  item: GuestbookListRow;
  isAdmin: boolean;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [reply, setReply] = useState(item.admin_reply ?? "");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (isAdmin) {
      if (!window.confirm("삭제할까?")) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/guestbook/${item.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          alert(data.message || "삭제 실패");
          return;
        }

        onChanged();
      } catch {
        alert("삭제 실패");
      } finally {
        setLoading(false);
      }

      return;
    }

    const password = window.prompt("글 비밀번호 입력");
    if (!password) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/guestbook/${item.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.message || "삭제 실패");
        return;
      }

      onChanged();
    } catch {
      alert("삭제 실패");
    } finally {
      setLoading(false);
    }
  }

  async function handleReplySave() {
    if (!isAdmin) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/guestbook/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: reply }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.message || "답글 저장 실패");
        return;
      }

      onChanged();
    } catch {
      alert("답글 저장 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="home-guestbook-preview-card">
      <button
        type="button"
        className="home-guestbook-row-toggle"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="home-guestbook-preview-head">
          <strong>{item.nickname?.trim() || "익명"}</strong>
          <span>{formatDate(item.created_at)}</span>
        </div>

        <div className="home-guestbook-badges">
          <span className="guestbook-badge">공개글</span>
        </div>

        <p className="home-guestbook-preview-summary">
          {item.content ? shorten(item.content) : "내용 없음"}
        </p>
      </button>

      {expanded ? (
        <div className="home-guestbook-expanded">
          <p className="home-guestbook-preview-content">{item.content ?? "내용 없음"}</p>

          {item.admin_reply ? (
            <div className="home-guestbook-preview-reply">
              <p className="home-guestbook-preview-reply-label">관리자 답글</p>
              <p>{item.admin_reply}</p>
            </div>
          ) : null}

          {isAdmin ? (
            <div className="home-guestbook-admin-reply-box">
              <textarea
                className="guestbook-admin-textarea"
                placeholder="답글 입력"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <div className="guestbook-admin-actions">
                <button
                  type="button"
                  className="guestbook-inline-button"
                  disabled={loading}
                  onClick={handleReplySave}
                >
                  답글저장
                </button>
                <button
                  type="button"
                  className="guestbook-inline-button danger"
                  disabled={loading}
                  onClick={handleDelete}
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <div className="guestbook-admin-actions">
              <button
                type="button"
                className="guestbook-inline-button danger"
                disabled={loading}
                onClick={handleDelete}
              >
                삭제
              </button>
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}

function SecretGuestbookRow({
  item,
  isAdmin,
  onChanged,
}: {
  item: GuestbookListRow;
  isAdmin: boolean;
  onChanged: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState(item.admin_reply ?? "");
  const [opened, setOpened] = useState<{
    content: string;
    adminReply: string | null;
  } | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(isAdmin);

  async function handleUnlock() {
    if (!password) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/guestbook/${item.id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.message || "비밀번호가 틀림.");
        return;
      }

      setOpened({
        content: data.content,
        adminReply: data.adminReply ?? null,
      });
      setExpanded(true);
    } catch {
      setError("열람 실패");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (isAdmin) {
      if (!window.confirm("삭제할까?")) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/guestbook/${item.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          alert(data.message || "삭제 실패");
          return;
        }

        onChanged();
      } catch {
        alert("삭제 실패");
      } finally {
        setLoading(false);
      }

      return;
    }

    const deletePassword = password || window.prompt("글 비밀번호 입력") || "";
    if (!deletePassword) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/guestbook/${item.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.message || "삭제 실패");
        return;
      }

      onChanged();
    } catch {
      alert("삭제 실패");
    } finally {
      setLoading(false);
    }
  }

  async function handleReplySave() {
    if (!isAdmin) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/guestbook/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: reply }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.message || "답글 저장 실패");
        return;
      }

      onChanged();
    } catch {
      alert("답글 저장 실패");
    } finally {
      setLoading(false);
    }
  }

  if (isAdmin) {
    return (
      <article className="home-guestbook-preview-card">
        <button
          type="button"
          className="home-guestbook-row-toggle"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <div className="home-guestbook-preview-head">
            <strong>{item.nickname?.trim() || "익명"}</strong>
            <span>{formatDate(item.created_at)}</span>
          </div>

          <div className="home-guestbook-badges">
            <span className="guestbook-badge">비밀글</span>
          </div>

          <p className="home-guestbook-preview-summary">비밀글</p>
        </button>

        {expanded ? (
          <div className="home-guestbook-expanded">
            <p className="home-guestbook-preview-content">{item.content ?? "내용 없음"}</p>

            {item.admin_reply ? (
              <div className="home-guestbook-preview-reply">
                <p className="home-guestbook-preview-reply-label">관리자 답글</p>
                <p>{item.admin_reply}</p>
              </div>
            ) : null}

            <div className="home-guestbook-admin-reply-box">
              <textarea
                className="guestbook-admin-textarea"
                placeholder="답글 입력"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <div className="guestbook-admin-actions">
                <button
                  type="button"
                  className="guestbook-inline-button"
                  disabled={loading}
                  onClick={handleReplySave}
                >
                  답글저장
                </button>
                <button
                  type="button"
                  className="guestbook-inline-button danger"
                  disabled={loading}
                  onClick={handleDelete}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <article className="home-guestbook-preview-card">
      <div className="home-guestbook-preview-head">
        <strong>{item.nickname?.trim() || "익명"}</strong>
        <span>{formatDate(item.created_at)}</span>
      </div>

      <div className="home-guestbook-badges">
        <span className="guestbook-badge">비밀글</span>
      </div>

      {!opened ? (
        <div className="home-guestbook-secret-box">
          <p className="home-guestbook-preview-summary">비밀글</p>

          {!showPassword ? (
            <button
              type="button"
              className="guestbook-inline-button"
              onClick={() => setShowPassword(true)}
            >
              보기
            </button>
          ) : (
            <>
              <div className="home-guestbook-secret-actions">
                <input
                  type="password"
                  className="home-guestbook-input"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="guestbook-inline-button"
                  disabled={loading}
                  onClick={handleUnlock}
                >
                  {loading ? "확인 중..." : "확인"}
                </button>
              </div>

              {error ? <p className="home-guestbook-error">{error}</p> : null}
            </>
          )}
        </div>
      ) : (
        <div className="home-guestbook-expanded">
          <p className="home-guestbook-preview-content">{opened.content}</p>

          {opened.adminReply ? (
            <div className="home-guestbook-preview-reply">
              <p className="home-guestbook-preview-reply-label">관리자 답글</p>
              <p>{opened.adminReply}</p>
            </div>
          ) : null}

          <div className="guestbook-admin-actions">
            <button
              type="button"
              className="guestbook-inline-button danger"
              disabled={loading}
              onClick={handleDelete}
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

