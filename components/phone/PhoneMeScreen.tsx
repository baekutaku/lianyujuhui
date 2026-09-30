"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createBasePhoneProfileOption,
  updateBasePhoneProfileOption,
  deactivateBasePhoneProfileOption,
  createCustomPhoneProfile,
  deactivateCustomPhoneProfile,
  selectPhoneProfile,
  createSharedCustomPhoneProfile,
  deactivateSharedCustomPhoneProfile,
  cloneSharedProfileToCustom,
} from "@/app/phone-items/me/actions";
import { setPhoneGuestName, resetPhoneGuestName } from "@/app/phone-items/me/name-actions";

// ── 타입 ────────────────────────────────────────────────────────────────────

type ProfileOption = {
  id: string;
  title: string;
  imageUrl: string;
  sourceType: "option" | "custom";
  sortOrder?: number;
};

type SharedPoolItem = {
  id: string;
  title: string;
  imageUrl: string;
  sortOrder?: number;
};

type CharacterCard = {
  key: string;
  label: string;
  avatarUrl: string;
  affinity: number;
  moments: number;
};

type Props = {
  viewerName: string;
  /** 서버에서 계산된 현재 선택 아바타 URL */
  defaultAvatarUrl: string;
  /** 항상 /profile/mc.png — 기본값 복귀용 */
  baseDefaultAvatarUrl: string;
  baseProfileOptions?: ProfileOption[];
  customProfileOptions?: ProfileOption[];
  sharedCustomPool?: SharedPoolItem[];
  characters?: CharacterCard[];
  myMomentCount?: number;
  totalMomentCount?: number;
  initialSelectedSourceType?: "option" | "custom" | null;
  initialSelectedSourceId?: string | null;
  isAdmin?: boolean;
};

