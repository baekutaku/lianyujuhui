"use client";

import { useEffect, useMemo, useState } from "react";

type TranslationItem = {
  id: string;
  title?: string | null;
  body?: string | null;
  language_code?: string | null;
};

type Props = {
  translations: TranslationItem[];
};

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function normalizeStoryHtml(html = "") {
  return html
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .replace(/<p>\s*<\/p>/gi, "")
    .trim();
}

function normalizeLanguageCode(value?: string | null): "cn" | "kr" | null {
  const code = (value || "").trim().toLowerCase();

  if (!code) return null;

  if (
    code === "zh" ||
    code === "zh-cn" ||
    code === "zh_hans" ||
    code === "cn" ||
    code === "chs"
  ) {
    return "cn";
  }

  if (
    code === "ko" ||
    code === "ko-kr" ||
    code === "kr" ||
    code === "korean"
  ) {
    return "kr";
  }

  return null;
}

function TranslationBody({
  title,
  body,
}: {
  title?: string | null;
  body?: string | null;
}) {
  const content = body || "";

  return (
    <section>
      {title ? <p className="story-translation-title">{title}</p> : null}

      {looksLikeHtml(content) ? (
        <div
          className="translation-body rich-content"
          dangerouslySetInnerHTML={{
            __html: normalizeStoryHtml(content),
          }}
        />
      ) : (
        <div
          className="translation-body rich-content"
          style={{ whiteSpace: "pre-wrap" }}
        >
          {content}
        </div>
      )}
    </section>
  );
}

export default function StoryTranslationSwitcher({ translations }: Props) {
  const grouped = useMemo(() => {
    const result: {
      cn?: TranslationItem;
      kr?: TranslationItem;
    } = {};

    for (const item of translations) {
      const lang = normalizeLanguageCode(item.language_code);
      if (!lang) continue;
      if (!result[lang]) result[lang] = item;
    }

    return result;
  }, [translations]);

  const availableLangs = useMemo(() => {
    const langs: Array<"cn" | "kr"> = [];
    if (grouped.cn) langs.push("cn");
    if (grouped.kr) langs.push("kr");
    return langs;
  }, [grouped]);

  const hasSwitchableLanguages = availableLangs.length > 0;

  const [lang, setLang] = useState<"cn" | "kr">(
    grouped.cn ? "cn" : grouped.kr ? "kr" : "kr"
  );

  useEffect(() => {
    if (!hasSwitchableLanguages) return;

    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("story-preferred-lang")
        : null;

    const fallback = grouped.cn ? "cn" : grouped.kr ? "kr" : "kr";

    if (saved === "cn" && grouped.cn) {
      setLang("cn");
      return;
    }

    if (saved === "kr" && grouped.kr) {
      setLang("kr");
      return;
    }

    setLang(fallback);
  }, [grouped.cn, grouped.kr, hasSwitchableLanguages]);

  useEffect(() => {
    if (!hasSwitchableLanguages) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem("story-preferred-lang", lang);
  }, [lang, hasSwitchableLanguages]);

  if (!hasSwitchableLanguages) {
    return (
      <div className="translation-scroll-panel">
        <div style={{ display: "grid", gap: "20px" }}>
          {translations.map((translation) => (
            <TranslationBody
              key={translation.id}
              title={translation.title}
              body={translation.body}
            />
          ))}
        </div>
      </div>
    );
  }

  const activeTranslation = lang === "cn" ? grouped.cn : grouped.kr;

  if (!activeTranslation) {
    return <div className="empty-box">등록된 번역이 없습니다.</div>;
  }

  return (
    <>
      {availableLangs.length > 1 ? (
        <div className="story-language-switcher" aria-label="번역 언어 선택">
          <button
            type="button"
            className={`story-language-button ${
              lang === "cn" ? "is-active" : ""
            }`}
            onClick={() => setLang("cn")}
          >
            CN
          </button>

          <button
            type="button"
            className={`story-language-button ${
              lang === "kr" ? "is-active" : ""
            }`}
            onClick={() => setLang("kr")}
          >
            KR
          </button>
        </div>
      ) : null}

      <div className="translation-scroll-panel">
        <TranslationBody
          title={activeTranslation.title}
          body={activeTranslation.body}
        />
      </div>
    </>
  );
}