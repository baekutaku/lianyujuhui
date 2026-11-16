"use client";

import {
  useState,
} from "react";

import SmartEditorImageUpload
  from "@/components/editor/SmartEditorImageUpload";

export default function PvImageFields({
  initialUrls = [],
}: {
  initialUrls?: string[];
}) {
  const [
    urls,
    setUrls,
  ] = useState(
    initialUrls
  );

  const [
    manual,
    setManual,
  ] = useState("");

  function addManual() {
    const next =
      manual.trim();

    if (!next) return;

    setUrls((prev) =>
      prev.includes(next)
        ? prev
        : [
            ...prev,
            next,
          ]
    );

    setManual("");
  }

  return (
    <div className="extra-pv-image-field">

      <input
        type="hidden"
        name="imageUrls"
        value={urls.join("\n")}
      />

      <SmartEditorImageUpload
        onUploaded={(next) =>
          setUrls(
            (prev) => [
              ...prev,
              ...next.filter(
                (url) =>
                  !prev.includes(url)
              ),
            ]
          )
        }
      />

      <div className="extra-pv-url-add">

        <input
          value={manual}
          onChange={(event) =>
            setManual(
              event.target.value
            )
          }
          placeholder="또는 이미지 URL 붙여넣기"
        />

        <button
          type="button"
          onClick={addManual}
        >
          추가
        </button>

      </div>

      {urls.length ? (
        <div className="extra-pv-image-preview-grid">

          {urls.map(
            (url, index) => (
              <div
                key={
                  `${url}-${index}`
                }
                className="extra-pv-image-preview"
              >

                <img
                  src={url}
                  alt=""
                />

                <button
                  type="button"
                  onClick={() =>
                    setUrls(
                      (prev) =>
                        prev.filter(
                          (
                            _,
                            itemIndex
                          ) =>
                            itemIndex !==
                            index
                        )
                    )
                  }
                >
                  삭제
                </button>

              </div>
            )
          )}

        </div>
      ) : null}

    </div>
  );
}