// ── localStorage 키 ─────────────────────────────────────────────────────────
const LS_KEY     = "mlqc_phone_me_avatar";
const LS_URL_KEY = "mlqc_phone_me_avatar_url";

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function PhoneMeScreen({
  viewerName,
  defaultAvatarUrl,
  baseDefaultAvatarUrl,
  baseProfileOptions   = [],
  customProfileOptions = [],
  sharedCustomPool     = [],
  characters           = [],
  myMomentCount        = 0,
  totalMomentCount     = 0,
  initialSelectedSourceType,
  initialSelectedSourceId,
  isAdmin = false,
}: Props) {
  
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // 이름
  const [draftName, setDraftName] = useState(viewerName);
  useEffect(() => { setDraftName(viewerName); }, [viewerName]);

  // 피커 열림
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // 현재 보여지는 아바타 (페이지 수준)
  const [currentAvatar, setCurrentAvatar] = useState(defaultAvatarUrl);

  // 피커 내부 선택키: "sourceType:id"
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // 폼 상태
  const [customTitle,    setCustomTitle]    = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");

  const [adminTitle,     setAdminTitle]     = useState("");
  const [adminImageUrl,  setAdminImageUrl]  = useState("");
  const [adminSortOrder, setAdminSortOrder] = useState("0");

  const [sharedTitle,     setSharedTitle]     = useState("");
  const [sharedImageUrl,  setSharedImageUrl]  = useState("");
  const [sharedSortOrder, setSharedSortOrder] = useState("0");

  const [editingBaseId,  setEditingBaseId]  = useState<string | null>(null);
  const [editTitle,      setEditTitle]      = useState("");
  const [editImageUrl,   setEditImageUrl]   = useState("");
  const [editSortOrder,  setEditSortOrder]  = useState("0");

  // ── 기본 프로필 목록: /profile/mc.png를 맨 앞에 고정 ───────────────────
  const mergedBaseOptions = useMemo<ProfileOption[]>(() => {
    const defaultItem: ProfileOption = {
      id: "__default__",
      title: "기본",
      imageUrl: baseDefaultAvatarUrl,
      sourceType: "option",
      sortOrder: -9999,
    };
    const hasDefault = baseProfileOptions.some(
      (o) => o.imageUrl.trim() === baseDefaultAvatarUrl
    );
    return hasDefault ? baseProfileOptions : [defaultItem, ...baseProfileOptions];
  }, [baseDefaultAvatarUrl, baseProfileOptions]);

   // 피커에서 선택 가능한 전체 목록 (기본 + 공유 커스텀 풀 + 내 커스텀)
  const allOptions = useMemo(
    () => [
      ...mergedBaseOptions,
      ...sharedCustomPool.map((item) => ({
        ...item,
        sourceType: "option" as const, // option으로 취급해서 선택 저장
      })),
      ...customProfileOptions,
    ],
    [mergedBaseOptions, sharedCustomPool, customProfileOptions]
  );

  // 초기 선택값 계산
  const initialSelected = useMemo(() => {
    if (initialSelectedSourceType && initialSelectedSourceId) {
      return (
        allOptions.find(
          (o) => o.sourceType === initialSelectedSourceType && o.id === initialSelectedSourceId
        ) ?? null
      );
    }
    return allOptions[0] ?? null;
  }, [allOptions, initialSelectedSourceType, initialSelectedSourceId]);

  // localStorage → initialSelected 순으로 selectedKey 복원
  useEffect(() => {
    const savedKey = window.localStorage.getItem(LS_KEY);
    const savedUrl = window.localStorage.getItem(LS_URL_KEY);

    if (savedKey) {
      const matched = allOptions.find((o) => `${o.sourceType}:${o.id}` === savedKey);
      if (matched) {
        setSelectedKey(savedKey);
        setCurrentAvatar(matched.imageUrl);
        return;
      }
    }

    if (savedUrl?.trim()) {
      const matchedByUrl = allOptions.find((o) => o.imageUrl.trim() === savedUrl);
      if (matchedByUrl) {
        setSelectedKey(`${matchedByUrl.sourceType}:${matchedByUrl.id}`);
        setCurrentAvatar(savedUrl);
        return;
      }
    }

    if (initialSelected) {
      setSelectedKey(`${initialSelected.sourceType}:${initialSelected.id}`);
      setCurrentAvatar(initialSelected.imageUrl);
      return;
    }

    setSelectedKey(null);
    setCurrentAvatar(baseDefaultAvatarUrl);
  }, [allOptions, baseDefaultAvatarUrl, initialSelected]);

  const selectedOption = useMemo(
    () => allOptions.find((o) => `${o.sourceType}:${o.id}` === selectedKey) ?? null,
    [allOptions, selectedKey]
  );

  // 내 커스텀에 이미 있는 imageUrl 집합 (공유 풀 중복 체크용)
  const myCustomUrls = useMemo(
    () => new Set(customProfileOptions.map((o) => o.imageUrl)),
    [customProfileOptions]
  );

  // ── 핸들러 ──────────────────────────────────────────────────────────────

  function confirmProfile() {
    if (!selectedOption) return;
    startTransition(async () => {
      try {
        if (selectedOption.id !== "__default__") {
          await selectPhoneProfile({
            sourceType: selectedOption.sourceType,
            sourceId: selectedOption.id,
          });
        }
        setCurrentAvatar(selectedOption.imageUrl);
        window.localStorage.setItem(LS_KEY, `${selectedOption.sourceType}:${selectedOption.id}`);
        window.localStorage.setItem(LS_URL_KEY, selectedOption.imageUrl);
        setIsPickerOpen(false);
      } catch (e) {
        alert(e instanceof Error ? e.message : "프로필 선택 실패");
      }
    });
  }

  function handleCreateCustom() {
    startTransition(async () => {
      try {
        await createCustomPhoneProfile({ title: customTitle, imageUrl: customImageUrl });
        window.location.reload();
      } catch (e) { alert(e instanceof Error ? e.message : "추가 실패"); }
    });
  }

  function handleDeleteCustom(id: string) {
    startTransition(async () => {
      try {
        await deactivateCustomPhoneProfile(id);
        window.location.reload();
      } catch (e) { alert(e instanceof Error ? e.message : "삭제 실패"); }
    });
  }

  function handleCloneShared(sharedOptionId: string) {
    startTransition(async () => {
      try {
        await cloneSharedProfileToCustom({ sharedOptionId });
        window.location.reload();
      } catch (e) { alert(e instanceof Error ? e.message : "추가 실패"); }
    });
  }

  function handleCreateBase() {
    startTransition(async () => {
      try {
        await createBasePhoneProfileOption({
          title: adminTitle,
          imageUrl: adminImageUrl,
          sortOrder: toNum(adminSortOrder),
        });
        window.location.reload();
      } catch (e) { alert(e instanceof Error ? e.message : "추가 실패"); }
    });
  }

  function handleStartEditBase(item: ProfileOption) {
    setEditingBaseId(item.id);
    setEditTitle(item.title ?? "");
    setEditImageUrl(item.imageUrl ?? "");
    setEditSortOrder(String(item.sortOrder ?? 0));
  }

  function handleSaveEditBase() {
    if (!editingBaseId) return;
    startTransition(async () => {
      try {
        await updateBasePhoneProfileOption({
          id: editingBaseId,
          title: editTitle,
          imageUrl: editImageUrl,
          sortOrder: toNum(editSortOrder),
        });
        window.location.reload();
      } catch (e) { alert(e instanceof Error ? e.message : "수정 실패"); }
    });
  }

  function handleDeleteBase(id: string) {
    startTransition(async () => {
      try {
        await deactivateBasePhoneProfileOption(id);
        window.location.reload();
      } catch (e) { alert(e instanceof Error ? e.message : "삭제 실패"); }
    });
  }

  function handleCreateShared() {
    startTransition(async () => {
      try {
        await createSharedCustomPhoneProfile({
          title: sharedTitle,
          imageUrl: sharedImageUrl,
          sortOrder: toNum(sharedSortOrder),
        });
        window.location.reload();
      } catch (e) { alert(e instanceof Error ? e.message : "추가 실패"); }
    });
  }

  function handleDeleteShared(id: string) {
    startTransition(async () => {
      try {
        await deactivateSharedCustomPhoneProfile(id);
        window.location.reload();
      } catch (e) { alert(e instanceof Error ? e.message : "삭제 실패"); }
    });
  }

  function handleSaveGuestName() {
    startTransition(async () => {
      try {
        await setPhoneGuestName(draftName);
        router.refresh();
      } catch (e) { alert(e instanceof Error ? e.message : "이름 저장 실패"); }
    });
  }

  function handleResetGuestName() {
    startTransition(async () => {
      try {
        await resetPhoneGuestName();
        setDraftName("유연");
        router.refresh();
      } catch (e) { alert(e instanceof Error ? e.message : "이름 초기화 실패"); }
    });
  }

  // ── 렌더 ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── 메인 화면 ── */}
      <div className="phone-personal-screen phone-personal-screen-mc">
        <section className="phone-personal-hero phone-personal-hero-mc">
          <div className="phone-personal-title">개인 상세</div>

          <div className="phone-self-panel">
            <img src={currentAvatar} alt={viewerName} className="phone-self-avatar" />

            <div className="phone-self-body">
              <div className="phone-self-name-row">
                <strong className="phone-self-name">{viewerName}</strong>
              </div>

              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="이름 입력"
                maxLength={20}
                className="phone-self-name-input"
              />

              <div className="phone-self-actions">
                <button type="button" className="phone-self-action phone-self-action-save"
                  onClick={handleSaveGuestName} disabled={isPending}>
                  이름 저장
                </button>
                <button type="button" className="phone-self-action phone-self-action-reset"
                  onClick={handleResetGuestName} disabled={isPending}>
                  이름 초기화
                </button>
                <button type="button" className="phone-self-action phone-self-action-profile"
                  onClick={() => setIsPickerOpen(true)}>
                  프로필 변경
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="phone-affection-section">
          <div className="phone-section-title phone-section-title-love">호감도</div>
          <div className="phone-affinity-row">
            {characters.map((c) => (
              <Link key={c.key} href={`/phone-items/me/${c.key}`} className="phone-affinity-card">
                <img src={c.avatarUrl} alt={c.label} className="phone-affinity-avatar" />
                <span className="phone-affinity-name">{c.label}</span>
                <span className="phone-affinity-heart">{c.affinity}</span>
                <span className="phone-affinity-bar">
                  <span className="phone-affinity-bar-fill"
                    style={{ width: `${Math.min(c.affinity, 100)}%` }} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <nav className="phone-personal-menu">
          <Link href="/phone-items/moments/mc" className="phone-menu-row">
            <span className="phone-menu-left">
              <span className="material-symbols-rounded phone-menu-icon">local_florist</span>
              <span>모멘트</span>
            </span>
            <span className="phone-menu-count">
              {totalMomentCount > 0 ? `${myMomentCount}/${totalMomentCount}` : myMomentCount}
            </span>
          </Link>
          {(["image/앨범", "palette/휴대폰 테마 선택", "chat_bubble/채팅 버블 변경"] as const).map((s) => {
            const [icon, label] = s.split("/");
            return (
              <div key={label} className="phone-menu-row is-disabled">
                <span className="phone-menu-left">
                  <span className="material-symbols-rounded phone-menu-icon">{icon}</span>
                  <span>{label}</span>
                </span>
              </div>
            );
          })}
          <div className="phone-menu-row phone-menu-row-toggle">
            <span className="phone-menu-left">
              <span className="material-symbols-rounded phone-menu-icon">music_off</span>
              <span>통화 중 배경음악 끄기</span>
            </span>
            <span className="phone-menu-switch" aria-hidden="true"><span /></span>
          </div>
        </nav>
      </div>

      {/* ── 프로필 피커 모달 ── */}
      {isPickerOpen && (
        <div
          onClick={() => setIsPickerOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(55,49,60,0.28)",
            display: "grid", placeItems: "center",
            padding: 24, zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 860, maxHeight: "85vh",
              overflowY: "auto",
              background: "rgba(255,255,255,0.97)",
              borderRadius: 24, padding: 28,
              boxShadow: "0 20px 40px rgba(72,56,78,0.2)",
            }}
          >
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#9c7c88", marginBottom: 24 }}>
              프로필 변경
            </h2>

            {/* ① 기본 프로필 */}
            <PickerSection label="기본 프로필">
              <div style={GRID}>
                {mergedBaseOptions.map((item) => {
                  const key = `${item.sourceType}:${item.id}`;
                  return (
                    <ProfileCard
                      key={key}
                      item={item}
                      active={key === selectedKey}
                      onSelect={() => setSelectedKey(key)}
                      footer={
                        isAdmin && item.id !== "__default__" ? (
                          <>
                            <MinBtn color="#eef4ff" text="#5f7392"
                              onClick={() => handleStartEditBase(item)}>수정</MinBtn>
                            <MinBtn color="#ffe8ee" text="#9f6574"
                              onClick={() => handleDeleteBase(item.id)}>삭제</MinBtn>
                          </>
                        ) : null
                      }
                    />
                  );
                })}
              </div>
            </PickerSection>

           {/* ② 공유 커스텀 풀 — 모두 바로 선택 가능 */}
            {sharedCustomPool.length > 0 && (
              <PickerSection
                label="커스텀 프로필"
                bg="rgba(255,248,252,0.9)"
                border="1px solid rgba(242,168,200,0.3)"
              >
                <div style={GRID}>
                  {sharedCustomPool.map((item) => {
                    const key = `option:${item.id}`;
                    return (
                      <ProfileCard
                        key={key}
                        item={{ ...item, sourceType: "option" }}
                        active={key === selectedKey}
                        onSelect={() => setSelectedKey(key)}
                        footer={
                          isAdmin ? (
                            <MinBtn color="#ffe8ee" text="#9f6574"
                              onClick={() => handleDeleteShared(item.id)}>
                              삭제
                            </MinBtn>
                          ) : null
                        }
                      />
                    );
                  })}
                </div>
              </PickerSection>
            )}

            {/* ③ 내 커스텀 프로필 */}
            {customProfileOptions.length > 0 && (
              <PickerSection label="내 커스텀 프로필">
                <div style={GRID}>
                  {customProfileOptions.map((item) => {
                    const key = `${item.sourceType}:${item.id}`;
                    return (
                      <ProfileCard
                        key={key}
                        item={item}
                        active={key === selectedKey}
                        onSelect={() => setSelectedKey(key)}
                           footer={
                          <MinBtn color="#ffe8ee" text="#9a5f71"
                            onClick={() => handleDeleteCustom(item.id)}>
                            삭제
                          </MinBtn>
                        }
                      />
                    );
                  })}
                </div>
              </PickerSection>
            )}

            {/* ④ 내 커스텀 직접 추가 */}
            <FormBox label="내 커스텀 직접 추가" bg="rgba(248,245,249,0.9)">
              <input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="제목 (선택)" style={INPUT} />
              <input value={customImageUrl} onChange={(e) => setCustomImageUrl(e.target.value)}
                placeholder="이미지 URL 또는 /profile/... 경로" style={INPUT} />
              <button type="button" className="primary-button"
                style={{ marginTop: 0, borderRadius: 12 }}
                onClick={handleCreateCustom} disabled={isPending}>
                추가하기
              </button>
            </FormBox>

            {/* ⑤ 관리자: 기본 프로필 추가 */}
            {isAdmin && (
              <FormBox label="관리자: 기본 프로필 추가" bg="rgba(240,247,255,0.9)">
                <input value={adminTitle} onChange={(e) => setAdminTitle(e.target.value)}
                  placeholder="제목 (선택)" style={INPUT} />
                <input value={adminImageUrl} onChange={(e) => setAdminImageUrl(e.target.value)}
                  placeholder="이미지 URL 또는 /profile/... 경로" style={INPUT} />
                <input value={adminSortOrder} onChange={(e) => setAdminSortOrder(e.target.value)}
                  placeholder="정렬 순서" style={INPUT} />
                <button type="button" className="primary-button"
                  style={{ marginTop: 0, borderRadius: 12 }}
                  onClick={handleCreateBase} disabled={isPending}>
                  기본 프로필 추가
                </button>
              </FormBox>
            )}

            {/* ⑥ 관리자: 공유 커스텀 풀 추가 */}
            {isAdmin && (
              <FormBox
                label="관리자: 공유 커스텀 풀 추가"
                description="추가하면 모든 익명이 내 커스텀으로 가져갈 수 있어요"
                bg="rgba(255,248,240,0.9)"
                border="1px solid rgba(242,200,168,0.4)"
              >
                <input value={sharedTitle} onChange={(e) => setSharedTitle(e.target.value)}
                  placeholder="제목 (선택)" style={INPUT} />
                <input value={sharedImageUrl} onChange={(e) => setSharedImageUrl(e.target.value)}
                  placeholder="이미지 URL 또는 /profile/... 경로" style={INPUT} />
                <input value={sharedSortOrder} onChange={(e) => setSharedSortOrder(e.target.value)}
                  placeholder="정렬 순서" style={INPUT} />
                <button type="button" className="primary-button"
                  style={{ marginTop: 0, borderRadius: 12 }}
                  onClick={handleCreateShared} disabled={isPending}>
                  공유 풀에 추가
                </button>
              </FormBox>
            )}

            {/* ⑦ 관리자: 기본 프로필 수정 (수정 버튼 눌렀을 때만 노출) */}
            {isAdmin && editingBaseId && (
              <FormBox label="관리자: 기본 프로필 수정" bg="rgba(255,247,240,0.9)">
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="제목 (선택)" style={INPUT} />
                <input value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="이미지 URL 또는 /profile/... 경로" style={INPUT} />
                <input value={editSortOrder} onChange={(e) => setEditSortOrder(e.target.value)}
                  placeholder="정렬 순서" style={INPUT} />
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" className="primary-button"
                    style={{ marginTop: 0, borderRadius: 12 }}
                    onClick={handleSaveEditBase} disabled={isPending}>
                    수정 저장
                  </button>
                  <button type="button" className="nav-link"
                    style={{ border: "none", borderRadius: 12, padding: "12px 18px",
                      background: "rgba(181,192,224,0.28)" }}
                    onClick={() => setEditingBaseId(null)}>
                    취소
                  </button>
                </div>
              </FormBox>
            )}

            {/* 하단 버튼 */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
              <button type="button" className="nav-link"
                style={{ border: "none", borderRadius: 12, padding: "12px 24px",
                  background: "rgba(181,192,224,0.28)" }}
                onClick={() => setIsPickerOpen(false)}>
                취소
              </button>
              <button type="button" className="primary-button"
                style={{ marginTop: 0, borderRadius: 12, padding: "12px 24px" }}
                onClick={confirmProfile}
                disabled={isPending || !selectedOption}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function PickerSection({
  label, description, bg, border, children,
}: {
  label: string; description?: string;
  bg?: string; border?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      marginBottom: 24, padding: bg ? 16 : 0,
      borderRadius: bg ? 16 : 0,
      background: bg ?? "transparent",
      border: border ?? "none",
    }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#6d6170", marginBottom: description ? 4 : 12 }}>
        {label}
      </div>
      {description && (
        <p style={{ fontSize: 12, color: "#a88a96", marginTop: 0, marginBottom: 14 }}>{description}</p>
      )}
      {children}
    </div>
  );
}

function FormBox({
  label, description, bg, border, children,
}: {
  label: string; description?: string;
  bg: string; border?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      display: "grid", gap: 10, padding: 16,
      borderRadius: 16, background: bg,
      border: border ?? "none",
      marginBottom: 22,
    }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#6d6170" }}>{label}</div>
      {description && (
        <p style={{ fontSize: 12, color: "#a89080", margin: 0 }}>{description}</p>
      )}
      {children}
    </div>
  );
}

function ProfileCard({
  item, active, onSelect, footer,
}: {
  item: { id: string; title: string; imageUrl: string; sourceType?: string };
  active: boolean;
  onSelect: () => void;
  footer?: React.ReactNode;
}) {
  return (
    <div style={{
      ...CARD_BASE,
      border: active ? "3px solid #f2a8c8" : "1px solid rgba(222,208,224,0.9)",
    }}>
      <button type="button" onClick={onSelect}
        style={{ width: "100%", border: "none", background: "transparent", padding: 0, cursor: "pointer" }}>
        <img src={item.imageUrl} alt="" style={THUMB} />
        <div style={CARD_TITLE}>{item.title}</div>
      </button>
      {footer && <div style={{ display: "grid", gap: 6, marginTop: 8 }}>{footer}</div>}
    </div>
  );
}

function MinBtn({
  children, color, text, onClick, style,
}: {
  children: React.ReactNode;
  color: string; text: string;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button type="button" onClick={onClick}
      style={{ ...MINI_BTN_BASE, background: color, color: text, cursor: "pointer", ...style }}>
      {children}
    </button>
  );
}

// ── 스타일 상수 ──────────────────────────────────────────────────────────────

const GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 16,
  marginBottom: 8,
};

const CARD_BASE: React.CSSProperties = {
  background: "white",
  borderRadius: 18,
  padding: 8,
};

const THUMB: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1 / 1",
  objectFit: "cover",
  borderRadius: 12,
  display: "block",
  marginBottom: 6,
};

const CARD_TITLE: React.CSSProperties = {
  fontSize: 12,
  color: "#776d7b",
  minHeight: 16,
  textAlign: "center",
};

const MINI_BTN_BASE: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: 10,
  padding: "7px 10px",
  fontSize: 12,
  fontWeight: 600,
};

const INPUT: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(222,208,224,0.9)",
  padding: "12px 14px",
  font: "inherit",
};

function toNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}