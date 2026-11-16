import fs from "node:fs";

const file =
  "components/admin/phone-items/PhoneItemForm.tsx";

let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
src = src.replace(/\r\n/g, "\n");

const oldBlock = `const isMaleLeadMoment = CHARACTER_OPTIONS.some(
  (item) => item.key === momentAuthorKey
);
const isMcMoment = momentAuthorKey === "mc";
const isNpcMoment = !isMaleLeadMoment && !isMcMoment;`;

const newBlock = `const isMcMoment = momentAuthorKey === "mc";

const isNpcMoment =
  momentAuthorKey === "other" ||
  momentAuthorKey === "npc";

const isMaleLeadMoment =
  !isMcMoment &&
  !isNpcMoment &&
  CHARACTER_OPTIONS.some(
    (item) => item.key === momentAuthorKey
  );`;

if (!src.includes(oldBlock)) {
  console.error("[ERROR] 기존 moment 작성자 판정 코드를 찾지 못했습니다.");
  process.exit(1);
}

src = src.replace(oldBlock, newBlock);

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("[OK] NPC/기타 작성자 판정 수정");
console.log("- other/npc => NPC");
console.log("- mc => 유연");
console.log("- 나머지 캐릭터 => 남주");
