import fs from "node:fs";
import path from "node:path";

const smartFile =
  "components/editor/SmartEditorImageUpload.tsx";

const phoneFormFile =
  "components/admin/phone-items/PhoneItemForm.tsx";

const messageEditorFile =
  "components/admin/phone-items/MessageBlockEditor.tsx";

const newComponentFile =
  "components/admin/phone-items/PhoneImageField.tsx";

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function write(file, value) {
  fs.mkdirSync(path.dirname(file), {
    recursive: true,
  });

  fs.writeFileSync(
    file,
    value.replace(/\n/g, "\r\n"),
    "utf8"
  );
}

/* =========================================================
   1. 기존 이미지 업로드 helper 재사용
========================================================= */

let smart = read(smartFile);

let helperImportPath = "";

const helperImportMatch = smart.match(
  /import\s*\{[\s\S]*?\buploadEditorImage\b[\s\S]*?\}\s*from\s*["']([^"']+)["'];/
);

if (helperImportMatch) {
  helperImportPath = helperImportMatch[1];
} else if (
  /export\s+async\s+function\s+uploadEditorImage\s*\(/.test(
    smart
  ) ||
  /export\s+const\s+uploadEditorImage\s*=/.test(
    smart
  )
) {
  helperImportPath =
    "@/components/editor/SmartEditorImageUpload";
} else if (
  /async\s+function\s+uploadEditorImage\s*\(/.test(
    smart
  )
) {
  smart = smart.replace(
    /async\s+function\s+uploadEditorImage\s*\(/,
    "export async function uploadEditorImage("
  );

  helperImportPath =
    "@/components/editor/SmartEditorImageUpload";

  write(smartFile, smart);

  console.log(
    "[PATCHED] uploadEditorImage named export"
  );
} else if (
  /const\s+uploadEditorImage\s*=\s*async/.test(
    smart
  )
) {
  smart = smart.replace(
    /const\s+uploadEditorImage\s*=\s*async/,
    "export const uploadEditorImage = async"
  );

  helperImportPath =
    "@/components/editor/SmartEditorImageUpload";

  write(smartFile, smart);

  console.log(
    "[PATCHED] uploadEditorImage const export"
  );
} else {
  fail(
    "SmartEditorImageUpload.tsx에서 uploadEditorImage 정의/가져오기를 찾지 못했습니다."
  );
}

/* =========================================================
   2. 휴대폰용 공통 이미지 입력 컴포넌트 생성
========================================================= */

const phoneImageField = `"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { uploadEditorImage } from "${helperImportPath}";

type PhoneImageFieldProps = {
  label?: string;
  name?: string;
  initialUrls?: string[];
  multiple?: boolean;
  help?: string;
  onUrlsChange?: (urls: string[]) => void;
};

function normalizeUrls(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );
}

export default function PhoneImageField({
  label = "이미지",
  name,
  initialUrls = [],
  multiple = false,
  help,
  onUrlsChange,
}: PhoneImageFieldProps) {
  const initialKey = useMemo(
    () => normalizeUrls(initialUrls).join("\\n"),
    [initialUrls]
  );

  const [urls, setUrls] = useState<string[]>(
    normalizeUrls(initialUrls)
  );

  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrls(
      initialKey
        ? initialKey.split("\\n").filter(Boolean)
        : []
    );
  }, [initialKey]);

  function commit(nextValues: string[]) {
    const normalized = normalizeUrls(nextValues);

    const next = multiple
      ? normalized
      : normalized.slice(-1);

    setUrls(next);
    onUrlsChange?.(next);
  }

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter(
      (file) => file.type.startsWith("image/")
    );

    if (!files.length) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const uploaded: string[] = [];

      for (const file of files) {
        const url = await uploadEditorImage(file);

        if (url) {
          uploaded.push(url);
        }
      }

      if (!uploaded.length) {
        throw new Error(
          "업로드된 이미지 URL이 없습니다."
        );
      }

      if (multiple) {
        commit([...urls, ...uploaded]);
      } else {
        commit([uploaded[uploaded.length - 1]]);
      }
    } catch (uploadError) {
      console.error(
        "[PhoneImageField] upload failed",
        uploadError
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "이미지 업로드에 실패했습니다."
      );
    } finally {
      setUploading(false);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  function addUrl() {
    const nextUrl = urlInput.trim();

    if (!nextUrl) return;

    if (multiple) {
      commit([...urls, nextUrl]);
    } else {
      commit([nextUrl]);
    }

    setUrlInput("");
  }

  function removeAt(index: number) {
    commit(
      urls.filter((_, currentIndex) => {
        return currentIndex !== index;
      })
    );
  }

  return (
    <div className="phone-image-field">
      {label ? (
        <div className="phone-image-field-title">
          {label}
        </div>
      ) : null}

      {help ? (
        <p className="phone-image-field-help">
          {help}
        </p>
      ) : null}

      {name ? (
        multiple ? (
          <textarea
            name={name}
            value={urls.join("\\n")}
            readOnly
            hidden
          />
        ) : (
          <input
            type="hidden"
            name={name}
            value={urls[0] ?? ""}
          />
        )
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="phone-image-file-input"
        onChange={(event) => {
          const files = event.target.files;

          if (files?.length) {
            void addFiles(files);
          }
        }}
      />

      <div
        className={
          "phone-image-dropzone" +
          (dragging ? " is-dragging" : "") +
          (uploading ? " is-uploading" : "")
        }
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);

          if (event.dataTransfer.files.length) {
            void addFiles(event.dataTransfer.files);
          }
        }}
      >
        <div className="phone-image-drop-copy">
          <span className="material-symbols-rounded">
            add_photo_alternate
          </span>

          <div>
            <strong>
              {multiple
                ? "이미지를 여기로 드래그"
                : "이미지를 여기로 드래그"}
            </strong>
            <small>
              파일 선택 또는 URL 직접 입력 가능
            </small>
          </div>
        </div>

        <button
          type="button"
          className="phone-image-pick-button"
          disabled={uploading}
          onClick={() => {
            fileRef.current?.click();
          }}
        >
          {uploading
            ? "업로드 중..."
            : multiple
              ? "이미지 추가"
              : urls.length
                ? "이미지 교체"
                : "파일 선택"}
        </button>
      </div>

      <div className="phone-image-url-row">
        <span className="material-symbols-rounded">
          link
        </span>

        <input
          type="url"
          value={urlInput}
          placeholder="https://... 또는 /images/..."
          onChange={(event) => {
            setUrlInput(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addUrl();
            }
          }}
        />

        <button
          type="button"
          onClick={addUrl}
        >
          URL 추가
        </button>
      </div>

      {urls.length ? (
        <div className="phone-image-preview-grid">
          {urls.map((url, index) => (
            <div
              key={url + "-" + index}
              className="phone-image-preview-card"
            >
              <div className="phone-image-preview-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                />
              </div>

              <div className="phone-image-preview-bottom">
                <span title={url}>
                  {index + 1}번 이미지
                </span>

                <button
                  type="button"
                  onClick={() => removeAt(index)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="phone-image-empty">
          등록된 이미지 없음
        </div>
      )}

      {error ? (
        <p className="phone-image-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
`;

write(newComponentFile, phoneImageField);

console.log(
  "[CREATED] PhoneImageField.tsx"
);

/* =========================================================
   3. PhoneItemForm 수정
========================================================= */

let form = read(phoneFormFile);

if (
  !form.includes(
    '@/components/admin/phone-items/PhoneImageField'
  )
) {
  const anchor =
    'import MessageBlockEditor from "@/components/admin/phone-items/MessageBlockEditor";';

  if (!form.includes(anchor)) {
    fail(
      "PhoneItemForm MessageBlockEditor import를 찾지 못했습니다."
    );
  }

  form = form.replace(
    anchor,
    anchor +
      '\\nimport PhoneImageField from "@/components/admin/phone-items/PhoneImageField";'
  );
}

/* 모멘트 이미지 textarea -> 공통 이미지 입력 */
const momentImageRegex =
  /<label className="form-field form-field-full">\s*<span>이미지 URL 목록<\/span>\s*<textarea[\s\S]*?name="moment_image_urls_text"[\s\S]*?<\/textarea>\s*<\/label>/;

if (momentImageRegex.test(form)) {
  form = form.replace(
    momentImageRegex,
`<div className="form-field form-field-full">
        <PhoneImageField
          label="모멘트 이미지"
          name="moment_image_urls_text"
          multiple
          initialUrls={values.moment_image_urls_text
            .split(/\\\\r?\\\\n/)
            .map((value) => value.trim())
            .filter(Boolean)}
          help="여러 장 업로드 가능 · 드래그앤드롭 / 파일 선택 / URL 입력"
        />
      </div>`
  );

  console.log(
    "[PATCHED] moment image field"
  );
} else if (
  !form.includes('label="모멘트 이미지"')
) {
  fail(
    "모멘트 이미지 URL textarea를 찾지 못했습니다."
  );
}

/* 기사 대표 이미지 URL -> 공통 이미지 입력 */
const articleImageRegex =
  /<label className="form-field form-field-full">\s*<span>대표 이미지 URL<\/span>\s*<input[\s\S]*?name="article_image_url"[\s\S]*?\/>\s*<\/label>/;

if (articleImageRegex.test(form)) {
  form = form.replace(
    articleImageRegex,
`<div className="form-field form-field-full">
        <PhoneImageField
          label="대표 이미지"
          name="article_image_url"
          initialUrls={
            initialValues?.article_image_url
              ? [initialValues.article_image_url]
              : []
          }
          help="대표 이미지 1장 · 드래그앤드롭 / 파일 선택 / URL 입력"
        />
      </div>`
  );

  console.log(
    "[PATCHED] article image field"
  );
} else if (
  !form.includes('label="대표 이미지"')
) {
  fail(
    "기사 대표 이미지 URL 입력을 찾지 못했습니다."
  );
}

write(phoneFormFile, form);

/* =========================================================
   4. MessageBlockEditor 이미지 블록 수정
========================================================= */

let message = read(messageEditorFile);

if (
  !message.includes(
    '@/components/admin/phone-items/PhoneImageField'
  )
) {
  const importMatches = [
    ...message.matchAll(/^import .*;$/gm),
  ];

  if (!importMatches.length) {
    fail(
      "MessageBlockEditor import 영역을 찾지 못했습니다."
    );
  }

  const lastImport =
    importMatches[importMatches.length - 1];

  const insertAt =
    lastImport.index + lastImport[0].length;

  message =
    message.slice(0, insertAt) +
    '\\nimport PhoneImageField from "@/components/admin/phone-items/PhoneImageField";' +
    message.slice(insertAt);
}

const messageImageRegex =
  /<label className="form-field form-field-full">\s*<span>이미지 URL<\/span>\s*<input\s*value=\{node\.url\}[\s\S]*?<\/label>/;

if (messageImageRegex.test(message)) {
  message = message.replace(
    messageImageRegex,
`<div className="form-field form-field-full">
                  <PhoneImageField
                    label="이미지"
                    initialUrls={node.url ? [node.url] : []}
                    onUrlsChange={(nextUrls) =>
                      onChange(
                        replaceAt(value, index, {
                          ...node,
                          url: nextUrls[0] ?? "",
                        })
                      )
                    }
                    help="이 이미지 메시지 위치에 표시될 이미지"
                  />
                </div>`
  );

  console.log(
    "[PATCHED] message image node"
  );
} else if (
  !message.includes(
    'help="이 이미지 메시지 위치에 표시될 이미지"'
  )
) {
  fail(
    "MessageBlockEditor의 이미지 URL 입력을 찾지 못했습니다."
  );
}

write(messageEditorFile, message);

console.log("");
console.log(
  "=== PHONE IMAGE UPLOAD PATCH COMPLETE ==="
);
console.log(
  "- moment: multi image"
);
console.log(
  "- message: image block upload"
);
console.log(
  "- article: representative image"
);
console.log(
  "- call/video_call: unchanged"
);
