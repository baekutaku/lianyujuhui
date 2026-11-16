"use client";

import {
  useRef,
  useState,
  type DragEvent,
} from "react";

import {
  uploadEditorImage,
} from "@/components/editor/SmartEditorImageUpload";


export default function HundredDaysImageField({
  name,
  label,
  initialUrl = "",
  hint,
}: {
  name: string;
  label: string;
  initialUrl?: string;
  hint?: string;
}) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [url, setUrl] =
    useState(initialUrl);

  const [manualUrl, setManualUrl] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [dragging, setDragging] =
    useState(false);


  async function uploadFile(
    file: File
  ) {
    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "이미지 파일만 업로드할 수 있습니다."
      );
      return;
    }

    setBusy(true);

    try {
      const uploaded =
        await uploadEditorImage(
          file
        );

      setUrl(uploaded);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "이미지 업로드 실패"
      );
    } finally {
      setBusy(false);

      if (inputRef.current) {
        inputRef.current.value =
          "";
      }
    }
  }


  function handleDrop(
    event:
      DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setDragging(false);

    const file =
      event.dataTransfer
        .files?.[0];

    if (file) {
      void uploadFile(file);
    }
  }


  function applyManualUrl() {
    const value =
      manualUrl.trim();

    if (!value) {
      return;
    }

    setUrl(value);
    setManualUrl("");
  }


  return (
    <div className="hundred-days-image-field">

      <input
        type="hidden"
        name={name}
        value={url}
      />


      <div className="hundred-days-image-field-head">

        <div>
          <strong>
            {label}
          </strong>

          {hint ? (
            <span>
              {hint}
            </span>
          ) : null}
        </div>


        {url ? (
          <button
            type="button"
            className="hundred-days-image-clear"
            onClick={() =>
              setUrl("")
            }
          >
            삭제
          </button>
        ) : null}

      </div>


      <div
        className={
          "hundred-days-image-drop" +
          (dragging
            ? " is-dragging"
            : "") +
          (url
            ? " has-image"
            : "")
        }
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() =>
          setDragging(false)
        }
        onDrop={handleDrop}
      >

        {url ? (
          <div className="hundred-days-image-preview">

            <img
              src={url}
              alt=""
            />

            <div className="hundred-days-image-preview-overlay">

              <button
                type="button"
                onClick={() =>
                  inputRef.current?.click()
                }
              >
                <span className="material-symbols-rounded">
                  upload
                </span>

                이미지 교체
              </button>

            </div>

          </div>
        ) : (
          <button
            type="button"
            className="hundred-days-drop-button"
            disabled={busy}
            onClick={() =>
              inputRef.current?.click()
            }
          >
            <span className="material-symbols-rounded">
              add_photo_alternate
            </span>

            <strong>
              {busy
                ? "업로드 중..."
                : "이미지를 여기에 드래그"}
            </strong>

            <small>
              또는 클릭해서 파일 선택
            </small>
          </button>
        )}


        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file =
              event.target
                .files?.[0];

            if (file) {
              void uploadFile(file);
            }
          }}
        />

      </div>


      <div className="hundred-days-image-url-row">

        <input
          type="url"
          value={manualUrl}
          onChange={(event) =>
            setManualUrl(
              event.target.value
            )
          }
          placeholder="또는 이미지 URL 입력"
        />

        <button
          type="button"
          onClick={
            applyManualUrl
          }
        >
          적용
        </button>

      </div>

    </div>
  );
}
