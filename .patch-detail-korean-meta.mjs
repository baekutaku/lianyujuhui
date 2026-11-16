import fs from "node:fs";

const storyFile = "app/stories/[slug]/page.tsx";
const eventFile = "app/events/[slug]/page.tsx";

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

/* =========================================================
   STORY DETAIL
========================================================= */

let story = fs.readFileSync(storyFile, "utf8");

if (!story.includes("const STORY_SUBTYPE_LABEL_MAP")) {
  const anchor = `function toSingleString(value: SearchParamValue) {`;

  if (!story.includes(anchor)) {
    fail("스토리 helper 삽입 위치를 찾지 못했습니다.");
  }

  const helper = `const STORY_SUBTYPE_LABEL_MAP: Record<string, string> = {
  main_story: "메인스토리",
  behind_story: "막후의 장",
  card_story: "데이트",
  asmr: "너의 곁에",
  side_story: "외전",
  xiyue_story: "서월국",
  myhome_story: "마이홈",
  company_project: "촬영장 / 회사 프로젝트",
};

function getStorySubtypeLabel(
  subtype: string | null | undefined
) {
  if (!subtype) return "미분류";
  return STORY_SUBTYPE_LABEL_MAP[subtype] ?? subtype;
}

`;

  story = story.replace(anchor, helper + anchor);

  console.log("[PATCHED] story subtype label helper");
}

/* 유형: main_story → 메인스토리 */
story = story.replace(
  /<span className="meta-pill">유형:\s*\{story\.subtype\s*\?\?\s*"미분류"\}<\/span>/,
  `<span className="meta-pill">
          {getStorySubtypeLabel(story.subtype)}
        </span>`
);

/* 연도: 2026 → 2026 */
story = story.replace(
  /<span className="meta-pill">연도:\s*\{story\.release_year\s*\?\?\s*"미정"\}<\/span>/,
  `{story.release_year ? (
          <span className="meta-pill">
            {story.release_year}
          </span>
        ) : null}`
);

/* 상세페이지의 정렬: 최신순 칩 제거 */
story = story.replace(
  /\s*<span className="meta-pill">\s*정렬:\s*\{SORT_LABEL_MAP\[sort\]\s*\?\?\s*"최신순"\}\s*<\/span>/,
  ""
);

fs.writeFileSync(storyFile, story, "utf8");

console.log("[PATCHED] story detail meta");

/* =========================================================
   EVENT DETAIL
========================================================= */

let event = fs.readFileSync(eventFile, "utf8");

if (!event.includes("const EVENT_SUBTYPE_LABEL_MAP")) {
  const anchor = `function ProtectedEventGate({`;

  if (!event.includes(anchor)) {
    fail("이벤트 helper 삽입 위치를 찾지 못했습니다.");
  }

  const helper = `const EVENT_SUBTYPE_LABEL_MAP: Record<string, string> = {
  birthday_baiqi: "캐릭터 생일",
  birthday_mc: "유저 생일",
  anniversary_event: "N주년",
  seasonal_event: "시즌 이벤트",
  return_event: "복귀 이벤트",
  game_event: "게임 이벤트",
  collaboration_event: "콜라보",
};

function getEventSubtypeLabel(
  subtype: string | null | undefined
) {
  if (!subtype) return "이벤트";
  return EVENT_SUBTYPE_LABEL_MAP[subtype] ?? subtype;
}

`;

  event = event.replace(anchor, helper + anchor);

  console.log("[PATCHED] event subtype label helper");
}

/*
  기존:
  type: anniversary_event
  year: 2026
  start: 2026-...
  end: 2026-...

  변경:
  N주년
  2026
  2026-... ~ 2026-...
*/

const eventMetaRegex =
  /<span className="meta-pill">type:\s*\{event\.subtype\}<\/span>\s*<span className="meta-pill">year:\s*\{event\.release_year\}<\/span>\s*\{event\.start_date\s*\?\s*<span className="meta-pill">start:\s*\{event\.start_date\}<\/span>\s*:\s*null\}\s*\{event\.end_date\s*\?\s*<span className="meta-pill">end:\s*\{event\.end_date\}<\/span>\s*:\s*null\}/;

if (!eventMetaRegex.test(event)) {
  fail("이벤트 기존 meta 영역을 찾지 못했습니다.");
}

event = event.replace(
  eventMetaRegex,
  `<span className="meta-pill">
                {getEventSubtypeLabel(event.subtype)}
              </span>

              {event.release_year ? (
                <span className="meta-pill">
                  {event.release_year}
                </span>
              ) : null}

              {event.start_date ? (
                <span className="meta-pill">
                  {event.end_date
                    ? \`\${event.start_date} ~ \${event.end_date}\`
                    : event.start_date}
                </span>
              ) : null}`
);

fs.writeFileSync(eventFile, event, "utf8");

console.log("[PATCHED] event detail meta");

console.log("");
console.log("=== DETAIL META CLEANUP COMPLETE ===");
console.log("스토리: 메인스토리 · 2026");
console.log("이벤트: 한국어 유형 · 2026 · 날짜 범위");
console.log("raw subtype/type/year/start/end 제거");
