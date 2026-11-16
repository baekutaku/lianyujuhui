import fs from "node:fs";

const IMPORT =
  'import PhoneImageField from "@/components/admin/phone-items/PhoneImageField";';

const specs = [
  {
    file: "app/admin/stories/new/page.tsx",
    field: "coverImageUrl",
    label: "대표 이미지 / 썸네일",
    help: "스토리 대표 이미지 · 드래그앤드롭 / 파일 선택 / URL 직접 입력",
  },
  {
    file: "app/admin/stories/[slug]/edit/page.tsx",
    field: "coverImageUrl",
    label: "대표 이미지 / 썸네일",
    help: "스토리 대표 이미지 · 드래그앤드롭 / 파일 선택 / URL 직접 입력",
  },
  {
    file: "app/admin/events/new/page.tsx",
    field: "thumbnailUrl",
    label: "썸네일 이미지",
    help: "이벤트 썸네일 · 드래그앤드롭 / 파일 선택 / URL 직접 입력",
  },
  {
    file: "app/admin/events/[slug]/edit/page.tsx",
    field: "thumbnailUrl",
    label: "썸네일 이미지",
    help: "이벤트 썸네일 · 드래그앤드롭 / 파일 선택 / URL 직접 입력",
  },
];

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

function addImport(src) {
  if (src.includes(IMPORT)) {
    return src;
  }

  const imports = [...src.matchAll(/^import .*;$/gm)];

  if (!imports.length) {
    fail("import 영역을 찾지 못했습니다.");
  }

  const last = imports[imports.length - 1];
  const pos = last.index + last[0].length;

  return (
    src.slice(0, pos) +
    "\n" +
    IMPORT +
    src.slice(pos)
  );
}

function getInitialExpression(block) {
  const jsxDefault =
    block.match(/defaultValue=\{([\s\S]*?)\}/);

  if (jsxDefault) {
    return jsxDefault[1].trim();
  }

  const stringDefault =
    block.match(/defaultValue="([^"]*)"/);

  if (stringDefault) {
    return JSON.stringify(stringDefault[1]);
  }

  return null;
}

for (const spec of specs) {
  if (!fs.existsSync(spec.file)) {
    fail(`파일 없음: ${spec.file}`);
  }

  let src = fs.readFileSync(spec.file, "utf8");
  const eol = src.includes("\r\n") ? "\r\n" : "\n";
  src = src.replace(/\r\n/g, "\n");

  if (
    src.includes(
      `<PhoneImageField\n            label="${spec.label}"`
    ) ||
    src.includes(
      `<PhoneImageField\r\n            label="${spec.label}"`
    )
  ) {
    console.log(`[SKIP] 이미 적용: ${spec.file}`);
    continue;
  }

  const marker = `name="${spec.field}"`;
  const markerIndex = src.indexOf(marker);

  if (markerIndex < 0) {
    fail(`${spec.file}: ${marker}을 찾지 못했습니다.`);
  }

  const start = src.lastIndexOf(
    '<label className="form-field form-field-full">',
    markerIndex
  );

  const endStart = src.indexOf(
    "</label>",
    markerIndex
  );

  if (start < 0 || endStart < 0) {
    fail(`${spec.file}: 이미지 입력 label 범위를 찾지 못했습니다.`);
  }

  const end = endStart + "</label>".length;
  const oldBlock = src.slice(start, end);

  const initialExpression =
    getInitialExpression(oldBlock);

  const initialUrls = initialExpression
    ? `          initialUrls={
            ${initialExpression}
              ? [${initialExpression}]
              : []
          }
`
    : `          initialUrls={[]}
`;

  const replacement =
`<div className="form-field form-field-full">
        <PhoneImageField
          label="${spec.label}"
          name="${spec.field}"
${initialUrls}          help="${spec.help}"
        />
      </div>`;

  src =
    src.slice(0, start) +
    replacement +
    src.slice(end);

  src = addImport(src);

  if (eol === "\r\n") {
    src = src.replace(/\n/g, "\r\n");
  }

  fs.writeFileSync(spec.file, src, "utf8");

  console.log(`[OK] ${spec.file}`);
  console.log(`     ${spec.field}`);
}

console.log("");
console.log("=== STORY / EVENT IMAGE UPLOAD PATCH COMPLETE ===");
