"use client";

import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    nhn?: any;
    __smartEditorScriptPromise?: Promise<void>;
  }
}

type SmartEditorProps = {
  name: string;
  initialValue?: string;
  label?: string;
  height?: number | string;
  autosyncMs?: number;
};

type PreviewMode = "wide" | "pc" | "mobile";

function normalizeHeight(height: number | string) {
  return typeof height === "number" ? `${height}px` : height;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadSmartEditorScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window is undefined"));
  }

  if (window.nhn?.husky?.EZCreator) {
    return Promise.resolve();
  }

  if (window.__smartEditorScriptPromise) {
    return window.__smartEditorScriptPromise;
  }

  window.__smartEditorScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-smarteditor="husky"]'
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("SmartEditor 스크립트 로드 실패")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "/smarteditor2/js/service/HuskyEZCreator.js";
    script.async = true;
    script.dataset.smarteditor = "husky";

    script.onload = () => resolve();
    script.onerror = () => reject(new Error("SmartEditor 스크립트 로드 실패"));

    document.body.appendChild(script);
  });

  return window.__smartEditorScriptPromise;
}

function getIframeDocument(iframe: HTMLIFrameElement | null | undefined) {
  if (!iframe) return null;
  return iframe.contentDocument || iframe.contentWindow?.document || null;
}

async function getSmartEditorDocuments(wrapper: HTMLDivElement | null) {
  if (!wrapper) {
    return {
      skinDoc: null as Document | null,
      editingDoc: null as Document | null,
    };
  }

  for (let i = 0; i < 50; i += 1) {
    const outerIframe = wrapper.querySelector<HTMLIFrameElement>("iframe");
    const skinDoc = getIframeDocument(outerIframe);

    let editingDoc: Document | null = null;

    if (skinDoc) {
      const innerIframe =
        skinDoc.querySelector<HTMLIFrameElement>("#se2_iframe") ||
        skinDoc.querySelector<HTMLIFrameElement>("iframe");

      editingDoc = getIframeDocument(innerIframe);
    }

    if (skinDoc && editingDoc?.body) {
      return { skinDoc, editingDoc };
    }

    await wait(100);
  }

  return {
    skinDoc: null as Document | null,
    editingDoc: null as Document | null,
  };
}

function injectFontStyle(doc: Document) {
  let style = doc.getElementById(
    "smarteditor-custom-font-style"
  ) as HTMLStyleElement | null;

  if (!style) {
    style = doc.createElement("style");
    style.id = "smarteditor-custom-font-style";
    doc.head.appendChild(style);
  }

  style.textContent = `
    @font-face {
      font-family: 'KoPubWorldBatang';
      src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/2410-1@1.0/KoPubWorldBatangLight.woff2') format('woff2');
      font-weight: 300 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'GowunBatang';
      src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/2104@1.0/GowunBatang-Regular.woff') format('woff');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    html,
    /* SMARTEDITOR_MOBILE_KOPUB_HARD_FIX_20261011 */
    html,
    body,
    body *,
    .se2_inputarea,
    .se2_inputarea *,
    .husky_seditor_editing_area_container,
    .husky_seditor_editing_area_container * {
      font-family: 'KoPubWorldBatang', 'GowunBatang', serif !important;
    }

    body {
      font-weight: 300;
    }
  `;
}

function applyPreviewMode(doc: Document, mode: PreviewMode) {
  if (!doc.body) return;

  const body = doc.body;
  body.dataset.storyPreviewMode = mode;
  body.style.boxSizing = "border-box";

  if (mode === "mobile") {
    body.style.width = "min(360px, calc(100% - 24px))";
    body.style.maxWidth = "360px";
    body.style.marginLeft = "auto";
    body.style.marginRight = "auto";
    body.style.paddingLeft = "0";
    body.style.paddingRight = "0";
    return;
  }

  if (mode === "pc") {
    body.style.width = "min(720px, calc(100% - 32px))";
    body.style.maxWidth = "720px";
    body.style.marginLeft = "auto";
    body.style.marginRight = "auto";
    body.style.paddingLeft = "0";
    body.style.paddingRight = "0";
    return;
  }

  body.style.width = "calc(100% - 20px)";
  body.style.maxWidth = "none";
  body.style.marginLeft = "10px";
  body.style.marginRight = "10px";
  body.style.paddingLeft = "0";
  body.style.paddingRight = "0";
}

