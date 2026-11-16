import fs from "node:fs";
import path from "node:path";

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, {
    withFileTypes: true
  })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next"
    ) continue;

    const full = path.join(dir, entry.name);

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

const files = [
  ...walk("app"),
  ...walk("components")
];

const candidates = files.filter((file) => {
  const src = fs.readFileSync(file, "utf8");

  return (
    src.includes("홈") &&
    src.includes("스토리") &&
    src.includes("카드") &&
    src.includes("휴대폰") &&
    src.includes("커스텀")
  );
});

if (candidates.length === 0) {
  throw new Error(
    "하단 네비 후보 파일을 찾지 못했습니다."
  );
}

console.log("=== 후보 ===");
candidates.forEach((file) =>
  console.log(file)
);

let patched = false;

for (const file of candidates) {
  let src = fs
    .readFileSync(file, "utf8")
    .replace(/\r\n/g, "\n");

  /*
    label: "커스텀"이 들어 있는 객체를 찾는다.
  */
  const objectRegex =
    /\{[^{}]{0,1000}label\s*:\s*["']커스텀["'][^{}]{0,1000}\}/gs;

  const match = src.match(objectRegex);

  if (!match?.length) continue;

  let block = match[0];

  console.log("");
  console.log("[FOUND]", file);
  console.log(block);

  /* 백업 */
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  fs.copyFileSync(
    file,
    `${file}.before-extra-bottom-nav-${stamp}.bak`
  );

  /* 라벨 */
  block = block.replace(
    /label\s*:\s*["']커스텀["']/,
    'label: "기타"'
  );

  /* href */
  if (/href\s*:/.test(block)) {
    block = block.replace(
      /href\s*:\s*["'][^"']*["']/,
      'href: "/extra"'
    );
  }

  /* path / route 형태일 경우 */
  if (/path\s*:/.test(block)) {
    block = block.replace(
      /path\s*:\s*["'][^"']*["']/,
      'path: "/extra"'
    );
  }

  if (/route\s*:/.test(block)) {
    block = block.replace(
      /route\s*:\s*["'][^"']*["']/,
      'route: "/extra"'
    );
  }

  /* key/id가 custom이면 extra로 */
  block = block.replace(
    /\bkey\s*:\s*["']custom["']/,
    'key: "extra"'
  );

  block = block.replace(
    /\bid\s*:\s*["']custom["']/,
    'id: "extra"'
  );

  /*
    Material Symbols 계열 아이콘이면
    커스텀 연필 → 기타 점 3개
  */
  block = block.replace(
    /\bicon\s*:\s*["'](?:edit|edit_square|edit_note|draw|stylus)["']/,
    'icon: "more_horiz"'
  );

  src = src.replace(match[0], block);

  fs.writeFileSync(file, src, "utf8");

  console.log("[PATCHED]", file);
  console.log("커스텀 → 기타");
  console.log("링크 → /extra");

  patched = true;
  break;
}

if (!patched) {
  throw new Error(
    "후보 파일은 찾았지만 커스텀 네비 객체를 찾지 못했습니다."
  );
}

console.log("");
console.log("=== BOTTOM NAV EXTRA COMPLETE ===");
