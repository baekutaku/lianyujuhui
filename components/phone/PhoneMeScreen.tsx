"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ProfileOption = {
  id: string;
  title: string;
  imageUrl: string;
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
  profileOptions: ProfileOption[];
  characters: CharacterCard[];
};

const STORAGE_KEY = "mlqc_phone_me_avatar";
const STORAGE_URL_KEY = "mlqc_phone_me_avatar_url";

export default function PhoneMeScreen({
  viewerName,
  defaultAvatarUrl,
  profileOptions,
  characters,
}: Props) {
  const [currentAvatar, setCurrentAvatar] = useState(defaultAvatarUrl);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

useEffect(() => {
  const savedId = window.localStorage.getItem(STORAGE_KEY);
  const savedUrl = window.localStorage.getItem(STORAGE_URL_KEY);

  if (savedId) {
    const matched = profileOptions.find((item) => item.id === savedId);
    if (matched) {
      setSelectedId(matched.id);
      setCurrentAvatar(matched.imageUrl);
      return;
    }
  }

  if (savedUrl) {
    setCurrentAvatar(savedUrl);
    return;
  }

  const first = profileOptions[0];
  if (first) {
    setSelectedId(first.id);
    setCurrentAvatar(first.imageUrl);
  } else {
    setCurrentAvatar(defaultAvatarUrl);
  }
}, [defaultAvatarUrl, profileOptions]);

  const selectedPreview = useMemo(() => {
    return profileOptions.find((item) => item.id === selectedId) ?? null;
  }, [profileOptions, selectedId]);

function confirmProfile() {
  if (!selectedPreview) return;

  setCurrentAvatar(selectedPreview.imageUrl);
  window.localStorage.setItem(STORAGE_KEY, selectedPreview.id);
  window.localStorage.setItem(STORAGE_URL_KEY, selectedPreview.imageUrl);
  setIsPickerOpen(false);
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
            {characters.map((character) => (
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
              maxWidth: 640,
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
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 16,
                maxHeight: 420,
                overflowY: "auto",
                paddingRight: 6,
                marginBottom: 24,
              }}
            >
              {profileOptions.map((item) => {
                const active = item.id === selectedId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      border: active
                        ? "3px solid #f2a8c8"
                        : "1px solid rgba(222, 208, 224, 0.9)",
                      background: "white",
                      borderRadius: 18,
                      padding: 8,
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title || "profile option"}
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
                      {item.title}
                    </div>
                  </button>
                );
              })}
            </div>

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