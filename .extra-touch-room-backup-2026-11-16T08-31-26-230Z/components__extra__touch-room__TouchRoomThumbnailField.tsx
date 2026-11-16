"use client";

import {
  useRef,
  useState,
  type DragEvent,
} from "react";

import {
  uploadEditorImage,
} from "@/components/editor/SmartEditorImageUpload";


export default function TouchRoomThumbnailField({
  initialUrl = "",
}: {
  initialUrl?: string;
}) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    url,
    setUrl,
  ] =
    useState(
      initialUrl
    );

  const [
    manualUrl,
    setManualUrl,
  ] =
    useState("");

  const [
    busy,
    setBusy,
  ] =
    useState(false);


  async function uploadFile(
    file: File
  ) {
    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
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
          : "썸네일 업로드 실패"
      );
    } finally {
      setBusy(false);

      if (
        inputRef.current
      ) {
        inputRef.current.value =
          "";
      }
    }
  }


  function onDrop(
    event:
      DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

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
    <div className="touch-room-thumbnail-field">

      <input
        type="hidden"
        name="thumbnailUrl"
        value={url}
      />


      <div
        className={
          "touch-room-thumbnail-dropzone" +
          (busy
            ? " is-busy"
            : "")
        }
        onDragOver={
          (event) =>
            event.preventDefault()
        }
        onDrop={onDrop}
        onClick={() =>
          inputRef.current?.click()
        }
      >

        {url ? (
          <img
            src={url}
            alt=""
          />
        ) : (
          <>
            <span className="material-symbols-rounded">
              add_photo_alternate
            </span>

            <strong>
              썸네일 드래그
            </strong>

            <span>
              또는 클릭해서 이미지 선택
            </span>
          </>
        )}


        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          disabled={busy}
          onChange={
            (event) => {
              const file =
                event.target
                  .files?.[0];

              if (file) {
                void uploadFile(
                  file
                );
              }
            }
          }
        />

      </div>


      <div className="touch-room-thumbnail-url-row">

        <input
          type="url"
          value={manualUrl}
          onChange={
            (event) =>
              setManualUrl(
                event.target.value
              )
          }
          placeholder="또는 썸네일 이미지 URL"
          onKeyDown={
            (event) => {
              if (
                event.key ===
                "Enter"
              ) {
                event.preventDefault();
                applyManualUrl();
              }
            }
          }
        />

        <button
          type="button"
          onClick={
            applyManualUrl
          }
        >
          URL 적용
        </button>

      </div>


      {url ? (
        <button
          type="button"
          className="touch-room-thumbnail-clear"
          onClick={() =>
            setUrl("")
          }
        >
          직접 썸네일 제거 · YouTube 자동 썸네일 사용
        </button>
      ) : (
        <p className="touch-room-thumbnail-note">
          직접 올리지 않으면 YouTube 영상 썸네일을 자동 사용합니다.
        </p>
      )}

    </div>
  );
}
