import fs from "node:fs";

const file = "app/events/[slug]/page.tsx";

let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
src = src.replace(/\r\n/g, "\n");

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

/* ---------------------------------------------------------
   현재 잘못 삽입된 summary 블록 찾기
--------------------------------------------------------- */

const summaryStartMarker =
  '{event.summary ? (\n' +
  '          <aside className="event-topbar-summary">';

let summaryStart = src.indexOf(summaryStartMarker);

/* 들여쓰기가 조금 달라도 다시 탐색 */
if (summaryStart < 0) {
  summaryStart = src.indexOf('{event.summary ? (');

  if (
    summaryStart < 0 ||
    !src
      .slice(summaryStart, summaryStart + 500)
      .includes('className="event-topbar-summary"')
  ) {
    fail("event-topbar-summary 블록을 찾지 못했습니다.");
  }
}

const summaryEndMarker = ') : null}';
const summaryEnd = src.indexOf(summaryEndMarker, summaryStart);

if (summaryEnd < 0) {
  fail("summary 블록 끝을 찾지 못했습니다.");
}

const summaryEndExclusive =
  summaryEnd + summaryEndMarker.length;

/* summary 블록 제거 */
src =
  src.slice(0, summaryStart) +
  src.slice(summaryEndExclusive);

/* ---------------------------------------------------------
   hasConnections 조건문 바로 앞에 정상적으로 재삽입
--------------------------------------------------------- */

const connectionsMarker = '{hasConnections ? (';
const connectionsIndex = src.indexOf(connectionsMarker);

if (connectionsIndex < 0) {
  fail("hasConnections 조건문을 찾지 못했습니다.");
}

const summaryBlock = `{event.summary ? (
          <aside className="event-topbar-summary">
            <p className="event-topbar-summary-label">SUMMARY</p>
            <p className="event-topbar-summary-text">
              {event.summary}
            </p>
          </aside>
        ) : null}

        `;

src =
  src.slice(0, connectionsIndex) +
  summaryBlock +
  src.slice(connectionsIndex);

/* ---------------------------------------------------------
   저장
--------------------------------------------------------- */

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("[OK] summary JSX 구조 복구");
console.log("summary -> hasConnections 앞쪽 형제로 이동");
