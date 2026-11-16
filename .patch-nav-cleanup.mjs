import fs from "node:fs";

/* =========================================================
   1. app/layout.tsx 에 잘못 추가한 기타 제거
========================================================= */

{
  const file = "app/layout.tsx";
  let src = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

  const before = src;

  src = src.replace(
    /\s*<Link\s+href="\/extra"\s+className="nav-link">\s*기타\s*<\/Link>/g,
    ""
  );

  if (src !== before) {
    fs.writeFileSync(file, src, "utf8");
    console.log("[REMOVED] app/layout.tsx 사이드 네비 기타");
  } else {
    console.log("[SKIP] app/layout.tsx 사이드 네비 기타 없음");
  }
}

/* =========================================================
   2. HomeLobby 하단 네비
   커스텀 -> 기타
   링크 -> /extra
   아이콘은 그대로 유지
========================================================= */

{
  const file = "components/home/HomeLobby.tsx";

  let src = fs
    .readFileSync(file, "utf8")
    .replace(/\r\n/g, "\n");

  const original = src;
  const pos = src.indexOf("커스텀");

  if (pos < 0) {
    throw new Error("HomeLobby.tsx에서 '커스텀'을 찾지 못했습니다.");
  }

  let changed = false;

  /* -------------------------------------------------------
     A. <Link> ... 커스텀 ... </Link>
  ------------------------------------------------------- */

  const linkStart = src.lastIndexOf("<Link", pos);
  const linkEnd = src.indexOf("</Link>", pos);

  if (
    linkStart >= 0 &&
    linkEnd > pos &&
    linkEnd - linkStart < 3000
  ) {
    const oldBlock = src.slice(
      linkStart,
      linkEnd + "</Link>".length
    );

    let block = oldBlock;

    block = block.replace(
      /href\s*=\s*["'][^"']*["']/,
      'href="/extra"'
    );

    block = block.replace(
      /커스텀/g,
      "기타"
    );

    if (block !== oldBlock) {
      src =
        src.slice(0, linkStart) +
        block +
        src.slice(linkEnd + "</Link>".length);

      changed = true;

      console.log("[PATCHED] HomeLobby Link형 하단 네비");
    }
  }

  /* -------------------------------------------------------
     B. 배열 객체형
     { href: "...", label: "커스텀", icon: ... }
  ------------------------------------------------------- */

  if (!changed) {
    const objectStart = src.lastIndexOf("{", pos);
    const objectEnd = src.indexOf("}", pos);

    if (
      objectStart >= 0 &&
      objectEnd > pos &&
      objectEnd - objectStart < 1500
    ) {
      const oldBlock = src.slice(
        objectStart,
        objectEnd + 1
      );

      let block = oldBlock;

      block = block.replace(
        /label\s*:\s*["']커스텀["']/,
        'label: "기타"'
      );

      block = block.replace(
        /title\s*:\s*["']커스텀["']/,
        'title: "기타"'
      );

      block = block.replace(
        /href\s*:\s*["'][^"']*["']/,
        'href: "/extra"'
      );

      block = block.replace(
        /path\s*:\s*["'][^"']*["']/,
        'path: "/extra"'
      );

      if (block !== oldBlock) {
        src =
          src.slice(0, objectStart) +
          block +
          src.slice(objectEnd + 1);

        changed = true;

        console.log("[PATCHED] HomeLobby 객체형 하단 네비");
      }
    }
  }

  /* -------------------------------------------------------
     C. button + router.push
  ------------------------------------------------------- */

  if (!changed) {
    const buttonStart = src.lastIndexOf(
      "<button",
      pos
    );

    const buttonEnd = src.indexOf(
      "</button>",
      pos
    );

    if (
      buttonStart >= 0 &&
      buttonEnd > pos &&
      buttonEnd - buttonStart < 3000
    ) {
      const oldBlock = src.slice(
        buttonStart,
        buttonEnd + "</button>".length
      );

      let block = oldBlock;

      block = block.replace(
        /router\.push\(\s*["'][^"']*["']\s*\)/g,
        'router.push("/extra")'
      );

      block = block.replace(
        /window\.location\.href\s*=\s*["'][^"']*["']/g,
        'window.location.href = "/extra"'
      );

      block = block.replace(
        /커스텀/g,
        "기타"
      );

      if (block !== oldBlock) {
        src =
          src.slice(0, buttonStart) +
          block +
          src.slice(buttonEnd + "</button>".length);

        changed = true;

        console.log("[PATCHED] HomeLobby button형 하단 네비");
      }
    }
  }

  if (!changed) {
    console.log("");
    console.log("=== HomeLobby 커스텀 주변 ===");
    console.log(
      src.slice(
        Math.max(0, pos - 1200),
        Math.min(src.length, pos + 1200)
      )
    );

    throw new Error(
      "HomeLobby 하단 커스텀 버튼 구조를 자동 수정하지 못했습니다."
    );
  }

  fs.writeFileSync(
    file,
    src,
    "utf8"
  );

  console.log("");
  console.log("HomeLobby 하단:");
  console.log("홈 / 스토리 / 카드 / 휴대폰 / 기타");
  console.log("기타 -> /extra");
  console.log("아이콘은 기존 것 유지");
}

console.log("");
console.log("=== NAV CLEANUP COMPLETE ===");
