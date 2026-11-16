import fs from "node:fs";

const file = "components/FloatingMobileMenu.tsx";

let src = fs
  .readFileSync(file, "utf8")
  .replace(/\r\n/g, "\n");

if (
  src.includes('href: "/extra"') ||
  src.includes("href: '/extra'")
) {
  console.log("[SKIP] 모바일 기타 메뉴 이미 있음");
  process.exit(0);
}

const lines = src.split("\n");

const menuStart = lines.findIndex((line) =>
  line.includes("MENU_ITEMS")
);

const functionStart = lines.findIndex((line) =>
  line.includes(
    "export default function FloatingMobileMenu"
  )
);

if (menuStart < 0) {
  throw new Error("MENU_ITEMS를 찾지 못했습니다.");
}

if (functionStart < 0) {
  throw new Error(
    "FloatingMobileMenu 함수를 찾지 못했습니다."
  );
}

/*
  MENU_ITEMS 시작과 컴포넌트 함수 사이에서
  마지막으로 ] 로 시작하는 줄을 배열 끝으로 판단.
  ];
  ] as const;
  ] satisfies ...
  전부 대응.
*/
let arrayEnd = -1;

for (
  let i = functionStart - 1;
  i > menuStart;
  i--
) {
  if (lines[i].trim().startsWith("]")) {
    arrayEnd = i;
    break;
  }
}

if (arrayEnd < 0) {
  console.log("=== MENU_ITEMS 주변 ===");

  for (
    let i = menuStart;
    i < Math.min(functionStart, menuStart + 30);
    i++
  ) {
    console.log(`${i + 1}: ${lines[i]}`);
  }

  throw new Error(
    "MENU_ITEMS 배열 끝을 찾지 못했습니다."
  );
}

const indent =
  lines[arrayEnd - 1]?.match(/^\s*/)?.[0] ??
  "  ";

lines.splice(
  arrayEnd,
  0,
  `${indent}{ href: "/extra", label: "기타" },`
);

fs.writeFileSync(
  file,
  lines.join("\n"),
  "utf8"
);

console.log(
  "[PATCHED] FloatingMobileMenu.tsx -> 기타"
);
