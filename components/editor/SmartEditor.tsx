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
    script.onerror = () =>
      reject(new Error("SmartEditor 스크립트 로드 실패"));

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

  for (let i = 0; i < 40; i += 1) {
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
  if (doc.getElementById("smarteditor-custom-font-style")) {
    return;
  }

  const style = doc.createElement("style");
  style.id = "smarteditor-custom-font-style";
  style.textContent = `
    @font-face {
      font-family: 'KoPubWorldBatang';
      src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/2410-1@1.0/KoPubWorldBatangLight.woff2') format('woff2');
      font-weight: 300;
      font-style: normal;
    }

    @font-face {
      font-family: 'GowunBatang';
      src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/2104@1.0/GowunBatang-Regular.woff') format('woff');
      font-weight: 400;
      font-style: normal;
    }

    body,
    .se2_inputarea,
    .husky_seditor_editing_area_container {
      font-family: 'KoPubWorldBatang', serif !important;
    }
  `;

  doc.head.appendChild(style);
}

async function applyEditorFonts(wrapper: HTMLDivElement | null) {
  const { skinDoc, editingDoc } = await getSmartEditorDocuments(wrapper);

  if (skinDoc) {
    injectFontStyle(skinDoc);
    if (skinDoc.body) {
      skinDoc.body.style.fontFamily = "'KoPubWorldBatang', serif";
    }
  }

  if (editingDoc) {
    injectFontStyle(editingDoc);
    if (editingDoc.body) {
      editingDoc.body.style.fontFamily = "'KoPubWorldBatang', serif";
    }

    if ("fonts" in editingDoc) {
      try {
        await Promise.all([
          editingDoc.fonts.load(`400 16px "KoPubWorldBatang"`),
          editingDoc.fonts.load(`400 16px "GowunBatang"`),
        ]);
      } catch {
        // 폰트 로드 실패해도 에디터 자체는 계속 사용
      }
    }
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
                const seedHtml =
                  textareaRef.current?.value || initialValue || "";

                if (seedHtml) {
                  editor.exec("SET_IR", [seedHtml]);
                  editor.exec("UPDATE_CONTENTS_FIELD", []);
                }

                await applyEditorFonts(wrapperRef.current);

                if (typeof editor.setDefaultFont === "function") {
                  editor.setDefaultFont("KoPubWorldBatang", 11);
                }
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
  }, []);

  return (
    <div ref={wrapperRef} className="form-field form-field-full">
      {label && <span>{label}</span>}

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