import fs from "node:fs";

/* 1. PC 왼쪽 네비: 기타 -> 원래 커스텀으로 복구 */
{
  const file = "app/layout.tsx";
  let src = fs.readFileSync(file, "utf8");

  src = src.replace(
    '{ href: "/extra", label: "기타", icon: "edit_square" },',
    '{ href: "/maker", label: "커스텀", icon: "edit_square" },'
  );

  fs.writeFileSync(file, src, "utf8");
  console.log("[OK] PC 왼쪽: 커스텀 복구");
}

/* 2. 하단 네비: 커스텀 자리를 기타로 교체 + 잘못 추가된 기타 삭제 */
{
  const file = "components/FloatingMobileMenu.tsx";
  let src = fs.readFileSync(file, "utf8");

  src = src.replace(
    '{ href: "/maker", label: "커스텀", icon: "edit_square" },',
    '{ href: "/extra", label: "기타", icon: "edit_square" },'
  );

  /* 아이콘 없이 따로 추가됐던 잘못된 기타 제거 */
  src = src.replace(
    /^\s*\{\s*href:\s*"\/extra",\s*label:\s*"기타"\s*\},\s*\r?\n/gm,
    ""
  );

  /*
    위 제거가 교체한 정상 항목까지 잡지 않도록
    icon 있는 항목은 정규식 대상이 아님.
  */

  fs.writeFileSync(file, src, "utf8");
  console.log("[OK] 하단: 커스텀 -> 기타");
  console.log("[OK] 중복 기타 제거");
}

console.log("");
console.log("PC 왼쪽 : 홈 / 스토리 / 카드 / 휴대폰 / 커스텀");
console.log("하단     : 홈 / 스토리 / 카드 / 휴대폰 / 기타");
