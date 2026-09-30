"use client";

import SmartEditor from "@/components/editor/SmartEditor";

type Props = {
  cnTitle?: string;
  cnBody?: string;
  krTitle?: string;
  krBody?: string;
};

export default function StoryTranslationFields({
  cnTitle = "",
  cnBody = "",
  krTitle = "",
  krBody = "",
}: Props) {
  return (
    <section className="form-field form-field-full">
      <span>본문 / 번역</span>

      <div
        style={{
          display: "grid",
          gap: "20px",
          marginTop: "10px",
        }}
      >
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            padding: "16px",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              marginBottom: "12px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#d9d0db",
            }}
          >
            CN
          </div>

          <label className="form-field form-field-full">
            <span>CN 제목</span>
            <input name="translationTitleCn" defaultValue={cnTitle} />
          </label>

          <SmartEditor
            name="translationBodyCn"
            label="CN 본문"
            initialValue={cnBody}
            height={700}
            autosyncMs={1500}
          />
        </div>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            padding: "16px",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              marginBottom: "12px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#d9d0db",
            }}
          >
            KR
          </div>

          <label className="form-field form-field-full">
            <span>KR 제목</span>
            <input name="translationTitleKr" defaultValue={krTitle} />
          </label>

          <SmartEditor
            name="translationBodyKr"
            label="KR 본문"
            initialValue={krBody}
            height={700}
            autosyncMs={1500}
          />
        </div>
      </div>
    </section>
  );
}