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
            fOnBeforeUnload: function () {},
            I18N_LOCALE: "ko_KR",
          },
          fOnAppLoad: function () {
            const editor = editorObjRef.current?.[0];
            if (!editor) return;

            try {
              const seedHtml = textareaRef.current?.value || initialValue;

if (seedHtml) {
  editor.exec("PASTE_HTML", [seedHtml]);
  editor.exec("UPDATE_CONTENTS_FIELD", []);
}
            } catch (e) {
              console.error("[SmartEditor] initial sync failed", e);
            }

            setReady(true);
            setFailed(false);
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