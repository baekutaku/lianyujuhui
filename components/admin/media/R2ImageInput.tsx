"use client";

import { useRef, useState } from "react";

type R2ImageInputProps = {
  name: string;
  scope: "cards" | "illustrations";
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
};

const MAX_FILE_SIZE = 30 * 1024 * 1024;

export default function R2ImageInput({
  name,
  scope,
  defaultValue,
  placeholder = "https://...",
  required = false,
}: R2ImageInputProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function uploadFile(file: File) {
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 선택할 수 있습니다.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("30MB 이하 이미지로 올려 주세요.");
      return;
    }

    setUploading(true);

    try {
      const presignResponse = await fetch("/api/admin/r2/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          scope,
        }),
      });

      const presignData = await presignResponse.json();

      if (!presignResponse.ok) {
        throw new Error(presignData?.error || "업로드 준비에 실패했습니다.");
      }

      const uploadResponse = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(
          `Cloudflare R2 업로드 실패 (${uploadResponse.status})`
        );
      }

      setValue(presignData.publicUrl);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "이미지 업로드에 실패했습니다."
      );
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  return (
    <div className="r2-image-input">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="r2-image-input-file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadFile(file);
          event.currentTarget.value = "";
        }}
      />

      <div
        className={`r2-image-dropzone${dragging ? " is-dragging" : ""}${
          uploading ? " is-uploading" : ""
        }`}
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
        onDrop={handleDrop}
      >
        <div className="r2-image-dropzone-copy">
          <span className="material-symbols-rounded">cloud_upload</span>
          <div>
            <strong>{uploading ? "Cloudflare R2에 업로드 중…" : "이미지를 여기로 드래그"}</strong>
            <small>또는 파일을 직접 선택할 수 있어요 · 최대 30MB</small>
          </div>
        </div>

        <button
          type="button"
          className="r2-image-pick-button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "업로드 중" : "파일 선택"}
        </button>
      </div>

      <div className="r2-image-url-row">
        <span className="material-symbols-rounded">link</span>
        <input
          name={name}
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
        />
      </div>

      {value ? (
        <div className="r2-image-preview">
          <img src={value} alt="" />
          <div>
            <span>현재 이미지</span>
            <button
              type="button"
              onClick={() => {
                setValue("");
                setError("");
              }}
            >
              비우기
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="r2-image-error">{error}</p> : null}
    </div>
  );
}
