"use client";

import { useMemo, useRef, useState } from "react";
import { uploadImageBundle } from "@/lib/media/client-r2-image-bundle";

type InitialImage = {
  url: string;
};

type CardImageRoles = {
  detailBefore?: string | null;
  detailAfter?: string | null;
  listDefault?: string | null;
  listHover?: string | null;
};

type CardMultiImageInputProps = {
  initialImages?: InitialImage[];
  initialRoles?: CardImageRoles;
};

const MAX_FILE_SIZE = 30 * 1024 * 1024;

function uniqueUrls(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const url = String(value || "").trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push(url);
  }

  return result;
}

export default function CardMultiImageInput({
  initialImages = [],
  initialRoles = {},
}: CardMultiImageInputProps) {
  const initialUrls = useMemo(
    () =>
      uniqueUrls([
        ...initialImages.map((item) => item.url),
        initialRoles.detailBefore || "",
        initialRoles.detailAfter || "",
        initialRoles.listDefault || "",
        initialRoles.listHover || "",
      ]),
    [initialImages, initialRoles]
  );

  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [detailBefore, setDetailBefore] = useState(
    String(initialRoles.detailBefore || initialUrls[0] || "")
  );
  const [detailAfter, setDetailAfter] = useState(
    String(initialRoles.detailAfter || "")
  );
  const [listDefault, setListDefault] = useState(
    String(initialRoles.listDefault || initialUrls[0] || "")
  );
  const [listHover, setListHover] = useState(
    String(initialRoles.listHover || "")
  );

  const [urlDraft, setUrlDraft] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  function fillMissingRoles(nextUrls: string[]) {
    const first = nextUrls[0] || "";
    const second = nextUrls[1] || "";

    setDetailBefore((value) => value || first);
    setListDefault((value) => value || first);
    setDetailAfter((value) => value || second);
    setListHover((value) => value || second);
  }

  function appendUrls(newUrls: string[]) {
    setUrls((current) => {
      const merged = uniqueUrls([...current, ...newUrls]);
      queueMicrotask(() => fillMissingRoles(merged));
      return merged;
    });
  }

  async function uploadOne(file: File) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`${file.name}: 이미지 파일이 아닙니다.`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`${file.name}: 30MB 이하 이미지만 가능합니다.`);
    }

    const result = await uploadImageBundle({
      file,
      scope: "cards",
      presignEndpoint: "/api/admin/r2/presign",
    });

    return result.storedUrl;
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length) return;

    setError("");
    setUploadingCount(files.length);

    const uploaded: string[] = [];
    const failures: string[] = [];

    for (const file of files) {
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

    if (uploaded.length) appendUrls(uploaded);
    if (failures.length) setError(failures.join("\n"));
  }

  function addUrl() {
    const value = urlDraft.trim();
    if (!value) return;
    appendUrls([value]);
    setUrlDraft("");
    setError("");
  }

  function removeUrl(url: string) {
    setUrls((current) => {
      const next = current.filter((item) => item !== url);

      if (detailBefore === url) setDetailBefore(next[0] || "");
      if (listDefault === url) setListDefault(next[0] || "");

      if (detailAfter === url) {
        const fallback = next.find((item) => item !== (next[0] || "")) || "";
        setDetailAfter(fallback);
      }

      if (listHover === url) {
        const fallback = next.find((item) => item !== (next[0] || "")) || "";
        setListHover(fallback);
      }

      return next;
    });
  }

  function roleClass(active: boolean) {
    return `card-image-role-button${active ? " is-active" : ""}`;
  }

  return (
    <div className="card-multi-images">
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="card-multi-images-file"
        onChange={(event) => {
          const files = event.target.files;
          if (files?.length) void uploadFiles(files);
          event.currentTarget.value = "";
        }}
      />

      <div
        className={`card-multi-dropzone${dragging ? " is-dragging" : ""}`}
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
        <div className="card-multi-dropzone-copy">
          <span className="material-symbols-rounded">collections</span>
          <div>
            <strong>
              {uploadingCount > 0
                ? `${uploadingCount}개 이미지 업로드 중…`
                : "카드 이미지를 여러 장 드래그"}
            </strong>
            <small>
              상세 진화 전/후 · 목록 기본/hover 이미지를 아래에서 지정
            </small>
          </div>
        </div>

        <button
          type="button"
          className="card-multi-pick-button"
          disabled={uploadingCount > 0}
          onClick={() => fileRef.current?.click()}
        >
          파일 여러 개 선택
        </button>
      </div>

      <div className="card-multi-url-add">
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

      <input type="hidden" name="cardImageUrlsJson" value={JSON.stringify(urls)} />
      <input type="hidden" name="detailBeforeUrl" value={detailBefore} />
      <input type="hidden" name="detailAfterUrl" value={detailAfter} />
      <input type="hidden" name="listDefaultUrl" value={listDefault} />
      <input type="hidden" name="listHoverUrl" value={listHover} />

      {/* 기존 createCard/updateCard와 완전 호환 */}
      <input type="hidden" name="coverImageUrl" value={detailBefore} />
      <input type="hidden" name="coverAfterUrl" value={detailAfter} />
      <input type="hidden" name="thumbnailUrl" value={listDefault} />
      <input type="hidden" name="thumbnailAfterUrl" value={listHover} />

      {urls.length ? (
        <>
          <div className="card-multi-help">
            <strong>{urls.length}개 이미지</strong>
            <span>
              한 이미지에 여러 역할을 동시에 지정해도 됩니다.
            </span>
          </div>

          <div className="card-multi-grid">
            {urls.map((url, index) => {
              const roleCount = [
                detailBefore === url,
                detailAfter === url,
                listDefault === url,
                listHover === url,
              ].filter(Boolean).length;

              return (
                <article
                  key={url}
                  className={`card-multi-item${
                    roleCount ? " has-role" : ""
                  }`}
                >
                  <div className="card-multi-item-image">
                    <img src={url} alt={`카드 이미지 ${index + 1}`} />
                    {roleCount ? (
                      <span className="card-multi-role-count">
                        {roleCount}
                      </span>
                    ) : null}
                  </div>

                  <div className="card-multi-role-grid">
                    <button
                      type="button"
                      className={roleClass(detailBefore === url)}
                      onClick={() =>
                        setDetailBefore(detailBefore === url ? "" : url)
                      }
                    >
                      상세 전
                    </button>

                    <button
                      type="button"
                      className={roleClass(detailAfter === url)}
                      onClick={() =>
                        setDetailAfter(detailAfter === url ? "" : url)
                      }
                    >
                      상세 후
                    </button>

                    <button
                      type="button"
                      className={roleClass(listDefault === url)}
                      onClick={() =>
                        setListDefault(listDefault === url ? "" : url)
                      }
                    >
                      목록 기본
                    </button>

                    <button
                      type="button"
                      className={roleClass(listHover === url)}
                      onClick={() =>
                        setListHover(listHover === url ? "" : url)
                      }
                    >
                      목록 Hover
                    </button>
                  </div>

                  <button
                    type="button"
                    className="card-multi-remove"
                    onClick={() => removeUrl(url)}
                  >
                    <span className="material-symbols-rounded">close</span>
                    제거
                  </button>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card-multi-empty">
          아직 추가된 카드 이미지가 없습니다.
        </div>
      )}

      {error ? <p className="card-multi-error">{error}</p> : null}
    </div>
  );
}
