import fs from "node:fs";

const file = "app/stories/page.tsx";

let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
src = src.replace(/\r\n/g, "\n");

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

/* 필요한 계산 코드가 이미 있는지 확인 */
for (const required of [
  "const eventTotalPages",
  "const eventCurrentPage",
  "const pagedEvents",
]) {
  if (!src.includes(required)) {
    fail(`필수 이벤트 페이지 계산 코드 없음: ${required}`);
  }
}

const anchor =
  'aria-label="이벤트 페이지 이동"';

const anchorIndex = src.indexOf(anchor);

if (anchorIndex < 0) {
  fail("이벤트 페이지 이동 nav를 찾지 못했습니다.");
}

const navStart = src.lastIndexOf(
  "<nav",
  anchorIndex
);

const navEndStart = src.indexOf(
  "</nav>",
  anchorIndex
);

if (navStart < 0 || navEndStart < 0) {
  fail("이벤트 nav 시작/끝을 찾지 못했습니다.");
}

const navEnd =
  navEndStart + "</nav>".length;

const oldBlock = src.slice(
  navStart,
  navEnd
);

console.log("=== 기존 이벤트 pagination 시작 ===");
console.log(oldBlock.slice(0, 300));
console.log("=== 기존 이벤트 pagination 끝 ===");

const replacement = `<nav
                    className="cards-pagination"
                    aria-label="이벤트 페이지 이동"
                  >
                    {eventCurrentPage === 1 ? (
                      <span className="cards-pagination-button is-disabled">
                        ←
                      </span>
                    ) : (
                      <Link
                        href={buildStoriesHref({
                          tab: "event",
                          sub:
                            sub !== "all"
                              ? sub
                              : undefined,
                          tag:
                            selectedTag ||
                            undefined,
                          q,
                          years:
                            selectedYears,
                          characters:
                            selectedCharacterKeys,
                          scope: "",
                          sort,
                          page:
                            eventCurrentPage - 1,
                        })}
                        className="cards-pagination-button"
                        aria-label="이전 페이지"
                      >
                        ←
                      </Link>
                    )}

                    <div className="cards-pagination-numbers">
                      {getVisiblePages(
                        eventTotalPages,
                        eventCurrentPage
                      ).map((pageNumber) => {
                        const isActive =
                          pageNumber ===
                          eventCurrentPage;

                        return (
                          <Link
                            key={pageNumber}
                            href={buildStoriesHref({
                              tab: "event",
                              sub:
                                sub !== "all"
                                  ? sub
                                  : undefined,
                              tag:
                                selectedTag ||
                                undefined,
                              q,
                              years:
                                selectedYears,
                              characters:
                                selectedCharacterKeys,
                              scope: "",
                              sort,
                              page:
                                pageNumber,
                            })}
                            className={
                              "cards-pagination-number" +
                              (isActive
                                ? " is-active"
                                : "")
                            }
                            aria-current={
                              isActive
                                ? "page"
                                : undefined
                            }
                          >
                            {pageNumber}
                          </Link>
                        );
                      })}
                    </div>

                    {eventCurrentPage ===
                    eventTotalPages ? (
                      <span className="cards-pagination-button is-disabled">
                        →
                      </span>
                    ) : (
                      <Link
                        href={buildStoriesHref({
                          tab: "event",
                          sub:
                            sub !== "all"
                              ? sub
                              : undefined,
                          tag:
                            selectedTag ||
                            undefined,
                          q,
                          years:
                            selectedYears,
                          characters:
                            selectedCharacterKeys,
                          scope: "",
                          sort,
                          page:
                            eventCurrentPage + 1,
                        })}
                        className="cards-pagination-button"
                        aria-label="다음 페이지"
                      >
                        →
                      </Link>
                    )}

                    <form
                      method="get"
                      action="/stories"
                      className="cards-page-jump"
                    >
                      <input
                        type="hidden"
                        name="tab"
                        value="event"
                      />

                      {sub !== "all" ? (
                        <input
                          type="hidden"
                          name="sub"
                          value={sub}
                        />
                      ) : null}

                      {selectedTag ? (
                        <input
                          type="hidden"
                          name="tag"
                          value={selectedTag}
                        />
                      ) : null}

                      {q ? (
                        <input
                          type="hidden"
                          name="q"
                          value={q}
                        />
                      ) : null}

                      {selectedYears.map(
                        (yearValue) => (
                          <input
                            key={
                              "event-jump-year-" +
                              yearValue
                            }
                            type="hidden"
                            name="year"
                            value={yearValue}
                          />
                        )
                      )}

                      {selectedCharacterKeys.map(
                        (characterKey) => (
                          <input
                            key={
                              "event-jump-character-" +
                              characterKey
                            }
                            type="hidden"
                            name="character"
                            value={characterKey}
                          />
                        )
                      )}

                      {sort ? (
                        <input
                          type="hidden"
                          name="sort"
                          value={sort}
                        />
                      ) : null}

                      <input
                        className="cards-page-jump-input"
                        type="number"
                        name="page"
                        min={1}
                        max={eventTotalPages}
                        defaultValue={
                          eventCurrentPage
                        }
                        aria-label="이동할 페이지 번호"
                      />

                      <button
                        type="submit"
                        className="cards-page-jump-button"
                      >
                        이동
                      </button>
                    </form>
                  </nav>`;

src =
  src.slice(0, navStart) +
  replacement +
  src.slice(navEnd);

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("");
console.log("[OK] 이벤트 페이지네이션 V3 교체 완료");
console.log("- cards-pagination");
console.log("- 카드와 동일한 숫자 UI");
console.log("- 페이지 번호 직접 입력");
console.log("- 필터 유지");
