"use client";

import {
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useRouter } from "next/navigation";
import { uploadEditorImage } from "@/components/editor/SmartEditorImageUpload";
import {
  addHomeHeroImage,
  deleteHomeHeroRecord,
  reorderHomeHeroImages,
  setHomeHeroActive,
} from "@/app/admin/home-hero/actions";

export type HomeHeroItem = {
  id: string;
  image_url: string;
  source_type: "external" | "r2";
  object_key: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

type Props = {
  initialItems: HomeHeroItem[];
};

function objectKeyFromUrl(url: string) {
  try {
    return new URL(url).pathname.replace(/^\/+/, "");
  } catch {
    return "";
  }
}

async function deleteR2Object(objectKey: string) {
  const response = await fetch(
    "/api/admin/r2/editor-presign",
    {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ objectKey }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok) {
    throw new Error(
      data.error || "R2 파일 삭제에 실패했습니다."
    );
  }
}

export default function HomeHeroManager({
  initialItems,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [items, setItems] =
    useState<HomeHeroItem[]>(initialItems);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] =
    useState<string | null>(null);

  async function uploadFiles(files: File[]) {
    const imageFiles = files.filter((file) =>
      file.type.startsWith("image/")
    );

    if (!imageFiles.length) return;

    setBusy(true);

    try {
      for (const file of imageFiles) {
        const uploadedUrl =
          await uploadEditorImage(file);

        const objectKey =
          objectKeyFromUrl(uploadedUrl);

        try {
          const created =
            await addHomeHeroImage({
              imageUrl: uploadedUrl,
              sourceType: "r2",
              objectKey,
            });

          setItems((current) => [
            ...current,
            created as HomeHeroItem,
          ]);
        } catch (error) {
          if (objectKey) {
            try {
              await deleteR2Object(objectKey);
            } catch {
              // DB 등록 실패 시 R2 정리까지 실패해도
              // 원래 오류를 우선 표시한다.
            }
          }

          throw error;
        }
      }

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "업로드 실패"
      );
    } finally {
      setBusy(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function addUrl() {
    const value = url.trim();

    if (!value) return;

    setBusy(true);

    try {
      const created =
        await addHomeHeroImage({
          imageUrl: value,
          sourceType: "external",
        });

      setItems((current) => [
        ...current,
        created as HomeHeroItem,
      ]);

      setUrl("");
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "URL 추가 실패"
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(item: HomeHeroItem) {
    if (
      !window.confirm(
        "이 대문 이미지를 삭제할까요?\n\nR2 업로드 이미지라면 R2 원본 파일도 함께 삭제됩니다."
      )
    ) {
      return;
    }

    setBusy(true);

    try {
      const result =
        await deleteHomeHeroRecord(item.id);

      setItems((current) =>
        current.filter(
          (candidate) =>
            candidate.id !== item.id
        )
      );

      if (result.objectKey) {
        try {
          await deleteR2Object(
            result.objectKey
          );
        } catch (error) {
          alert(
            "DB에서는 삭제됐지만 R2 파일 삭제에 실패했습니다.\n" +
              (error instanceof Error
                ? error.message
                : "")
          );
        }
      }

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "삭제 실패"
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleItem(
    item: HomeHeroItem
  ) {
    const next = !item.is_active;

    setItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id
          ? {
              ...candidate,
              is_active: next,
            }
          : candidate
      )
    );

    try {
      await setHomeHeroActive(
        item.id,
        next
      );

      router.refresh();
    } catch (error) {
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                is_active:
                  item.is_active,
              }
            : candidate
        )
      );

      alert(
        error instanceof Error
          ? error.message
          : "상태 변경 실패"
      );
    }
  }

  async function dropOn(
    targetId: string
  ) {
    if (
      !dragId ||
      dragId === targetId
    ) {
      setDragId(null);
      return;
    }

    const next = [...items];

    const from = next.findIndex(
      (item) => item.id === dragId
    );
    const to = next.findIndex(
      (item) => item.id === targetId
    );

    if (from < 0 || to < 0) {
      setDragId(null);
      return;
    }

    const [moving] =
      next.splice(from, 1);

    next.splice(to, 0, moving);

    const reordered = next.map(
      (item, index) => ({
        ...item,
        sort_order: index,
      })
    );

    setItems(reordered);
    setDragId(null);

    try {
      await reorderHomeHeroImages(
        reordered.map((item) => item.id)
      );

      router.refresh();
    } catch (error) {
      setItems(items);

      alert(
        error instanceof Error
          ? error.message
          : "순서 저장 실패"
      );
    }
  }

  function onDropFiles(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    const files =
      Array.from(
        event.dataTransfer.files || []
      );

    void uploadFiles(files);
  }

  return (
    <div className="home-hero-admin">
      <section
        className="home-hero-dropzone"
        onDragOver={(event) =>
          event.preventDefault()
        }
        onDrop={onDropFiles}
        onClick={() =>
          inputRef.current?.click()
        }
      >
        <span className="material-symbols-rounded">
          add_photo_alternate
        </span>

        <strong>
          이미지를 여기에 드래그
        </strong>

        <span>
          또는 클릭해서 파일 선택
        </span>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          disabled={busy}
          onChange={(event) =>
            void uploadFiles(
              Array.from(
                event.target.files || []
              )
            )
          }
        />
      </section>

      <section className="home-hero-url-row">
        <input
          type="url"
          value={url}
          disabled={busy}
          placeholder="https://... 이미지 URL"
          onChange={(event) =>
            setUrl(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void addUrl();
            }
          }}
        />

        <button
          type="button"
          className="primary-button"
          disabled={busy || !url.trim()}
          onClick={() => void addUrl()}
        >
          URL 추가
        </button>
      </section>

      <div className="home-hero-admin-note">
        카드를 드래그하면 표시 순서를 바꿀 수 있습니다.
        활성 이미지 중 하나가 홈 대문에 랜덤으로 표시됩니다.
      </div>

      <div className="home-hero-admin-grid">
        {items.map((item) => (
          <article
            key={item.id}
            className={
              "home-hero-admin-card" +
              (item.is_active
                ? ""
                : " is-disabled") +
              (dragId === item.id
                ? " is-dragging"
                : "")
            }
            draggable={!busy}
            onDragStart={() =>
              setDragId(item.id)
            }
            onDragEnd={() =>
              setDragId(null)
            }
            onDragOver={(event) =>
              event.preventDefault()
            }
            onDrop={() =>
              void dropOn(item.id)
            }
          >
            <div className="home-hero-drag-handle">
              <span className="material-symbols-rounded">
                drag_indicator
              </span>
              드래그
            </div>

            <div className="home-hero-admin-preview">
              <img
                src={item.image_url}
                alt=""
              />

              {!item.is_active ? (
                <span className="home-hero-hidden-badge">
                  숨김
                </span>
              ) : null}
            </div>

            <div className="home-hero-admin-meta">
              <span>
                {item.source_type ===
                "r2"
                  ? "R2 업로드"
                  : "외부 URL"}
              </span>

              <span>
                순서 {item.sort_order + 1}
              </span>
            </div>

            <div className="home-hero-admin-url">
              {item.image_url}
            </div>

            <div className="home-hero-admin-actions">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void toggleItem(item)
                }
              >
                {item.is_active
                  ? "숨기기"
                  : "사용하기"}
              </button>

              <button
                type="button"
                className="is-danger"
                disabled={busy}
                onClick={() =>
                  void removeItem(item)
                }
              >
                삭제
              </button>
            </div>
          </article>
        ))}
      </div>

      {!items.length ? (
        <div className="empty-box">
          등록된 대문 이미지가 없습니다.
        </div>
      ) : null}
    </div>
  );
}
