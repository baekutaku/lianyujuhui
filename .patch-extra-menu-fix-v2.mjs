import fs from "node:fs";

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function write(file, src) {
  fs.writeFileSync(file, src, "utf8");
}

/* =========================================================
   DESKTOP SIDEBAR
========================================================= */

function patchLayout() {
  const file = "app/layout.tsx";
  let src = read(file);

  if (
    src.includes('href="/extra"') ||
    src.includes("href='/extra'")
  ) {
    console.log("[SKIP] app/layout.tsx: 기타 이미 있음");
    return;
  }

  const navRegex =
    /<nav\b[^>]*className="([^"]*\bsidebar-nav\b[^"]*)"[^>]*>[\s\S]*?<\/nav>/g;

  const matches = [...src.matchAll(navRegex)];

  const publicNav = matches.find(
    (match) =>
      !String(match[1] || "").includes("sidebar-admin-nav")
  );

  if (!publicNav || publicNav.index == null) {
    console.log("[WARN] public sidebar-nav를 찾지 못했습니다.");
    console.log("");
    console.log("=== layout.tsx nav 관련 줄 ===");

    src.split("\n").forEach((line, index) => {
      if (
        line.includes("<nav") ||
        line.includes("nav-link") ||
        line.includes("</nav>")
      ) {
        console.log(
          `${index + 1}: ${line.trim()}`
        );
      }
    });

    return;
  }

  const block = publicNav[0];
  const closePos = block.lastIndexOf("</nav>");

  const extraLink = `
                    <Link href="/extra" className="nav-link">
                      기타
                    </Link>
`;

  const nextBlock =
    block.slice(0, closePos) +
    extraLink +
    block.slice(closePos);

  src =
    src.slice(0, publicNav.index) +
    nextBlock +
    src.slice(publicNav.index + block.length);

  write(file, src);

  console.log("[PATCHED] app/layout.tsx -> 기타");
}

/* =========================================================
   MOBILE MENU
========================================================= */

function patchMobile() {
  const file =
    "components/FloatingMobileMenu.tsx";

  let src = read(file);

  if (
    src.includes('href: "/extra"') ||
    src.includes("href: '/extra'")
  ) {
    console.log(
      "[SKIP] FloatingMobileMenu: 기타 이미 있음"
    );
    return;
  }

  const start = src.indexOf(
    "const MENU_ITEMS = ["
  );

  if (start < 0) {
    console.log(
      "[WARN] MENU_ITEMS 시작을 찾지 못했습니다."
    );
    return;
  }

  const end = src.indexOf(
    "];",
    start
  );

  if (end < 0) {
    console.log(
      "[WARN] MENU_ITEMS 끝을 찾지 못했습니다."
    );
    return;
  }

  const before = src.slice(0, start);
  let block = src.slice(start, end);
  const after = src.slice(end);

  const lines = block.split("\n");

  let insertIndex =
    lines.findIndex(
      (line) =>
        line.includes('href: "/admin"') ||
        line.includes("href: '/admin'")
    );

  if (insertIndex < 0) {
    insertIndex = lines.length;
  }

  lines.splice(
    insertIndex,
    0,
    '  { href: "/extra", label: "기타" },'
  );

  block = lines.join("\n");

  src = before + block + after;

  write(file, src);

  console.log(
    "[PATCHED] FloatingMobileMenu.tsx -> 기타"
  );
}

patchLayout();
patchMobile();

console.log("");
console.log("=== EXTRA MENU FIX V2 COMPLETE ===");
