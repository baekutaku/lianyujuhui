"use client";

import { useEffect, useId, useRef, useState } from "react";
import SmartEditorImageUpload from "@/components/editor/SmartEditorImageUpload";
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

function looksLikeEditorHtml(value: string) {
  return /<(?:p|div|br|span|img|a|strong|em|b|i|u|s|ul|ol|li|blockquote|table|tbody|thead|tfoot|tr|td|th|h[1-6])\b/i.test(
    value
  );
}

function escapePlainText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function preserveBlankParagraphs(html: string) {
  if (!html) return "";

  return html
    .replace(
      /(<p\b[^>]*>)(?:\s|&nbsp;|&#160;)*(<\/p>)/gi,
      "$1<br>$2"
    )
    .replace(
      /(<div\b[^>]*>)(?:\s|&nbsp;|&#160;)*(<\/div>)/gi,
      "$1<br>$2"
    );
}

function prepareEditorHtml(value: string) {
  const normalized = String(value || "").replace(/\r\n?/g, "\n");
  if (!normalized) return "";

  if (!looksLikeEditorHtml(normalized)) {
    return escapePlainText(normalized).replace(/\n/g, "<br>");
  }

  return preserveBlankParagraphs(normalized);
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
        () => reject(new Error("SmartEditor ?ㅽ겕由쏀듃 濡쒕뱶 ?ㅽ뙣")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "/smarteditor2/js/service/HuskyEZCreator.js";
    script.async = true;
    script.dataset.smarteditor = "husky";

    script.onload = () => resolve();
    script.onerror = () => reject(new Error("SmartEditor ?ㅽ겕由쏀듃 濡쒕뱶 ?ㅽ뙣"));

    document.body.appendChild(script);
  });

  return window.__smartEditorScriptPromise;
}

function getIframeDocument(iframe: HTMLIFrameElement | null | undefined) {
  if (!iframe) return null;
  return iframe.contentDocument || iframe.contentWindow?.document || null;
}

function getCurrentEditingDocument(
  wrapper: HTMLDivElement | null
) {
  if (!wrapper) return null;

  const outerIframe =
    wrapper.querySelector<HTMLIFrameElement>("iframe");
  const skinDoc = getIframeDocument(outerIframe);

  if (!skinDoc) return null;

  const innerIframe =
    skinDoc.querySelector<HTMLIFrameElement>("#se2_iframe") ||
    skinDoc.querySelector<HTMLIFrameElement>("iframe");

  return getIframeDocument(innerIframe);
}

function preserveBlankBlocksInEditorDom(
  doc: Document | null
) {
  if (!doc?.body) return;

  const blocks = doc.body.querySelectorAll<HTMLElement>(
    "p, .se-text-paragraph"
  );

  blocks.forEach((block) => {
    const text = (block.textContent || "")
      .replace(/\u00a0/g, "")
      .trim();

    const html = block.innerHTML
      .replace(/&nbsp;|&#160;/gi, "")
      .replace(/<br\s*\/?>/gi, "")
      .trim();

    if (!text && !html) {
      block.innerHTML = "<br data-smarteditor-blank-line=\"1\">";
      block.dataset.smarteditorBlankLine = "1";
    }
  });
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
      font-family: 'KoPubWorldBatang', 'GowunBatang', serif;
    }

    body {
      font-weight: 300;
    }

    body p,
    body .se-text-paragraph {
      min-height: 1.5em;
    }

    body p:empty::before,
    body .se-text-paragraph:empty::before {
      content: "\\00a0";
    }

    body p[data-smarteditor-blank-line="1"],
    body .se-text-paragraph[data-smarteditor-blank-line="1"] {
      min-height: 1.5em;
    }
  `;
}

function injectSmartEditorExtraStyle(doc: Document) {
  if (doc.getElementById("smarteditor-extra-style-v3")) {
    return;
  }

  const style = doc.createElement("style");
  style.id = "smarteditor-extra-style-v3";
  style.textContent = `
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    @import url('https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Nanum+Myeongjo:wght@400;700&family=Noto+Sans+KR:wght@400;700&family=Noto+Serif+KR:wght@400;700&display=swap');

    details.story-more {
      display: block;
      margin: 18px 0 !important;
      border: 1px dashed rgba(123, 104, 168, 0.42) !important;
      border-radius: 12px !important;
      background: rgba(252, 249, 255, 0.88) !important;
      overflow: hidden;
    }

    details.story-more > summary {
      display: block !important;
      cursor: pointer;
      padding: 10px 14px !important;
      font-weight: 600 !important;
      background: rgba(242, 235, 255, 0.9) !important;
    }

    /* ?몄쭛 ?붾㈃?먯꽌??湲곕낯? ?묓옒. summary瑜??대┃?섎㈃ ?쇱퀜吏꾨떎. */
    details.story-more:not([open]) > .story-more-content {
      display: none !important;
    }

    details.story-more[open] > .story-more-content {
      display: block !important;
      padding: 14px 16px !important;
      border-top: 1px dashed rgba(123, 104, 168, 0.24) !important;
    }
  `;

  doc.head.appendChild(style);
}

function injectSelectableFontStyle(doc: Document) {
  if (doc.getElementById("smarteditor-selectable-fonts-v5")) {
    return;
  }

  const style = doc.createElement("style");
  style.id = "smarteditor-selectable-fonts-v5";
  style.textContent = `
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    @import url('https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Nanum+Myeongjo:wght@400;700&family=Noto+Sans+KR:wght@400;700&family=Noto+Serif+KR:wght@400;700&display=swap');

    /* 湲곕낯 湲瑗대쭔 吏?? ?먯떇??SmartEditor媛 ?ｋ뒗 inline font-family媛 ?곗꽑?쒕떎. */
    body,
    .se2_inputarea,
    .husky_seditor_editing_area_container {
      font-family: 'KoPubWorldBatang', 'GowunBatang', serif;
    }
  `;

  doc.head.appendChild(style);
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
    // ?몃? ?고듃 濡쒕뵫???ㅽ뙣?대룄 ?먮뵒???먯껜??怨꾩냽 ?ъ슜
  }
}

async function applyEditorAppearance(
  wrapper: HTMLDivElement | null,
  previewMode: PreviewMode
) {
  const { skinDoc, editingDoc } = await getSmartEditorDocuments(wrapper);

  if (skinDoc) {
    injectFontStyle(skinDoc);
    injectSelectableFontStyle(skinDoc);
    injectSmartEditorExtraStyle(skinDoc);
    await loadEditorFonts(skinDoc);
  }

  if (editingDoc) {
    injectFontStyle(editingDoc);
    injectSelectableFontStyle(editingDoc);
    injectSmartEditorExtraStyle(editingDoc);

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

/* SMARTEDITOR_MORE_KEYBOARD_DELETE_20261021
   별도 삭제 버튼 없이:
   - 더보기 바로 뒤에서 Backspace
   - 더보기 바로 앞에서 Delete
   로 details.story-more 전체를 제거한다.
*/
function getTopLevelEditorBlock(
  doc: Document,
  node: Node | null
): HTMLElement | null {
  if (!node || !doc.body) return null;

  if (node === doc.body) {
    return null;
  }

  let element =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : node.parentElement;

  while (element && element.parentElement !== doc.body) {
    element = element.parentElement;
  }

  return element;
}

function caretIsAtStartOfBlock(
  range: Range,
  block: HTMLElement
) {
  try {
    const before = range.cloneRange();
    before.selectNodeContents(block);
    before.setEnd(range.startContainer, range.startOffset);

    return before
      .toString()
      .replace(/[\u200B\uFEFF]/g, "")
      .length === 0;
  } catch {
    return false;
  }
}

function caretIsAtEndOfBlock(
  range: Range,
  block: HTMLElement
) {
  try {
    const after = range.cloneRange();
    after.selectNodeContents(block);
    after.setStart(range.startContainer, range.startOffset);

    return after
      .toString()
      .replace(/[\u200B\uFEFF]/g, "")
      .length === 0;
  } catch {
    return false;
  }
}

function handleMoreBlockKeyboardDelete(
  event: KeyboardEvent,
  doc: Document,
  onChanged: () => void
) {
  if (
    event.defaultPrevented ||
    event.isComposing ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  ) {
    return;
  }

  if (event.key !== "Backspace" && event.key !== "Delete") {
    return;
  }

  const selection = doc.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
    return;
  }

  const range = selection.getRangeAt(0);

  /*
   * 커서가 body 자체에 걸린 특수한 경우도 처리.
   */
  if (range.startContainer === doc.body) {
    const offset = range.startOffset;

    const candidate =
      event.key === "Backspace"
        ? doc.body.children.item(offset - 1)
        : doc.body.children.item(offset);

    if (
      candidate instanceof HTMLElement &&
      candidate.matches("details.story-more")
    ) {
      event.preventDefault();
      candidate.remove();
      onChanged();
    }

    return;
  }

  const block = getTopLevelEditorBlock(
    doc,
    range.startContainer
  );

  if (!block) return;

  /*
   * 더보기 바로 뒤 블록의 맨 앞에서 Backspace
   *
   * [더보기]
   * |본문
   */
  if (
    event.key === "Backspace" &&
    caretIsAtStartOfBlock(range, block)
  ) {
    const previous = block.previousElementSibling;

    if (
      previous instanceof HTMLElement &&
      previous.matches("details.story-more")
    ) {
      event.preventDefault();
      previous.remove();
      onChanged();
      return;
    }
  }

  /*
   * 더보기 바로 앞 블록의 맨 끝에서 Delete
   *
   * 본문|
   * [더보기]
   */
  if (
    event.key === "Delete" &&
    caretIsAtEndOfBlock(range, block)
  ) {
    const next = block.nextElementSibling;

    if (
      next instanceof HTMLElement &&
      next.matches("details.story-more")
    ) {
      event.preventDefault();
      next.remove();
      onChanged();
    }
  }
}
/* SMARTEDITOR_MORE_KEYBOARD_DELETE_V2_20261021 */

function fragmentHasMeaningfulEditorContent(
  fragment: DocumentFragment
) {
  const cloned = fragment.cloneNode(true) as DocumentFragment;

  cloned.querySelectorAll(
    "br"
  ).forEach((node) => node.remove());

  const text = (cloned.textContent || "")
    .replace(/[\u00A0\u200B\uFEFF]/g, "")
    .trim();

  if (text.length > 0) {
    return true;
  }

  return Boolean(
    cloned.querySelector(
      "img,video,audio,iframe,table,hr,details,ul,ol,blockquote"
    )
  );
}

function handleMoreBlockKeyboardDeleteV2(
  event: KeyboardEvent,
  doc: Document,
  onChanged: () => void
) {
  if (
    event.defaultPrevented ||
    event.isComposing ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  ) {
    return;
  }

  if (
    event.key !== "Backspace" &&
    event.key !== "Delete"
  ) {
    return;
  }

  const selection = doc.getSelection();

  if (
    !selection ||
    selection.rangeCount === 0 ||
    !selection.isCollapsed
  ) {
    return;
  }

  const range = selection.getRangeAt(0);
  const caret = range.cloneRange();

  caret.collapse(true);

  const moreBlocks = Array.from(
    doc.body.querySelectorAll<HTMLElement>(
      "details.story-more"
    )
  );

  let target: HTMLElement | null = null;

  if (event.key === "Backspace") {
    for (let i = moreBlocks.length - 1; i >= 0; i -= 1) {
      const more = moreBlocks[i];

      const moreRange = doc.createRange();
      moreRange.selectNode(more);

      /*
       * Ignore blocks that are not before the caret.
       */
      if (
        moreRange.compareBoundaryPoints(
          Range.END_TO_START,
          caret
        ) > 0
      ) {
        continue;
      }

      try {
        const between = doc.createRange();

        between.setStartAfter(more);
        between.setEnd(
          caret.startContainer,
          caret.startOffset
        );

        const fragment = between.cloneContents();

        if (
          !fragmentHasMeaningfulEditorContent(fragment)
        ) {
          target = more;
          break;
        }
      } catch {
        continue;
      }
    }
  }

  if (event.key === "Delete") {
    for (const more of moreBlocks) {
      const moreRange = doc.createRange();
      moreRange.selectNode(more);

      /*
       * Ignore blocks that are not after the caret.
       */
      if (
        caret.compareBoundaryPoints(
          Range.START_TO_START,
          moreRange
        ) > 0
      ) {
        continue;
      }

      try {
        const between = doc.createRange();

        between.setStart(
          caret.startContainer,
          caret.startOffset
        );
        between.setEndBefore(more);

        const fragment = between.cloneContents();

        if (
          !fragmentHasMeaningfulEditorContent(fragment)
        ) {
          target = more;
          break;
        }
      } catch {
        continue;
      }
    }
  }

  if (!target) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  target.remove();

  onChanged();
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
  const submittingRef = useRef(false);
  const initialSeedDoneRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("pc");

  const reactId = useId();
  const editorId = `smarteditor_${reactId.replace(/[:]/g, "_")}`;
  const resolvedHeight = normalizeHeight(height);

  function syncEditorContents(editor: any) {
    const editingDoc = getCurrentEditingDocument(
      wrapperRef.current
    );

    preserveBlankBlocksInEditorDom(editingDoc);

    editor.exec("UPDATE_CONTENTS_FIELD", []);

    const textarea = textareaRef.current;
    if (!textarea) return;

    if (typeof preserveBlankParagraphs === "function") {
      const preserved = preserveBlankParagraphs(
        textarea.value || ""
      );

      if (preserved !== textarea.value) {
        textarea.value = preserved;
      }
    }
  }

  function insertMoreBlock() {
    const editor = editorObjRef.current?.[0];
    if (!editor) return;

    const moreHtml = `
      <details class="story-more">
        <summary>더보기</summary>
        <div class="story-more-content">
          <p>여기에 내용을 입력하세요.</p>
        </div>
      </details>
      <p><br></p>
    `;

    try {
      editor.exec("FOCUS", []);
      editor.exec("PASTE_HTML", [moreHtml]);
      editor.exec("UPDATE_CONTENTS_FIELD", []);
    } catch (error) {
      console.error("[SmartEditor] more block insert failed", error);
    }
  }

  function insertUploadedImages(urls: string[]) {
    const editor = editorObjRef.current?.[0];
    if (!editor || urls.length === 0) return;

    const imageHtml = urls.map((url) => {
      const safeUrl = String(url).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<p><img src="${safeUrl}" alt="" style="max-width:100%;height:auto;" /></p>`;
    }).join("");

    try {
      editor.exec("FOCUS", []);
      editor.exec("PASTE_HTML", [imageHtml]);
      syncEditorContents(editor);
    } catch (error) {
      console.error("[SmartEditor] image insert failed", error);
    }
  }

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
              ["Pretendard", "Pretendard"],
              ["Noto Sans KR", "Noto Sans KR"],
              ["Noto Serif KR", "Noto Serif KR"],
              ["Nanum Myeongjo", "나눔명조"],
              ["Gowun Dodum", "고운돋움"],
              ["KoPubWorldBatang", "KoPubWorld 바탕"],
              ["GowunBatang", "고운바탕"],
            ],
            fOnBeforeUnload: function () {},
            I18N_LOCALE: "ko_KR",
          },
          fOnAppLoad: function () {
            const editor = editorObjRef.current?.[0];
            if (!editor) return;

            (async () => {
              try {
                const rawSeed =
                  textareaRef.current?.value || initialValue;
                const seedHtml = prepareEditorHtml(rawSeed);

                if (seedHtml && !initialSeedDoneRef.current) {
                  initialSeedDoneRef.current = true;
                  editor.exec("SET_IR", [seedHtml]);
                  syncEditorContents(editor);
                }

                await applyEditorAppearance(
                  wrapperRef.current,
                  previewMode
                );

                if (typeof editor.setDefaultFont === "function") {
                  editor.setDefaultFont("KoPubWorldBatang", 11);
                }

                // SmartEditor ?대? iframe???꾩쟾??洹몃젮吏?????踰????곸슜.
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
      initialSeedDoneRef.current = false;
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

      // iframe ?대? ?덉씠?꾩썐 怨꾩궛 ????踰????곸슜
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

  /* SMARTEDITOR_MORE_KEYBOARD_DELETE_BIND_20261021 */
  useEffect(() => {
    if (!ready || failed) return;

    let disposed = false;
    let editingDoc: Document | null = null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!editingDoc) return;

      handleMoreBlockKeyboardDeleteV2(
        event,
        editingDoc,
        () => {
          const editor = editorObjRef.current?.[0];
          if (!editor) return;

          window.setTimeout(() => {
            try {
              preserveBlankBlocksInEditorDom(editingDoc);

              syncEditorContents(editor);
            } catch (error) {
              console.error(
                "[SmartEditor] more block keyboard delete sync failed",
                error
              );
            }
          }, 0);
        }
      );
    };

    (async () => {
      const docs = await getSmartEditorDocuments(
        wrapperRef.current
      );

      if (disposed || !docs.editingDoc) return;

      editingDoc = docs.editingDoc;
      editingDoc.addEventListener("keydown", handleKeyDown, true);
    })();

    return () => {
      disposed = true;

      if (editingDoc) {
        editingDoc.removeEventListener("keydown", handleKeyDown, true);
      }
    };
  }, [ready, failed]);
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const form = wrapper.closest("form");
    if (!form) return;

    const handleSubmit = () => {
      submittingRef.current = true;

      const editor = editorObjRef.current?.[0];
      if (!editor) return;

      try {
        syncEditorContents(editor);
      } catch (error) {
        console.error("[SmartEditor] submit sync failed", error);
      }
    };

    const handleFormData = (event: Event) => {
      const editor = editorObjRef.current?.[0];
      const textarea = textareaRef.current;

      if (!editor || !textarea) return;

      try {
        syncEditorContents(editor);

        const formDataEvent = event as FormDataEvent;
        formDataEvent.formData?.set(
          name,
          textarea.value || ""
        );
      } catch (error) {
        console.error(
          "[SmartEditor] formdata sync failed",
          error
        );
      }
    };

    form.addEventListener("submit", handleSubmit);
    form.addEventListener(
      "formdata",
      handleFormData as EventListener
    );

    return () => {
      form.removeEventListener("submit", handleSubmit);
      form.removeEventListener(
        "formdata",
        handleFormData as EventListener
      );
    };
  }, [name]);

  useEffect(() => {
    if (!ready || failed) return;

    const intervalId = window.setInterval(() => {
      if (submittingRef.current) return;

      const wrapper = wrapperRef.current;
      if (!wrapper || !wrapper.isConnected) return;

      const editor = editorObjRef.current?.[0];
      if (!editor) return;

      try {
        syncEditorContents(editor);
      } catch (error) {
        if (!submittingRef.current) {
          console.error("[SmartEditor] autosync failed", error);
        }
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
        const restoredHtml = prepareEditorHtml(
          textarea.value || ""
        );
        editor.exec("SET_IR", [restoredHtml]);
        syncEditorContents(editor);
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
          aria-label="본문 미리보기 모드"
        >
          <button
            type="button"
            className={previewMode === "wide" ? "is-active" : ""}
            onClick={() => setPreviewMode("wide")}
          >
            넓게 보기</button>
          <button
            type="button"
            className={previewMode === "pc" ? "is-active" : ""}
            onClick={() => setPreviewMode("pc")}
          >
            PC 보기</button>
          <button
            type="button"
            className={previewMode === "mobile" ? "is-active" : ""}
            onClick={() => setPreviewMode("mobile")}
          >
            모바일 보기</button>
        </div>
      </div>

      <p className="smarteditor-preview-note">
        화면 전환은 편집 화면의 미리보기 크기만 바꾸며 저장되는 HTML에는 영향을 주지 않습니다.</p>

      {failed && (
        <p style={{ color: "#ff8f8f", marginBottom: "8px" }}>
          SmartEditor 초기화에 실패했습니다. textarea에 입력해 주세요.</p>
      )}

      {ready && !failed ? (
        <div
          className="smarteditor-extra-tools"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "8px",
          }}
        >
          <SmartEditorImageUpload onUploaded={insertUploadedImages} />
          <button
            type="button"
            onClick={insertMoreBlock}
            className="smarteditor-more-insert-button"
            style={{
              height: "36px",
              padding: "0 13px",
              border: "1px solid rgba(130, 120, 155, 0.25)",
              borderRadius: "9px",
              background: "rgba(247, 242, 255, 0.92)",
              color: "inherit",
              cursor: "pointer",
              font: "inherit",
              fontWeight: 600,
            }}
          >
            더보기 삽입</button>
        </div>
      ) : null}

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





