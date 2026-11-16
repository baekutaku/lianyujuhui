import fs from "node:fs";

const file =
  "components/phone/moment/MomentFeedPost.tsx";

let src = fs.readFileSync(file, "utf8");

const replacements = [
  [
    'originalBackground="rgba(246, 243, 247, 0.86)"',
    'originalBackground="transparent"',
  ],
  [
    'originalBackground="rgba(255,255,255,0.55)"',
    'originalBackground="transparent"',
  ],
];

for (const [before, after] of replacements) {
  if (!src.includes(before)) {
    console.error("[ERROR] 찾지 못함:", before);
    process.exit(1);
  }

  src = src.replace(before, after);
}

fs.writeFileSync(file, src, "utf8");

console.log("[OK] 모멘트 원문 배경 투명화");
console.log("- 본문 원문: transparent");
console.log("- 답글 원문: transparent");
