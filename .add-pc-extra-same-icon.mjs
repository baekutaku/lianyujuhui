import fs from "node:fs";

const mobileFile = "components/FloatingMobileMenu.tsx";
const layoutFile = "app/layout.tsx";

const mobile = fs.readFileSync(mobileFile, "utf8");
let layout = fs.readFileSync(layoutFile, "utf8");

/* 모바일 기타 항목에서 실제 사용 중인 icon 추출 */
const extraMatch = mobile.match(
  /\{\s*href:\s*["']\/extra["']\s*,\s*label:\s*["']기타["']\s*,\s*icon:\s*["']([^"']+)["']\s*\}/
);

if (!extraMatch) {
  throw new Error(
    "FloatingMobileMenu.tsx에서 모바일 '기타' 아이콘을 찾지 못했습니다."
  );
}

const extraIcon = extraMatch[1];

console.log(`[FOUND] 모바일 기타 아이콘: ${extraIcon}`);

/* PC에 이미 기타가 있으면 아이콘만 모바일과 동일하게 맞춤 */
const existingExtra =
  /\{\s*href:\s*["']\/extra["']\s*,\s*label:\s*["']기타["']\s*,\s*icon:\s*["'][^"']+["']\s*\}/;

if (existingExtra.test(layout)) {
  layout = layout.replace(
    existingExtra,
    `{ href: "/extra", label: "기타", icon: "${extraIcon}" }`
  );

  fs.writeFileSync(layoutFile, layout, "utf8");

  console.log("[OK] PC 기타 아이콘을 모바일과 동일하게 변경");
  process.exit(0);
}

/* PC의 기존 커스텀 항목은 손대지 않고 바로 아래 기타 추가 */
const customLine =
  /\{\s*href:\s*["']\/maker["']\s*,\s*label:\s*["']커스텀["']\s*,\s*icon:\s*["'][^"']+["']\s*\},?/;

const match = layout.match(customLine);

if (!match) {
  throw new Error(
    "app/layout.tsx에서 기존 커스텀 네비 항목을 찾지 못했습니다."
  );
}

layout = layout.replace(
  match[0],
  `${match[0]}\n  { href: "/extra", label: "기타", icon: "${extraIcon}" },`
);

fs.writeFileSync(layoutFile, layout, "utf8");

console.log("[OK] PC 커스텀 아래 기타 추가");
console.log(`[OK] 기타 아이콘: ${extraIcon}`);
console.log("[OK] 기존 네비 아이콘은 변경하지 않음");
