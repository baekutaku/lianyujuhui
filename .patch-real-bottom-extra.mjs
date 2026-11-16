import fs from "node:fs";
import path from "node:path";

/* ---------------------------------------------------------
   1. 방금 잘못 건드린 관리자 업데이트 옵션 복구
--------------------------------------------------------- */

const wrongFile = "app/admin/updates/page.tsx";

if (fs.existsSync(wrongFile)) {
  let src = fs.readFileSync(wrongFile, "utf8");

  const before = src;

  src = src.replace(
    /(\{\s*value\s*:\s*["']maker["']\s*,\s*label\s*:\s*)["']기타["']/g,
    '$1"커스텀"'
  );

  if (src !== before) {
    fs.writeFileSync(wrongFile, src, "utf8");
    console.log("[RESTORED] app/admin/updates/page.tsx : 기타 -> 커스텀");
  }
}

/* ---------------------------------------------------------
   2. components/home 안에서 실제 하단 네비 찾기
--------------------------------------------------------- */

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);

    if (e.isDirectory()) {
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

const files = walk("components/home");

const candidates = [];

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");

  if (!src.includes("커스텀")) continue;

  let score = 0;

  if (src.includes("/stories")) score += 4;
  if (src.includes("/cards")) score += 4;
  if (src.includes("/phone-items")) score += 4;
  if (src.includes("홈")) score += 2;
  if (src.includes("스토리")) score += 2;
  if (src.includes("카드")) score += 2;
  if (src.includes("휴대폰")) score += 2;

  if (/nav|menu|dock|bottom|tab/i.test(src)) score += 3;
  if (/nav|menu|lobby|bottom|dock/i.test(path.basename(file))) score += 3;

  /*
    업데이트 모달/버튼 같은 파일은 제외 우선순위
  */
  if (/update/i.test(path.basename(file))) score -= 10;

  if (score > 0) {
    candidates.push({ file, src, score });
  }
}

candidates.sort((a, b) => b.score - a.score);

if (!candidates.length) {
  throw new Error(
    "components/home에서 실제 하단 네비 후보를 찾지 못했습니다."
  );
}

console.log("");
console.log("=== 하단 네비 후보 ===");

for (const c of candidates) {
  console.log(`[${c.score}] ${c.file}`);
}

const target = candidates[0];

console.log("");
console.log("[SELECTED]", target.file);

let src = target.src.replace(/\r\n/g, "\n");
const original = src;

/* ---------------------------------------------------------
   3-A. 배열형 네비
   예:
   { href: "/maker", label: "커스텀", icon: ... }
--------------------------------------------------------- */

let patched = false;

const labelMatch =
  /label\s*:\s*["']커스텀["']/g.exec(src);

if (labelMatch) {
  const pos = labelMatch.index;

  /*
    해당 객체의 가장 가까운 { } 범위를 잡음.
    일반적인 단순 네비 객체용.
  */
  const objectStart = src.lastIndexOf("{", pos);
  const objectEnd = src.indexOf("}", pos);

  if (objectStart >= 0 && objectEnd > pos) {
    let block = src.slice(objectStart, objectEnd + 1);

    if (
      /href\s*:|path\s*:|route\s*:/.test(block)
    ) {
      block = block.replace(
        /label\s*:\s*["']커스텀["']/,
        'label: "기타"'
      );

      block = block.replace(
        /href\s*:\s*["'][^"']*["']/,
        'href: "/extra"'
      );

      block = block.replace(
        /path\s*:\s*["'][^"']*["']/,
        'path: "/extra"'
      );

      block = block.replace(
        /route\s*:\s*["'][^"']*["']/,
        'route: "/extra"'
      );

      /*
        id/key가 custom/maker일 경우 extra로 변경.
        아이콘은 그대로 둔다.
        → 기존처럼 아이콘 위 / 글자 아래 형태 유지.
      */
      block = block.replace(
        /\bid\s*:\s*["'](?:custom|maker)["']/,
        'id: "extra"'
      );

      block = block.replace(
        /\bkey\s*:\s*["'](?:custom|maker)["']/,
        'key: "extra"'
      );

      src =
        src.slice(0, objectStart) +
        block +
        src.slice(objectEnd + 1);

      patched = true;

      console.log("[PATCH] 배열형 하단 네비");
      console.log(block);
    }
  }
}

/* ---------------------------------------------------------
   3-B. JSX Link형 네비
   예:
   <Link href="/maker"> ... 커스텀 ... </Link>
--------------------------------------------------------- */

if (!patched) {
  const linkRegex =
    /<Link\b[\s\S]*?<\/Link>/g;

  const links = [...src.matchAll(linkRegex)];

  const customLink = links.find((m) =>
    m[0].includes("커스텀")
  );

  if (customLink && customLink.index != null) {
    let block = customLink[0];

    block = block.replace(
      /href\s*=\s*["'][^"']*["']/,
      'href="/extra"'
    );

    block = block.replace(
      />\s*커스텀\s*</g,
      ">기타<"
    );

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

    patched = true;

    console.log("[PATCH] JSX Link형 하단 네비");
  }
}

if (!patched) {
  console.log("");
  console.log("=== 커스텀 주변 코드 ===");

  const p = src.indexOf("커스텀");

  console.log(
    src.slice(
      Math.max(0, p - 700),
      Math.min(src.length, p + 700)
    )
  );

  throw new Error(
    "실제 커스텀 버튼 구조를 자동 수정하지 못했습니다."
  );
}

if (src === original) {
  throw new Error("변경 내용이 없습니다.");
}

/* 백업 */
const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

fs.copyFileSync(
  target.file,
  `${target.file}.before-extra-bottom-nav-${stamp}.bak`
);

fs.writeFileSync(
  target.file,
  src,
  "utf8"
);

console.log("");
console.log("[PATCHED]", target.file);
console.log("");
console.log("하단 네비:");
console.log("홈 / 스토리 / 카드 / 휴대폰 / 기타");
console.log("기타 링크: /extra");
console.log("기존 아이콘 배치는 유지");
