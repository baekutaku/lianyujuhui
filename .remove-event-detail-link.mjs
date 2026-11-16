import fs from "node:fs";

const file = "app/events/page.tsx";

let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
src = src.replace(/\r\n/g, "\n");

const before = src;

src = src.replace(
  /\s*<div className="story-list-footer">\s*<span className="mini-button">상세 보기<\/span>\s*<\/div>/g,
  ""
);

src = src.replace(
  /\s*<span className="mini-button">상세 보기<\/span>/g,
  ""
);

if (src === before) {
  console.error("[ERROR] 상세 보기 JSX를 찾지 못했습니다.");
  process.exit(1);
}

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("[OK] app/events/page.tsx 상세 보기 제거");
