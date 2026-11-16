import fs from "node:fs";

const file =
  "components/admin/relations/RelationPicker.tsx";

let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
src = src.replace(/\r\n/g, "\n");

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

if (src.includes('aria-label={`추가: ${item.title}`}')) {
  console.log("[SKIP] 이미 카드 전체 클릭 패치가 적용되어 있습니다.");
  process.exit(0);
}

/* 검색 결과 카드에 전체 클릭 추가 */
const oldCard = `<div
            key={getCandidateKey(item)}
            className="link-card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >`;

const newCard = `<div
            key={getCandidateKey(item)}
            className="link-card relation-picker-candidate"
            role="button"
            tabIndex={0}
            aria-label={\`추가: \${item.title}\`}
            onClick={() => addItem(item)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                event.preventDefault();
                addItem(item);
              }
            }}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
            }}
          >`;

if (!src.includes(oldCard)) {
  fail("검색 결과 relation card JSX를 찾지 못했습니다.");
}

src = src.replace(oldCard, newCard);

/* 추가 버튼 클릭 시 부모까지 중복 클릭되지 않게 */
const oldButton =
`onClick={() => addItem(item)}
            >
              추가`;

const newButton =
`onClick={(event) => {
                event.stopPropagation();
                addItem(item);
              }}
            >
              추가`;

if (!src.includes(oldButton)) {
  fail("추가 버튼 onClick을 찾지 못했습니다.");
}

src = src.replace(oldButton, newButton);

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("[OK] RelationPicker 카드 전체 클릭 추가");
console.log("- 카드/스토리/이벤트/휴대폰 공통 적용");
console.log("- Enter / Space 키 선택 가능");
console.log("- 기존 추가 버튼 유지");
