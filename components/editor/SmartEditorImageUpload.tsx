"use client";

import { useRef, useState } from "react";

type Props = {
  disabled?: boolean;
  onUploaded: (urls: string[]) => void;
};

const MAX_FILE_SIZE = 30 * 1024 * 1024;

async function uploadEditorImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name}: 이미지 파일이 아닙니다.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`${file.name}: 30MB 이하 이미지만 가능합니다.`);
  }

  const presignResponse = await fetch("/api/admin/r2/editor-presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    }),
  });

  const data = await presignResponse.json();
  if (!presignResponse.ok) {
    throw new Error(data?.error || `${file.name}: 업로드 준비 실패`);
  }

  const uploadResponse = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(`${file.name}: R2 업로드 실패 (${uploadResponse.status})`);
  }

  return String(data.publicUrl || "").trim();
}

export default function SmartEditorImageUpload({ disabled = false, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (!files.length) {
      setError("이미지 파일을 선택해 주세요.");
      return;
    }

    setError("");
    setUploading(files.length);
    const urls: string[] = [];
    const failures: string[] = [];

    for (const file of files) {
      try {
        const url = await uploadEditorImage(file);
        if (url) urls.push(url);
      } catch (e) {
        failures.push(e instanceof Error ? e.message : `${file.name}: 업로드 실패`);
      } finally {
        setUploading((count) => Math.max(0, count - 1));
      }
    }

    if (urls.length) onUploaded(urls);
    if (failures.length) setError(failures.join("\n"));
  }

  return (
    <div className="smarteditor-image-tools">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="smarteditor-image-file"
        onChange={(event) => {
          const files = event.target.files;
          if (files?.length) void uploadFiles(files);
          event.currentTarget.value = "";
        }}
      />

      <div
        className={`smarteditor-image-drop${dragging ? " is-dragging" : ""}`}
        onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget === event.target) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled && event.dataTransfer.files?.length) void uploadFiles(event.dataTransfer.files);
        }}
      >
        <button
          type="button"
          className="smarteditor-image-button"
          disabled={disabled || uploading > 0}
          onClick={() => inputRef.current?.click()}
        >
          <span className="material-symbols-rounded">add_photo_alternate</span>
          {uploading > 0 ? `${uploading}개 업로드 중…` : "이미지 첨부"}
        </button>
        <span className="smarteditor-image-help">여러 장 선택 가능 · 여기에 이미지 드래그</span>
      </div>

      {error ? <p className="smarteditor-image-error">{error}</p> : null}
    </div>
  );
}
