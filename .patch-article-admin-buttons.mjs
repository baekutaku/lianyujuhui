import fs from "node:fs";

const file = "app/phone-items/articles/page.tsx";

let src = fs.readFileSync(file, "utf8");

/* 1. isAdmin import */
if (!src.includes('from "@/lib/utils/admin-auth"')) {
  const anchor =
    'import { supabase } from "@/lib/supabase/server";';

  if (!src.includes(anchor)) {
    console.error("[ERROR] supabase import를 찾지 못했습니다.");
    process.exit(1);
  }

  src = src.replace(
    anchor,
    `${anchor}
import { isAdmin } from "@/lib/utils/admin-auth";`
  );

  console.log("[PATCHED] isAdmin import");
}

/* 2. 관리자 여부 + 상단 버튼 */
const functionAnchor =
  `export default async function PhoneArticlesPage() {`;

if (!src.includes("const admin = await isAdmin();")) {
  if (!src.includes(functionAnchor)) {
    console.error("[ERROR] PhoneArticlesPage를 찾지 못했습니다.");
    process.exit(1);
  }

  src = src.replace(
    functionAnchor,
`${functionAnchor}
  const admin = await isAdmin();

  const adminSlot = admin ? (
    <div className="history-top-admin">
      <Link
        href="/admin/phone-items/new?subtype=article"
        className="history-top-admin-btn"
        aria-label="기사 추가"
        title="기사 추가"
      >
        <span className="material-symbols-rounded">
          add
        </span>
      </Link>

      <Link
        href="/admin/phone-items"
        className="history-top-admin-btn"
        aria-label="휴대폰 관리"
        title="휴대폰 관리"
      >
        <span className="material-symbols-rounded">
          settings
        </span>
      </Link>
    </div>
  ) : null;
`
  );

  console.log("[PATCHED] article admin slot");
}

/* 3. PhoneTopBar rightSlot 연결 */
const oldTopBar =
  '<PhoneTopBar title="핫이슈" subtitle="뉴스 목록" />';

const newTopBar = `<PhoneTopBar
          title="핫이슈"
          subtitle="뉴스 목록"
          rightSlot={adminSlot}
        />`;

if (src.includes(oldTopBar)) {
  src = src.replace(oldTopBar, newTopBar);

  console.log("[PATCHED] PhoneTopBar admin buttons");
} else if (src.includes("rightSlot={adminSlot}")) {
  console.log("[SKIP] PhoneTopBar already patched");
} else {
  console.error("[ERROR] 핫이슈 PhoneTopBar를 찾지 못했습니다.");
  process.exit(1);
}

fs.writeFileSync(file, src, "utf8");

console.log("");
console.log("=== ARTICLE ADMIN BUTTONS COMPLETE ===");
console.log("+ : 새 기사 등록");
console.log("설정 : 휴대폰 관리");
console.log("비관리자에게는 표시되지 않음");
