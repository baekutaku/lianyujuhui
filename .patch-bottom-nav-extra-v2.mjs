import fs from "node:fs";
import path from "node:path";

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (
      full.includes("node_modules") ||
      full.includes(".next") ||
      full.includes("\\admin\\") ||
      full.endsWith(".bak")
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      walk(full, out);
    } else if (
      full.endsWith(".tsx") ||
      full.endsWith(".ts")
    ) {
      out.push(full);
    }
  }

  return out;
}

const excludedNames = [
  "FloatingMobileMenu.tsx",
  "HomeGuideButton.tsx",
  "HomeUpdateButton.tsx",
  "HomeUpdateModal.tsx",
];

const files = [
  ...walk("app"),
  ...walk("components"),
].filter(
  (file) => !excludedNames.includes(path.basename(file))
);

const candidates = [];

for (const file of files) {
  const src = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

  const needles = [
    "/maker",
    "커스텀",
  ];

  for (const needle of needles) {
    let pos = 0;

    while ((pos = src.indexOf(needle, pos)) >= 0) {
      const start = Math.max(0, pos - 3500);
      const end = Math.min(src.length, pos + 3500);
      const window = src.slice(start, end);

      const hasStories =
        window.includes("/stories");

      const hasCards =
        window.includes("/cards");

      const hasPhone =
        window.includes("/phone-items");

      const hasCustom =
        window.includes("커스텀");

      const hasMaker =
        window.includes("/maker");

      if (
        hasStories &&
        hasCards &&
        hasPhone &&
        (hasCustom || hasMaker)
      ) {
        let score = 0;

        if (hasStories) score += 5;
        if (hasCards) score += 5;
        if (hasPhone) score += 5;
        if (hasCustom) score += 5;
        if (hasMaker) score += 5;

        if (/bottom|dock|nav|menu|tab/i.test(window)) {
          score += 5;
        }

        candidates.push({
          file,
          src,
          pos,
          start,
          end,
          score,
        });

        break;
      }

      pos += needle.length;
    }
  }
}

/* 파일 중복 제거 */
const unique = new Map();

for (const item of candidates) {
  const prev = unique.get(item.file);

  if (!prev || item.score > prev.score) {
    unique.set(item.file, item);
  }
}

const list = [...unique.values()]
  .sort((a, b) => b.score - a.score);

console.log("=== 실제 하단 네비 후보 ===");

for (const item of list) {
  console.log(`[${item.score}] ${item.file}`);
}

if (!list.length) {
  throw new Error(
    "스토리/카드/휴대폰/커스텀이 함께 있는 네비 파일을 찾지 못했습니다."
  );
}

const target = list[0];

console.log("");
console.log("[SELECTED]", target.file);
console.log("");

let src = target.src;
let changed = false;

/* =========================================================
   1. 배열 객체형
   { href: "/maker", label: "커스텀", icon: ... }
   icon은 그대로 둔다.
========================================================= */

const objectPatterns = [
  /\{[^{}]*href\s*:\s*["']\/maker[^"']*["'][^{}]*(?:label|title)\s*:\s*["']커스텀["'][^{}]*\}/g,
  /\{[^{}]*(?:label|title)\s*:\s*["']커스텀["'][^{}]*href\s*:\s*["']\/maker[^"']*["'][^{}]*\}/g,
];

for (const regex of objectPatterns) {
  const match = regex.exec(src);

  if (!match) continue;

  let block = match[0];

  console.log("=== 발견한 네비 항목 ===");
  console.log(block);
  console.log("");

  block = block.replace(
    /href\s*:\s*["']\/maker[^"']*["']/,
    'href: "/extra"'
  );

  block = block.replace(
    /(label|title)\s*:\s*["']커스텀["']/,
    '$1: "기타"'
  );

  /*
    중요:
    icon / activeIcon / svg 등은 수정하지 않음.
  */

  src =
    src.slice(0, match.index) +
    block +
    src.slice(match.index + match[0].length);

  changed = true;
  break;
}

/* =========================================================
   2. JSX Link형
   <Link href="/maker"> 아이콘 ... 커스텀 </Link>
========================================================= */

if (!changed) {
  const links = [
    ...src.matchAll(/<Link\b[\s\S]*?<\/Link>/g),
  ];

  const customLink = links.find((match) => {
    const block = match[0];

    return (
      block.includes("커스텀") &&
      (
        block.includes('href="/maker') ||
        block.includes("href='/maker")
      )
    );
  });

  if (
    customLink &&
    customLink.index != null
  ) {
    let block = customLink[0];

    console.log("=== 발견한 JSX 네비 항목 ===");
    console.log(block);
    console.log("");

    block = block.replace(
      /href\s*=\s*["']\/maker[^"']*["']/,
      'href="/extra"'
    );

    /*
      텍스트만 변경.
      아이콘 JSX는 그대로 유지.
    */
    block = block.replace(
      /커스텀/g,
      "기타"
    );

    src =
      src.slice(0, customLink.index) +
      block +
      src.slice(
        customLink.index +
        customLink[0].length
      );

    changed = true;
  }
}

/* =========================================================
   3. button + router.push 형태
========================================================= */

if (!changed) {
  const around =
    src.slice(target.start, target.end);

  let patched = around;

  patched = patched.replace(
    /(["'])\/maker(?:\/[^"']*)?\1/g,
    '"/extra"'
  );

  /*
    이 7000자 블록 안에는 하단 네비 조건을 이미 만족하므로
    커스텀 텍스트 중 네비 라벨 하나만 교체.
  */
  const customPos =
    patched.lastIndexOf("커스텀");

  if (customPos >= 0) {
    patched =
      patched.slice(0, customPos) +
      "기타" +
      patched.slice(customPos + "커스텀".length);
  }

  if (patched !== around) {
    src =
      src.slice(0, target.start) +
      patched +
      src.slice(target.end);

    changed = true;
  }
}

if (!changed) {
  console.log("=== 후보 주변 코드 ===");
  console.log(
    src.slice(target.start, target.end)
  );

  throw new Error(
    "하단 네비 파일은 찾았지만 마지막 커스텀 버튼을 수정하지 못했습니다."
  );
}

/* 백업 */
const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

fs.copyFileSync(
  target.file,
  `${target.file}.before-extra-nav-${stamp}.bak`
);

fs.writeFileSync(
  target.file,
  src,
  "utf8"
);

console.log("[PATCHED]", target.file);
console.log("");
console.log("최종 하단 네비:");
console.log("홈 / 스토리 / 카드 / 휴대폰 / 기타");
console.log("");
console.log("기타 -> /extra");
console.log("기존 아이콘은 그대로 유지");