async function loadEditorFonts(doc: Document) {
  if (!("fonts" in doc)) return;

  try {
    await Promise.all([
      doc.fonts.load(`300 16px "KoPubWorldBatang"`),
      doc.fonts.load(`400 16px "GowunBatang"`),
    ]);
  } catch {
    // 외부 폰트 로딩이 실패해도 에디터 자체는 계속 사용
  }
}

async function applyEditorAppearance(
  wrapper: HTMLDivElement | null,
  previewMode: PreviewMode
) {
  const { skinDoc, editingDoc } = await getSmartEditorDocuments(wrapper);

  if (skinDoc) {
    injectFontStyle(skinDoc);
    await loadEditorFonts(skinDoc);
  }

  if (editingDoc) {
    injectFontStyle(editingDoc);

    if (editingDoc.body) {
      editingDoc.body.style.fontFamily =
        "'KoPubWorldBatang', 'GowunBatang', serif";
      editingDoc.body.style.fontWeight = "300";
      editingDoc.body.style.fontSize = "15px";
      editingDoc.body.style.lineHeight = "1.5";
    }

    applyPreviewMode(editingDoc, previewMode);
    await loadEditorFonts(editingDoc);
  }

  return { skinDoc, editingDoc };
}

export default function SmartEditor({
  name,
  initialValue = "",
  label,
  height = 700,
  autosyncMs = 2000,
}: SmartEditorProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorObjRef = useRef<any[]>([]);
  const initializedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("pc");

  const reactId = useId();
  const editorId = `smarteditor_${reactId.replace(/[:]/g, "_")}`;
  const resolvedHeight = normalizeHeight(height);

  useEffect(() => {
    let disposed = false;

    const init = async () => {
      if (initializedRef.current) return;
      if (!textareaRef.current) return;

      try {
        await loadSmartEditorScript();

        if (disposed) return;

        if (!window.nhn?.husky?.EZCreator) {
          throw new Error("EZCreator not found");
        }

        initializedRef.current = true;

        window.nhn.husky.EZCreator.createInIFrame({
          oAppRef: editorObjRef.current,
          elPlaceHolder: editorId,
          sSkinURI: "/smarteditor2/SmartEditor2Skin.html",
          htParams: {
            bUseToolbar: true,
            bUseVerticalResizer: true,
            bUseModeChanger: true,
            aAdditionalFontList: [
              ["KoPubWorldBatang", "코펍월드 바탕"],
              ["GowunBatang", "고운 바탕"],
            ],
            fOnBeforeUnload: function () {},
            I18N_LOCALE: "ko_KR",
          },
          fOnAppLoad: function () {
            const editor = editorObjRef.current?.[0];
            if (!editor) return;

            (async () => {
              try {
                const seedHtml = textareaRef.current?.value || initialValue;

                if (seedHtml) {
                  editor.exec("PASTE_HTML", [seedHtml]);
                  editor.exec("UPDATE_CONTENTS_FIELD", []);
                }

                await applyEditorAppearance(
                  wrapperRef.current,
                  previewMode
                );

                if (typeof editor.setDefaultFont === "function") {
                  editor.setDefaultFont("KoPubWorldBatang", 11);
                }

                // SmartEditor 내부 iframe이 완전히 그려진 뒤 한 번 더 적용.
                await wait(250);
                await applyEditorAppearance(
                  wrapperRef.current,
                  previewMode
                );
              } catch (e) {
                console.error("[SmartEditor] initial sync failed", e);
              }

              if (!disposed) {
                setReady(true);
                setFailed(false);
              }
            })();
          },
          fCreator: "createSEditor2",
        });
      } catch (error) {
        console.error("[SmartEditor] init failed", error);
        setFailed(true);
        setReady(false);
      }
    };

    init();

    return () => {
      disposed = true;
      editorObjRef.current = [];
      initializedRef.current = false;
      setReady(false);
    };
  }, [editorId, initialValue]);

  useEffect(() => {
    if (!ready || failed) return;

    let cancelled = false;

    (async () => {
      await applyEditorAppearance(
        wrapperRef.current,
        previewMode
      );

      if (cancelled) return;

      // iframe 내부 레이아웃 계산 후 한 번 더 적용
      window.setTimeout(() => {
        if (!cancelled) {
          applyEditorAppearance(
            wrapperRef.current,
            previewMode
          ).catch(() => {});
        }
      }, 120);
    })();

    return () => {
      cancelled = true;
    };
  }, [previewMode, ready, failed]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const form = wrapper.closest("form");
    if (!form) return;

    const handleSubmit = () => {
      const editor = editorObjRef.current?.[0];
      if (!editor) return;

      try {
        editor.exec("UPDATE_CONTENTS_FIELD", []);
      } catch (error) {
        console.error("[SmartEditor] submit sync failed", error);
      }
    };

    form.addEventListener("submit", handleSubmit);
    return () => form.removeEventListener("submit", handleSubmit);
  }, []);

  useEffect(() => {
    if (!ready || failed) return;

    const intervalId = window.setInterval(() => {
      const editor = editorObjRef.current?.[0];
      if (!editor) return;

      try {
        editor.exec("UPDATE_CONTENTS_FIELD", []);
      } catch (error) {
        console.error("[SmartEditor] autosync failed", error);
      }
    }, autosyncMs);

    return () => window.clearInterval(intervalId);
  }, [ready, failed, autosyncMs]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleRestore = () => {
      const editor = editorObjRef.current?.[0];
      if (!editor) return;

      try {
        editor.exec("SET_IR", [textarea.value || ""]);
        editor.exec("UPDATE_CONTENTS_FIELD", []);
        applyEditorAppearance(
          wrapperRef.current,
          previewMode
        ).catch(() => {});
      } catch (error) {
        console.error("[SmartEditor] draft restore sync failed", error);
      }
    };

    textarea.addEventListener(
      "story-draft-restore",
      handleRestore as EventListener
    );

    return () => {
      textarea.removeEventListener(
        "story-draft-restore",
        handleRestore as EventListener
      );
    };
  }, [previewMode]);

  return (
    <div ref={wrapperRef} className="form-field form-field-full">
      <div className="smarteditor-label-row">
        {label && <span>{label}</span>}

        <div
          className="smarteditor-preview-switch"
          role="group"
          aria-label="본문 미리보기 폭"
        >
          <button
            type="button"
            className={previewMode === "wide" ? "is-active" : ""}
            onClick={() => setPreviewMode("wide")}
          >
            편집 넓게
          </button>
          <button
            type="button"
            className={previewMode === "pc" ? "is-active" : ""}
            onClick={() => setPreviewMode("pc")}
          >
            실제 PC 폭
          </button>
          <button
            type="button"
            className={previewMode === "mobile" ? "is-active" : ""}
            onClick={() => setPreviewMode("mobile")}
          >
            모바일 폭
          </button>
        </div>
      </div>

      <p className="smarteditor-preview-note">
        폭 전환은 편집 화면 미리보기만 바꾸며 저장되는 HTML 너비에는 영향을 주지 않습니다.
      </p>

      {failed && (
        <p style={{ color: "#ff8f8f", marginBottom: "8px" }}>
          SmartEditor 초기화 실패. textarea로 입력하세요.
        </p>
      )}

      <div className="story-rich-editor-shell">
        <textarea
          id={editorId}
          name={name}
          ref={textareaRef}
          defaultValue={initialValue}
          style={{
            width: "100%",
            height: resolvedHeight,
            display: ready && !failed ? "none" : "block",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}
