"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createBasePhoneProfileOption,
  updateBasePhoneProfileOption,
  deactivateBasePhoneProfileOption,
  createCustomPhoneProfile,
  deactivateCustomPhoneProfile,
  selectPhoneProfile,
} from "@/app/phone-items/me/actions";

type ProfileOption = {
  id: string;
  title: string;
  imageUrl: string;
  sourceType: "option" | "custom";
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
  characters?: CharacterCard[];
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
  characters,
  initialSelectedSourceType,
  initialSelectedSourceId,
  isAdmin = false,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const safeBaseProfileOptions = baseProfileOptions ?? [];
  const safeCustomProfileOptions = customProfileOptions ?? [];
  const safeCharacters = characters ?? [];

  const [currentAvatar, setCurrentAvatar] = useState(defaultAvatarUrl);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const [customTitle, setCustomTitle] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");

  const [adminTitle, setAdminTitle] = useState("");
  const [adminImageUrl, setAdminImageUrl] = useState("");
  const [adminSortOrder, setAdminSortOrder] = useState("0");

  const [editingBaseId, setEditingBaseId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("0");

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

    return hasDefault ? safeBaseProfileOptions : [defaultOption, ...safeBaseProfileOptions];
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
      allOptions.find((item) => `${item.sourceType}:${item.id}` === selectedKey) ??
      null
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

  return (
    <>
      <div
        style={{
          width: "100%",
          background: "transparent",
        }}
      >
        <div
          style={{
            padding: "26px 22px 18px",
            background:
              "linear-gradient(135deg, rgba(234,214,255,0.92) 0%, rgba(255,214,229,0.92) 100%)",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#7d6c88",
              textAlign: "right",
              marginBottom: 16,
              letterSpacing: "0.04em",
            }}
          >
            개인 정보
          </div>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "84px 1fr",
              gap: 16,
              alignItems: "center",
              background: "rgba(255,255,255,0.45)",
              borderRadius: 22,
              padding: 14,
              backdropFilter: "blur(4px)",
            }}
          >
            <img
              src={currentAvatar}
              alt={viewerName}
              style={{
                width: 76,
                height: 76,
                borderRadius: 16,
                objectFit: "cover",
                display: "block",
                boxShadow: "0 6px 18px rgba(179, 150, 168, 0.18)",
              }}
            />

            <div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#5e5464",
                  marginBottom: 10,
                }}
              >
                {viewerName}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="primary-button"
                  style={{
                    marginTop: 0,
                    borderRadius: 999,
                    paddingInline: 18,
                  }}
                  onClick={() => setIsPickerOpen(true)}
                >
                  프로필 변경
                </button>

                <button
                  type="button"
                  className="nav-link"
                  style={{
                    border: "none",
                    background: "rgba(183, 191, 255, 0.18)",
                    borderRadius: 999,
                    cursor: "default",
                    paddingInline: 18,
                  }}
                >
                  꾸미기
                </button>
              </div>
            </div>
          </section>
        </div>

        <div style={{ padding: "18px 18px 26px" }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#e1a0c1",
              marginBottom: 14,
            }}
          >
            남주 탭
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: 10,
              marginBottom: 18,
            }}
          >
            {safeCharacters.map((character) => (
              <Link
                key={character.key}
                href={`/phone-items/me/${character.key}`}
                style={{
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                  background: "rgba(255,255,255,0.88)",
                  border: "1px solid rgba(234, 218, 228, 0.95)",
                  borderRadius: 24,
                  padding: "10px 8px",
                  textAlign: "center",
                  boxShadow: "0 6px 16px rgba(216, 201, 214, 0.15)",
                }}
              >
                <img
                  src={character.avatarUrl}
                  alt={character.label}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    objectFit: "cover",
                    display: "block",
                    margin: "0 auto 8px",
                  }}
                />

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#625967",
                    marginBottom: 8,
                    lineHeight: 1.2,
                  }}
                >
                  {character.label}
                </div>

                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#f0a8c7",
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {character.affinity}
                </div>

                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: "rgba(233, 214, 224, 0.7)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(character.affinity, 100)}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #f3a5c7, #f8bfd5)",
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
          <div style={{ display: "grid", gap: 12 }}>
  <div
    className="link-card"
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "18px 20px",
      fontSize: 20,
      fontWeight: 700,
      borderRadius: 22,
    }}
  >
    <span>내 모멘트</span>
    <span />
  </div>

  <div
    className="link-card"
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "18px 20px",
      fontSize: 20,
      fontWeight: 700,
      borderRadius: 22,
      opacity: 0.72,
    }}
  >
    <span>앨범</span>
    <span />
  </div>

  <div
    className="link-card"
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "18px 20px",
      fontSize: 20,
      fontWeight: 700,
      borderRadius: 22,
      opacity: 0.72,
    }}
  >
    <span>휴대폰 테마</span>
    <span />
  </div>

  <div
    className="link-card"
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "18px 20px",
      fontSize: 20,
      fontWeight: 700,
      borderRadius: 22,
      opacity: 0.72,
    }}
  >
    <span>채팅 버블</span>
    <span />
  </div>
</div>
        </div>
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

            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#6d6170",
                marginBottom: 12,
              }}
            >
              기본 프로필
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 16,
                marginBottom: 22,
              }}
            >
              {mergedBaseProfileOptions.map((item) => {
                const key = `${item.sourceType}:${item.id}`;
                const active = key === selectedKey;

                return (
                  <div
                    key={key}
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
                      onClick={() => setSelectedKey(key)}
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
                      <div
                        style={{
                          fontSize: 13,
                          color: "#776d7b",
                          minHeight: 18,
                        }}
                      >
                        {item.title?.trim() || ""}
                      </div>
                    </button>

                    {isAdmin && item.id !== "__default__" ? (
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
                    ) : null}
                  </div>
                );
              })}
            </div>

            {safeCustomProfileOptions.length > 0 ? (
              <>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#6d6170",
                    marginBottom: 12,
                  }}
                >
                  내 커스텀 프로필
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: 16,
                    marginBottom: 22,
                  }}
                >
                  {safeCustomProfileOptions.map((item) => {
                    const key = `${item.sourceType}:${item.id}`;
                    const active = key === selectedKey;

                    return (
                      <div
                        key={key}
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
                          onClick={() => setSelectedKey(key)}
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
                          <div
                            style={{
                              fontSize: 13,
                              color: "#776d7b",
                              minHeight: 18,
                            }}
                          >
                            {item.title?.trim() || ""}
                          </div>
                        </button>

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
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}

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
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#6d6170",
                }}
              >
                내 커스텀 프로필 추가
              </div>

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
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#6d6170",
                  }}
                >
                  관리자: 기본 프로필 추가
                </div>

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
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#6d6170",
                  }}
                >
                  관리자: 기본 프로필 수정
                </div>

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

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(222, 208, 224, 0.9)",
  padding: "12px 14px",
  font: "inherit",
};