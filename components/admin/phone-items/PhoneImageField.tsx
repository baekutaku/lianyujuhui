"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { uploadEditorImage } from "@/components/editor/SmartEditorImageUpload";

type PhoneImageFieldProps = {
  label?: string;
  name?: string;
  initialUrls?: string[];
  multiple?: boolean;
  help?: string;
  onUrlsChange?: (urls: string[]) => void;
};

function normalizeUrls(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );
}

export default function PhoneImageField({
  label = "이미지",
  name,
  initialUrls = [],
  multiple = false,
  help,
  onUrlsChange,
}: PhoneImageFieldProps) {
  const initialKey = useMemo(
    () => normalizeUrls(initialUrls).join("\n"),
    [initialUrls]
  );

  const [urls, setUrls] = useState<string[]>(
    normalizeUrls(initialUrls)
  );

  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrls(
      initialKey
        ? initialKey.split("\n").filter(Boolean)
        : []
    );
  }, [initialKey]);

  function commit(nextValues: string[]) {
    const normalized = normalizeUrls(nextValues);

    const next = multiple
      ? normalized
      : normalized.slice(-1);

    setUrls(next);
    onUrlsChange?.(next);
  }

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter(
      (file) => file.type.startsWith("image/")
    );

    if (!files.length) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const uploaded: string[] = [];

      for (const file of files) {
        const url = await uploadEditorImage(file);

        if (url) {
          uploaded.push(url);
        }
      }

      if (!uploaded.length) {
        throw new Error(
          "업로드된 이미지 URL이 없습니다."
        );
      }

      if (multiple) {
        commit([...urls, ...uploaded]);
      } else {
        commit([uploaded[uploaded.length - 1]]);
      }
    } catch (uploadError) {
      console.error(
        "[PhoneImageField] upload failed",
        uploadError
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "이미지 업로드에 실패했습니다."
      );
    } finally {
      setUploading(false);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  function addUrl() {
    const nextUrl = urlInput.trim();

    if (!nextUrl) return;

    if (multiple) {
      commit([...urls, nextUrl]);
    } else {
      commit([nextUrl]);
    }

    setUrlInput("");
  }

  function removeAt(index: number) {
    commit(
      urls.filter((_, currentIndex) => {
        return currentIndex !== index;
      })
    );
  }

  return (
    <div className="phone-image-field">
      {label ? (
        <div className="phone-image-field-title">
          {label}
        </div>
      ) : null}

      {help ? (
        <p className="phone-image-field-help">
          {help}
        </p>
      ) : null}

      {name ? (
        multiple ? (
          <textarea
            name={name}
            value={urls.join("\n")}
            readOnly
            hidden
          />
        ) : (
          <input
            type="hidden"
            name={name}
            value={urls[0] ?? ""}
          />
        )
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="phone-image-file-input"
        onChange={(event) => {
          const files = event.target.files;

          if (files?.length) {
            void addFiles(files);
          }
        }}
      />

      <div
        className={
          "phone-image-dropzone" +
          (dragging ? " is-dragging" : "") +
          (uploading ? " is-uploading" : "")
        }
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
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);

          if (event.dataTransfer.files.length) {
            void addFiles(event.dataTransfer.files);
          }
        }}
      >
        <div className="phone-image-drop-copy">
          <span className="material-symbols-rounded">
            add_photo_alternate
          </span>

          <div>
            <strong>
              {multiple
                ? "이미지를 여기로 드래그"
                : "이미지를 여기로 드래그"}
            </strong>
            <small>
              파일 선택 또는 URL 직접 입력 가능
            </small>
          </div>
        </div>

        <button
          type="button"
          className="phone-image-pick-button"
          disabled={uploading}
          onClick={() => {
            fileRef.current?.click();
          }}
        >
          {uploading
            ? "업로드 중..."
            : multiple
              ? "이미지 추가"
              : urls.length
                ? "이미지 교체"
                : "파일 선택"}
        </button>
      </div>

      <div className="phone-image-url-row">
        <span className="material-symbols-rounded">
          link
        </span>

        <input
          type="url"
          value={urlInput}
          placeholder="https://... 또는 /images/..."
          onChange={(event) => {
            setUrlInput(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addUrl();
            }
          }}
        />

        <button
          type="button"
          onClick={addUrl}
        >
          URL 추가
        </button>
      </div>

      {urls.length ? (
        <div className="phone-image-preview-grid">
          {urls.map((url, index) => (
            <div
              key={url + "-" + index}
              className="phone-image-preview-card"
            >
              <div className="phone-image-preview-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                />
              </div>

              <div className="phone-image-preview-bottom">
                <span title={url}>
                  {index + 1}번 이미지
                </span>

                <button
                  type="button"
                  onClick={() => removeAt(index)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="phone-image-empty">
          등록된 이미지 없음
        </div>
      )}

      {error ? (
        <p className="phone-image-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
