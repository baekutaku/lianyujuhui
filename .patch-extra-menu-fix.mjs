import fs from "node:fs";

function patchLayout() {
  const file = "app/layout.tsx";
  let src = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

  if (src.includes('href="/extra"')) {
    console.log("[SKIP] layout: 기타 메뉴 이미 있음");
    return;
  }

  const phonePos = src.indexOf('href="/phone-items"');

  if (phonePos < 0) {
    throw new Error("layout.tsx에서 /phone-items 링크를 찾지 못했습니다.");
  }

  const linkEnd = src.indexOf("</Link>", phonePos);

  if (linkEnd < 0) {
    throw new Error("layout.tsx 휴대폰 Link 끝을 찾지 못했습니다.");
  }

  const insertPos = linkEnd + "</Link>".length;

  const extra = `
                    <Link href="/extra" className="nav-link">
                      기타
                    </Link>`;

  src =
    src.slice(0, insertPos) +
    extra +
    src.slice(insertPos);

  fs.writeFileSync(file, src, "utf8");
  console.log("[PATCHED] app/layout.tsx -> 기타");
}

function patchMobile() {
  const file = "components/FloatingMobileMenu.tsx";
  let src = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

  if (
    src.includes('href: "/extra"') ||
    src.includes("href: '/extra'")
  ) {
    console.log("[SKIP] mobile: 기타 메뉴 이미 있음");
    return;
  }

  const lines = src.split("\n");

  const index = lines.findIndex(
    (line) =>
      line.includes("/phone-items") &&
      line.includes("href")
  );

  if (index < 0) {
    throw new Error(
      "FloatingMobileMenu.tsx에서 /phone-items 항목을 찾지 못했습니다."
    );
  }

  const indent =
    lines[index].match(/^\s*/)?.[0] ?? "  ";

  lines.splice(
    index + 1,
    0,
    `${indent}{ href: "/extra", label: "기타" },`
  );

  src = lines.join("\n");

  fs.writeFileSync(file, src, "utf8");
  console.log("[PATCHED] FloatingMobileMenu.tsx -> 기타");
}

patchLayout();
patchMobile();

console.log("");
console.log("=== EXTRA MENU FIX COMPLETE ===");
