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
  cloneSharedProfileToCustom,
} from "@/app/phone-items/me/actions";

import {
  setPhoneGuestName,
  resetPhoneGuestName,
} from "@/app/phone-items/me/name-actions";

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
  defaultAvatarUrl: string;
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

const STORAGE_KEY = "mlqc_phone_me_avatar";
const STORAGE_URL_KEY = "mlqc_phone_me_avatar_url";

export default function PhoneMeScreen({
  viewerName,
  defaultAvatarUrl,
  baseProfileOptions,
  customProfileOptions,
  sharedCustomPool,
  characters,
  myMomentCount = 0,
  totalMomentCount = 0,
  initialSelectedSourceType,
  initialSelectedSourceId,
  isAdmin = false,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [draftName, setDraftName] = useState(viewerName);
  useEffect(() => { setDraftName(viewerName); }, [viewerName]);

  const safeBaseProfileOptions = baseProfileOptions ?? [];
  const safeCustomProfileOptions = customProfileOptions ?? [];
  const safeSharedCustomPool = sharedCustomPool ?? [];
  const safeCharacters = characters ?? [];

  const [currentAvatar, setCurrentAvatar] = useState(defaultAvatarUrl);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const [customTitle, setCustomTitle] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");

  const [adminTitle, setAdminTitle] = useState("");
  const [adminImageUrl, setAdminImageUrl] = useState("");
  const [adminSortOrder, setAdminSortOrder] = useState("0");

  // 관리자 공유 커스텀 풀 추가 폼
  const [sharedTitle, setSharedTitle] = useState("");
  const [sharedImageUrl, setSharedImageUrl] = useState("");
  const [sharedSortOrder, setSharedSortOrder] = useState("0");

  const [editingBaseId, setEditingBaseId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("0");

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const mergedBaseProfileOptions = useMemo(() => {
    const defaultOption: ProfileOption = {
      id: "__default__",
      title: "",
      imageUrl: defaultAvatarUrl,
      sourceType: "option",
      sortOrder: -9999,
    };
    const hasDefault = safeBaseProfileOptions.some(
      (item) => item.imageUrl?.trim() === defaultAvatarUrl
    );
    return hasDefault
      ? safeBaseProfileOptions
      : [defaultOption, ...safeBaseProfileOptions];
  }, [defaultAvatarUrl, safeBaseProfileOptions]);

  const allOptions = useMemo(() => {
    return [...mergedBaseProfileOptions, ...safeCustomProfileOptions];
  }, [mergedBaseProfileOptions, safeCustomProfileOptions]);

  const initialSelected = useMemo(() => {
    if (initialSelectedSourceType && initialSelectedSourceId) {
      return (
        allOptions.find(
          (item) =>
            item.sourceType === initialSelectedSourceType &&
            item.id === initialSelectedSourceId
        ) ?? null
      );
    }
    return allOptions[0] ?? null;
  }, [allOptions, initialSelectedSourceId, initialSelectedSourceType]);

  useEffect(() => {
    const savedKey = window.localStorage.getItem(STORAGE_KEY);
    const savedUrl = window.localStorage.getItem(STORAGE_URL_KEY);

    if (savedKey) {
      const matched = allOptions.find(
        (item) => `${item.sourceType}:${item.id}` === savedKey
      );
      if (matched) {
        setSelectedKey(savedKey);
        setCurrentAvatar(matched.imageUrl);
        return;
      }
    }

    if (savedUrl?.trim()) {
      setCurrentAvatar(savedUrl);
      const matchedByUrl = allOptions.find(
        (item) => item.imageUrl?.trim() === savedUrl
      );
      if (matchedByUrl) {
        setSelectedKey(`${matchedByUrl.sourceType}:${matchedByUrl.id}`);
        return;
      }
    }

    if (initialSelected) {
      setSelectedKey(`${initialSelected.sourceType}:${initialSelected.id}`);
      setCurrentAvatar(initialSelected.imageUrl);
      return;
    }

    setSelectedKey(null);
    setCurrentAvatar(defaultAvatarUrl);
  }, [allOptions, defaultAvatarUrl, initialSelected]);

  const selectedOption = useMemo(() => {
    return (
      allOptions.find(
        (item) => `${item.sourceType}:${item.id}` === selectedKey
      ) ?? null
    );
  }, [allOptions, selectedKey]);

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
        window.localStorage.setItem(
          STORAGE_KEY,
          `${selectedOption.sourceType}:${selectedOption.id}`
        );
        window.localStorage.setItem(STORAGE_URL_KEY, selectedOption.imageUrl);
        setIsPickerOpen(false);
      } catch (error) {
        alert(error instanceof Error ? error.message : "프로필 선택에 실패했습니다.");
      }
    });
  }

  function handleCreateCustom() {
    startTransition(async () => {
      try {
        await createCustomPhoneProfile({
          title: customTitle,
          imageUrl: customImageUrl,
        });
        window.location.reload();
      } catch (error) {
        alert(error instanceof Error ? error.message : "커스텀 프로필 추가 실패");
      }
    });
  }

  function handleDeleteCustom(id: string) {
    startTransition(async () => {
      try {
        await deactivateCustomPhoneProfile(id);
        window.location.reload();
      } catch (error) {
        alert(error instanceof Error ? error.message : "커스텀 프로필 삭제 실패");
      }
    });
  }

  function handleCreateBase() {
    startTransition(async () => {
      try {
        await createBasePhoneProfileOption({
          title: adminTitle,
          imageUrl: adminImageUrl,
          sortOrder: Number(editOrZero(adminSortOrder)),
        });
        window.location.reload();
      } catch (error) {
        alert(error instanceof Error ? error.message : "기본 프로필 추가 실패");
      }
    });
  }

  // 관리자: 공유 커스텀 풀에 추가
  function handleCreateSharedCustom() {
    startTransition(async () => {
      try {
        await createSharedCustomPhoneProfile({
          title: sharedTitle,
          imageUrl: sharedImageUrl,
          sortOrder: Number(editOrZero(sharedSortOrder)),
        });
        window.location.reload();
      } catch (error) {
        alert(error instanceof Error ? error.message : "공유 커스텀 풀 추가 실패");
      }
    });
  }

  // 익명: 공유 풀에서 내 커스텀에 복사
  function handleCloneShared(sharedOptionId: string) {
    startTransition(async () => {
      try {
        await cloneSharedProfileToCustom({ sharedOptionId });
        window.location.reload();
      } catch (error) {
        alert(error instanceof Error ? error.message : "프로필 추가 실패");
      }
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
          sortOrder: Number(editOrZero(editSortOrder)),
        });
        window.location.reload();
      } catch (error) {
        alert(error instanceof Error ? error.message : "기본 프로필 수정 실패");
      }
    });
  }

  function handleDeleteBase(id: string) {
    startTransition(async () => {
      try {
        await deactivateBasePhoneProfileOption(id);
        window.location.reload();
      } catch (error) {
        alert(error instanceof Error ? error.message : "기본 프로필 삭제 실패");
      }
    });
  }

  function handleSaveGuestName() {
    startTransition(async () => {
      try {
        await setPhoneGuestName(draftName);
        router.refresh();
      } catch (error) {
        alert(error instanceof Error ? error.message : "이름 저장 실패");
      }
    });
  }

  function handleResetGuestName() {
    startTransition(async () => {
      try {
        await resetPhoneGuestName();
        setDraftName("유연");
        router.refresh();
      } catch (error) {
        alert(error instanceof Error ? error.message : "이름 초기화 실패");
      }
    });
  }

  // 공유 풀에서 이미 내 커스텀에 있는 항목 체크 (imageUrl 기준)
  const myCustomImageUrls = useMemo(
    () => new Set(safeCustomProfileOptions.map((item) => item.imageUrl)),
    [safeCustomProfileOptions]
  );

  return (
    <>
      <div className="phone-personal-screen phone-personal-screen-mc">
        <section className="phone-personal-hero phone-personal-hero-mc">
          <div className="phone-personal-title">개인 상세</div>

          <div className="phone-self-panel">
            <img
              src={currentAvatar}
              alt={viewerName}
              className="phone-self-avatar"
            />

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
                <button
                  type="button"
                  className="phone-self-action phone-self-action-save"
                  onClick={handleSaveGuestName}
                  disabled={isPending}
                >
                  이름 저장
                </button>

                <button
                  type="button"
                  className="phone-self-action phone-self-action-reset"
                  onClick={handleResetGuestName}
                  disabled={isPending}
                >
                  이름 초기화
                </button>

                <button
                  type="button"
                  className="phone-self-action phone-self-action-profile"
                  onClick={() => setIsPickerOpen(true)}
                >
                  프로필 변경
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="phone-affection-section">
          <div className="phone-section-title phone-section-title-love">
            호감도
          </div>

          <div className="phone-affinity-row">
            {safeCharacters.map((character) => (
              <Link
                key={character.key}
                href={`/phone-items/me/${character.key}`}
                className="phone-affinity-card"
              >
                <img
                  src={character.avatarUrl}
                  alt={character.label}
                  className="phone-affinity-avatar"
                />
                <span className="phone-affinity-name">{character.label}</span>
                <span className="phone-affinity-heart">
                  {character.affinity}
                </span>
                <span className="phone-affinity-bar">
                  <span
                    className="phone-affinity-bar-fill"
                    style={{ width: `${Math.min(character.affinity, 100)}%` }}
                  />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <nav className="phone-personal-menu">
          <Link href="/phone-items/moments/mc" className="phone-menu-row">
            <span className="phone-menu-left">
              <span className="material-symbols-rounded phone-menu-icon">
                local_florist
              </span>
              <span>모멘트</span>
            </span>
            <span className="phone-menu-count">
              {totalMomentCount > 0
                ? `${myMomentCount}/${totalMomentCount}`
                : myMomentCount}
            </span>
          </Link>

          <div className="phone-menu-row is-disabled">
            <span className="phone-menu-left">
              <span className="material-symbols-rounded phone-menu-icon">image</span>
              <span>앨범</span>
            </span>
          </div>
          <div className="phone-menu-row is-disabled">
            <span className="phone-menu-left">
              <span className="material-symbols-rounded phone-menu-icon">palette</span>
              <span>휴대폰 테마 선택</span>
            </span>
          </div>
          <div className="phone-menu-row is-disabled">
            <span className="phone-menu-left">
              <span className="material-symbols-rounded phone-menu-icon">chat_bubble</span>
              <span>채팅 버블 변경</span>
            </span>
          </div>
          <div className="phone-menu-row phone-menu-row-toggle">
            <span className="phone-menu-left">
              <span className="material-symbols-rounded phone-menu-icon">music_off</span>
              <span>통화 중 배경음악 끄기</span>
            </span>
            <span className="phone-menu-switch" aria-hidden="true">
              <span />
            </span>
          </div>
        </nav>
      </div>

      {isPickerOpen ? (
        <div
          onClick={() => setIsPickerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(55, 49, 60, 0.28)",
            display: "grid",
            placeItems: "center",
            padding: 24,
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 860,
              maxHeight: "85vh",
              overflowY: "auto",
              background: "rgba(255,255,255,0.96)",
              borderRadius: 24,
              padding: 24,
              boxShadow: "0 20px 40px rgba(72, 56, 78, 0.2)",
            }}
          >
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: "#9c7c88",
                marginBottom: 18,
              }}
            >
              프로필 변경
            </div>

            {/* ── 기본 프로필 ── */}
            <SectionLabel>기본 프로필</SectionLabel>
            <div style={gridStyle}>
              {mergedBaseProfileOptions.map((item) => {
                const key = `${item.sourceType}:${item.id}`;
                const active = key === selectedKey;
                return (
                  <ProfileCard
                    key={key}
                    item={item}
                    active={active}
                    onSelect={() => setSelectedKey(key)}
                    adminControls={
                      isAdmin && item.id !== "__default__" ? (
                        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleStartEditBase(item)}
                            style={miniButtonStyle("#eef4ff", "#5f7392")}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBase(item.id)}
                            style={miniButtonStyle("#ffe8ee", "#9f6574")}
                          >
                            삭제
                          </button>
                        </div>
                      ) : null
                    }
                  />
                );
              })}
            </div>

            {/* ── 내 커스텀 프로필 ── */}
            {safeCustomProfileOptions.length > 0 ? (
              <>
                <SectionLabel>내 커스텀 프로필</SectionLabel>
                <div style={{ ...gridStyle, marginBottom: 22 }}>
                  {safeCustomProfileOptions.map((item) => {
                    const key = `${item.sourceType}:${item.id}`;
                    const active = key === selectedKey;
                    return (
                      <ProfileCard
                        key={key}
                        item={item}
                        active={active}
                        onSelect={() => setSelectedKey(key)}
                        adminControls={
                          <button
                            type="button"
                            onClick={() => handleDeleteCustom(item.id)}
                            style={{
                              width: "100%",
                              marginTop: 8,
                              border: "none",
                              borderRadius: 10,
                              padding: "8px 10px",
                              background: "rgba(255, 230, 235, 0.9)",
                              color: "#9a5f71",
                              cursor: "pointer",
                            }}
                          >
                            삭제
                          </button>
                        }
                      />
                    );
                  })}
                </div>
              </>
            ) : null}

            {/* ── 관리자 공유 커스텀 풀 (익명에게 노출) ── */}
            {safeSharedCustomPool.length > 0 ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: "rgba(255, 248, 252, 0.9)",
                  border: "1px solid rgba(242, 168, 200, 0.3)",
                  marginBottom: 22,
                }}
              >
                <SectionLabel style={{ marginBottom: 4 }}>
                  커스텀 프로필 추가 가능 목록
                </SectionLabel>
                <p
                  style={{
                    fontSize: 12,
                    color: "#a88a96",
                    marginBottom: 14,
                    marginTop: 0,
                  }}
                >
                  아래 프로필을 내 커스텀에 추가할 수 있어요
                </p>
                <div style={gridStyle}>
                  {safeSharedCustomPool.map((item) => {
                    const alreadyAdded = myCustomImageUrls.has(item.imageUrl);
                    return (
                      <div
                        key={item.id}
                        style={{
                          border: "1px solid rgba(222, 208, 224, 0.9)",
                          background: "white",
                          borderRadius: 18,
                          padding: 8,
                          opacity: alreadyAdded ? 0.55 : 1,
                        }}
                      >
                        <img
                          src={item.imageUrl}
                          alt=""
                          style={{
                            width: "100%",
                            aspectRatio: "1 / 1",
                            objectFit: "cover",
                            borderRadius: 12,
                            display: "block",
                            marginBottom: 6,
                          }}
                        />
                        <div
                          style={{
                            fontSize: 12,
                            color: "#776d7b",
                            minHeight: 16,
                            marginBottom: 8,
                          }}
                        >
                          {item.title?.trim() || ""}
                        </div>
                        <button
                          type="button"
                          disabled={alreadyAdded || isPending}
                          onClick={() => handleCloneShared(item.id)}
                          style={{
                            width: "100%",
                            border: "none",
                            borderRadius: 10,
                            padding: "8px 10px",
                            background: alreadyAdded
                              ? "rgba(200,200,200,0.3)"
                              : "rgba(242, 168, 200, 0.25)",
                            color: alreadyAdded ? "#aaa" : "#9c5e78",
                            cursor: alreadyAdded ? "default" : "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {alreadyAdded ? "추가됨" : "내 커스텀에 추가"}
                        </button>

                        {/* 관리자일 때 공유 풀 항목도 삭제 가능 */}
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteBase(item.id)}
                            style={{
                              ...miniButtonStyle("#ffe8ee", "#9f6574"),
                              marginTop: 6,
                            }}
                          >
                            풀에서 삭제
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* ── 내 커스텀 직접 추가 ── */}
            <div
              style={{
                display: "grid",
                gap: 10,
                padding: 16,
                borderRadius: 16,
                background: "rgba(248, 245, 249, 0.9)",
                marginBottom: 22,
              }}
            >
              <SectionLabel>내 커스텀 프로필 직접 추가</SectionLabel>
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="제목(선택)"
                style={inputStyle}
              />
              <input
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                placeholder="이미지 URL 또는 /profile/... 경로"
                style={inputStyle}
              />
              <button
                type="button"
                className="primary-button"
                style={{ marginTop: 0, borderRadius: 12 }}
                onClick={handleCreateCustom}
                disabled={isPending}
              >
                내 프로필 추가
              </button>
            </div>

            {/* ── 관리자: 기본 프로필 추가 ── */}
            {isAdmin ? (
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  padding: 16,
                  borderRadius: 16,
                  background: "rgba(240, 247, 255, 0.9)",
                  marginBottom: 22,
                }}
              >
                <SectionLabel>관리자: 기본 프로필 추가</SectionLabel>
                <input
                  value={adminTitle}
                  onChange={(e) => setAdminTitle(e.target.value)}
                  placeholder="제목(선택)"
                  style={inputStyle}
                />
                <input
                  value={adminImageUrl}
                  onChange={(e) => setAdminImageUrl(e.target.value)}
                  placeholder="이미지 URL 또는 /profile/... 경로"
                  style={inputStyle}
                />
                <input
                  value={adminSortOrder}
                  onChange={(e) => setAdminSortOrder(e.target.value)}
                  placeholder="정렬 순서"
                  style={inputStyle}
                />
                <button
                  type="button"
                  className="primary-button"
                  style={{ marginTop: 0, borderRadius: 12 }}
                  onClick={handleCreateBase}
                  disabled={isPending}
                >
                  기본 프로필 추가
                </button>
              </div>
            ) : null}

            {/* ── 관리자: 공유 커스텀 풀 추가 ── */}
            {isAdmin ? (
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  padding: 16,
                  borderRadius: 16,
                  background: "rgba(255, 248, 240, 0.9)",
                  border: "1px solid rgba(242, 200, 168, 0.4)",
                  marginBottom: 22,
                }}
              >
                <SectionLabel>관리자: 공유 커스텀 풀 추가</SectionLabel>
                <p
                  style={{
                    fontSize: 12,
                    color: "#a89080",
                    margin: 0,
                  }}
                >
                  여기 추가한 프로필은 익명이 자신의 커스텀으로 가져갈 수 있어요
                </p>
                <input
                  value={sharedTitle}
                  onChange={(e) => setSharedTitle(e.target.value)}
                  placeholder="제목(선택)"
                  style={inputStyle}
                />
                <input
                  value={sharedImageUrl}
                  onChange={(e) => setSharedImageUrl(e.target.value)}
                  placeholder="이미지 URL 또는 /profile/... 경로"
                  style={inputStyle}
                />
                <input
                  value={sharedSortOrder}
                  onChange={(e) => setSharedSortOrder(e.target.value)}
                  placeholder="정렬 순서"
                  style={inputStyle}
                />
                <button
                  type="button"
                  className="primary-button"
                  style={{ marginTop: 0, borderRadius: 12 }}
                  onClick={handleCreateSharedCustom}
                  disabled={isPending}
                >
                  공유 커스텀 풀에 추가
                </button>
              </div>
            ) : null}

            {/* ── 관리자: 기본 프로필 수정 ── */}
            {isAdmin && editingBaseId ? (
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  padding: 16,
                  borderRadius: 16,
                  background: "rgba(255, 247, 240, 0.9)",
                  marginBottom: 22,
                }}
              >
                <SectionLabel>관리자: 기본 프로필 수정</SectionLabel>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="제목(선택)"
                  style={inputStyle}
                />
                <input
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="이미지 URL 또는 /profile/... 경로"
                  style={inputStyle}
                />
                <input
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(e.target.value)}
                  placeholder="정렬 순서"
                  style={inputStyle}
                />
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    className="primary-button"
                    style={{ marginTop: 0, borderRadius: 12 }}
                    onClick={handleSaveEditBase}
                    disabled={isPending}
                  >
                    수정 저장
                  </button>
                  <button
                    type="button"
                    className="nav-link"
                    style={{
                      border: "none",
                      borderRadius: 12,
                      padding: "12px 18px",
                      background: "rgba(181, 192, 224, 0.28)",
                    }}
                    onClick={() => setEditingBaseId(null)}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : null}

            {/* ── 하단 버튼 ── */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
              <button
                type="button"
                className="nav-link"
                style={{
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 24px",
                  background: "rgba(181, 192, 224, 0.28)",
                }}
                onClick={() => setIsPickerOpen(false)}
              >
                취소
              </button>

              <button
                type="button"
                className="primary-button"
                style={{
                  marginTop: 0,
                  borderRadius: 12,
                  padding: "12px 24px",
                }}
                onClick={confirmProfile}
                disabled={isPending || !selectedOption}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

// ── 서브 컴포넌트 ────────────────────────────────

function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontSize: 16,
        fontWeight: 800,
        color: "#6d6170",
        marginBottom: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ProfileCard({
  item,
  active,
  onSelect,
  adminControls,
}: {
  item: { id: string; title: string; imageUrl: string; sourceType: string };
  active: boolean;
  onSelect: () => void;
  adminControls?: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: active
          ? "3px solid #f2a8c8"
          : "1px solid rgba(222, 208, 224, 0.9)",
        background: "white",
        borderRadius: 18,
        padding: 8,
      }}
    >
      <button
        type="button"
        onClick={onSelect}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <img
          src={item.imageUrl}
          alt=""
          style={{
            width: "100%",
            aspectRatio: "1 / 1",
            objectFit: "cover",
            borderRadius: 12,
            display: "block",
            marginBottom: 8,
          }}
        />
        <div style={{ fontSize: 13, color: "#776d7b", minHeight: 18 }}>
          {item.title?.trim() || ""}
        </div>
      </button>
      {adminControls}
    </div>
  );
}

// ── 유틸 ─────────────────────────────────────────

function editOrZero(value: string) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function miniButtonStyle(bg: string, color: string): React.CSSProperties {
  return {
    width: "100%",
    border: "none",
    borderRadius: 10,
    padding: "8px 10px",
    background: bg,
    color,
    cursor: "pointer",
  };
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 16,
  marginBottom: 22,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(222, 208, 224, 0.9)",
  padding: "12px 14px",
  font: "inherit",
};