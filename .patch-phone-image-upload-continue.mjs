import fs from "node:fs";

const formFile =
  "components/admin/phone-items/PhoneItemForm.tsx";

const messageFile =
  "components/admin/phone-items/MessageBlockEditor.tsx";

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function write(file, value) {
  fs.writeFileSync(
    file,
    value.replace(/\n/g, "\r\n"),
    "utf8"
  );
}

function ensureImport(source, importLine, anchor) {
  if (source.includes(importLine)) {
    return source;
  }

  if (anchor && source.includes(anchor)) {
    return source.replace(
      anchor,
      anchor + "\n" + importLine
    );
  }

  const useClient = '"use client";';

  if (source.includes(useClient)) {
    return source.replace(
      useClient,
      useClient + "\n\n" + importLine
    );
  }

  fail("import 삽입 위치를 찾지 못했습니다.");
}

function replaceLabelContaining(
  source,
  marker,
  replacement,
  alreadyDoneMarker
) {
  if (
    alreadyDoneMarker &&
    source.includes(alreadyDoneMarker)
  ) {
    console.log(
      `[SKIP] already patched: ${alreadyDoneMarker}`
    );
    return source;
  }

  const index = source.indexOf(marker);

  if (index < 0) {
    fail(`필드를 찾지 못했습니다: ${marker}`);
  }

  const start = source.lastIndexOf(
    '<label className="form-field',
    index
  );

  const endStart = source.indexOf(
    "</label>",
    index
  );

  if (start < 0 || endStart < 0) {
    fail(`label 범위를 찾지 못했습니다: ${marker}`);
  }

  const end = endStart + "</label>".length;

  return (
    source.slice(0, start) +
    replacement +
    source.slice(end)
  );
}

/* =====================================================
   PhoneItemForm
===================================================== */

let form = read(formFile);

form = ensureImport(
  form,
  'import PhoneImageField from "@/components/admin/phone-items/PhoneImageField";',
  'import MessageBlockEditor from "@/components/admin/phone-items/MessageBlockEditor";'
);

/* 모멘트 여러 장 */
form = replaceLabelContaining(
  form,
  'name="moment_image_urls_text"',
`<div className="form-field form-field-full">
        <PhoneImageField
          label="모멘트 이미지"
          name="moment_image_urls_text"
          multiple
          initialUrls={(values.moment_image_urls_text || "")
            .split(/\\r?\\n/)
            .map((value) => value.trim())
            .filter(Boolean)}
          help="여러 장 업로드 가능 · 드래그앤드롭 / 파일 선택 / URL 직접 입력"
        />
      </div>`,
  'label="모멘트 이미지"'
);

console.log("[PATCHED] moment images");

/* 기사 대표 이미지 */
form = replaceLabelContaining(
  form,
  'name="article_image_url"',
`<div className="form-field form-field-full">
        <PhoneImageField
          label="대표 이미지"
          name="article_image_url"
          initialUrls={
            initialValues?.article_image_url
              ? [initialValues.article_image_url]
              : []
          }
          help="대표 이미지 1장 · 드래그앤드롭 / 파일 선택 / URL 직접 입력"
        />
      </div>`,
  'label="대표 이미지"'
);

console.log("[PATCHED] article image");

write(formFile, form);

/* =====================================================
   MessageBlockEditor
===================================================== */

let message = read(messageFile);

message = ensureImport(
  message,
  'import PhoneImageField from "@/components/admin/phone-items/PhoneImageField";',
  null
);

message = replaceLabelContaining(
  message,
  "<span>이미지 URL</span>",
`<div className="form-field form-field-full">
                  <PhoneImageField
                    label="이미지"
                    initialUrls={
                      node.url ? [node.url] : []
                    }
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
                </div>`,
  'help="이 이미지 메시지 위치에 표시될 이미지"'
);

console.log("[PATCHED] message image block");

write(messageFile, message);

console.log("");
console.log(
  "=== PHONE IMAGE PATCH CONTINUED SUCCESSFULLY ==="
);
