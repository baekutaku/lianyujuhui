"use client";

import { useMemo, useRef, useState } from "react";

type InitialImage = {
  url: string;
};

type MultiR2ImageInputProps = {
  scope: "illustrations";
  initialImages?: InitialImage[];
  initialPrimaryUrl?: string | null;
};

type ImageItem = {
  id: string;
  url: string;
};

const MAX_FILE_SIZE = 30 * 1024 * 1024;

function uniqueUrls(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = String(value || "").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

export default function MultiR2ImageInput({
  scope,
  initialImages = [],
  initialPrimaryUrl,
}: MultiR2ImageInputProps) {
  const initialUrls = useMemo(
    () => uniqueUrls(initialImages.map((item) => item.url)),
    [initialImages]
  );

  const [items, setItems] = useState<ImageItem[]>(() =>
    initialUrls.map((url) => ({ id: crypto.randomUUID(), url }))
  );
  const [primaryUrl, setPrimaryUrl] = useState(() => {
    const preferred = String(initialPrimaryUrl || "").trim();
    if (preferred && initialUrls.includes(preferred)) return preferred;
    return initialUrls[0] || preferred || "";
  });
  const [urlDraft, setUrlDraft] = useState("");
  const [uploadingCount, setUploadingCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const urls = items.map((item) => item.url);

  function appendUrls(newUrls: string[]) {
    setItems((current) => {
      const merged = uniqueUrls([
        ...current.map((item) => item.url),
        ...newUrls,
      ]);

      return merged.map((url) => {
        const existing = current.find((item) => item.url === url);
        return existing ?? { id: crypto.randomUUID(), url };
      });
    });

    setPrimaryUrl((currentPrimary) => {
      if (currentPrimary) return currentPrimary;
      return uniqueUrls(newUrls)[0] || "";
    });
  }

  async function uploadOne(file: File) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`${file.name}: 이미지 파일이 아닙니다.`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`${file.name}: 30MB 이하 이미지만 가능합니다.`);
    }

    const presignResponse = await fetch("/api/admin/r2/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        scope,
      }),
    });

    const presignData = await presignResponse.json();

    if (!presignResponse.ok) {
      throw new Error(
        presignData?.error || `${file.name}: 업로드 준비에 실패했습니다.`
      );
    }

    const uploadResponse = await fetch(presignData.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(
        `${file.name}: Cloudflare R2 업로드 실패 (${uploadResponse.status})`
      );
    }

    return String(presignData.publicUrl || "").trim();
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setError("");
    setUploadingCount(files.length);

    const uploaded: string[] = [];
    const failures: string[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];

      try {
        const url = await uploadOne(file);
        if (url) uploaded.push(url);
      } catch (uploadError) {
        failures.push(
          uploadError instanceof Error
            ? uploadError.message
            : `${file.name}: 업로드 실패`
        );
      } finally {
        setUploadingCount((count) => Math.max(0, count - 1));
      }
    }

    if (uploaded.length > 0) appendUrls(uploaded);
    if (failures.length > 0) setError(failures.join("\n"));
  }

  function addUrl() {
    const value = urlDraft.trim();
    if (!value) return;

    appendUrls([value]);
    setUrlDraft("");
    setError("");
  }

  function removeItem(url: string) {
    setItems((current) => current.filter((item) => item.url !== url));

    if (primaryUrl === url) {
      const remaining = urls.filter((itemUrl) => itemUrl !== url);
      setPrimaryUrl(remaining[0] || "");
    }
  }

  const uploadText =
    uploadingCount > 0
      ? `${uploadingCount}개 이미지 업로드 중…`
      : "여러 이미지를 한 번에 드래그";

  return (
    <div className="multi-r2-images">
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="multi-r2-images-file"
        onChange={(event) => {
          const files = event.target.files;
          if (files?.length) void uploadFiles(files);
          event.currentTarget.value = "";
        }}
      />

      <div
        className={`multi-r2-dropzone${dragging ? " is-dragging" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget === event.target) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files?.length) {
            void uploadFiles(event.dataTransfer.files);
          }
        }}
      >
        <div className="multi-r2-dropzone-copy">
          <span className="material-symbols-rounded">collections</span>
          <div>
            <strong>{uploadText}</strong>
            <small>
              JPG · PNG · WEBP · GIF · AVIF / 파일당 최대 30MB
            </small>
          </div>
        </div>

        <button
          type="button"
          className="multi-r2-pick-button"
          disabled={uploadingCount > 0}
          onClick={() => fileRef.current?.click()}
        >
          파일 여러 개 선택
        </button>
      </div>

      <div className="multi-r2-url-add">
        <span className="material-symbols-rounded">link</span>
        <input
          value={urlDraft}
          placeholder="이미지 주소를 직접 붙여넣기"
          onChange={(event) => setUrlDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addUrl();
            }
          }}
        />
        <button type="button" onClick={addUrl}>
          URL 추가
        </button>
      </div>

      <input
        type="hidden"
        name="imageUrlsJson"
        value={JSON.stringify(items.map((item) => item.url))}
      />
      <input type="hidden" name="primaryImageUrl" value={primaryUrl} />
      <input type="hidden" name="imageUrl" value={primaryUrl} />

      {items.length > 0 ? (
        <>
          <div className="multi-r2-summary">
            <strong>{items.length}개 이미지</strong>
            <span>별표가 공개 목록에 보이는 대표 이미지입니다.</span>
          </div>

          <div className="multi-r2-grid">
            {items.map((item, index) => {
              const isPrimary = primaryUrl === item.url;

              return (
                <article
                  key={item.id}
                  className={`multi-r2-card${
                    isPrimary ? " is-primary" : ""
                  }`}
                >
                  <div className="multi-r2-card-image">
                    <img src={item.url} alt={`일러스트 이미지 ${index + 1}`} />

                    {isPrimary ? (
                      <span className="multi-r2-primary-badge">
                        <span className="material-symbols-rounded">star</span>
                        대표
                      </span>
                    ) : null}
                  </div>

                  <div className="multi-r2-card-actions">
                    <button
                      type="button"
                      className={isPrimary ? "is-selected" : ""}
                      onClick={() => setPrimaryUrl(item.url)}
                    >
                      <span className="material-symbols-rounded">
                        {isPrimary ? "star" : "star_outline"}
                      </span>
                      {isPrimary ? "대표 이미지" : "대표로 설정"}
                    </button>

                    <button
                      type="button"
                      className="is-remove"
                      onClick={() => removeItem(item.url)}
                      aria-label={`${index + 1}번째 이미지 제거`}
                    >
                      <span className="material-symbols-rounded">close</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="multi-r2-empty">
          아직 추가된 이미지가 없습니다.
        </div>
      )}

      {error ? (
        <p className="multi-r2-error">{error}</p>
      ) : null}
    </div>
  );
}
