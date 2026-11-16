import fs from "node:fs";

const file = "app/stories/page.tsx";

let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
src = src.replace(/\r\n/g, "\n");

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

const regex =
  /<nav\s+className="story-pagination"\s+aria-label="이벤트 페이지 이동">[\s\S]*?<\/nav>/;

if (!regex.test(src)) {
  fail("기존 이벤트 story-pagination 블록을 찾지 못했습니다.");
}

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
                            value={
                              characterKey
                            }
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

src = src.replace(regex, replacement);

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("[OK] 이벤트 페이지네이션 UI 교체");
console.log("- story-pagination -> cards-pagination");
console.log("- 직접 페이지 번호 입력 추가");
console.log("- 이벤트 하위분류/검색/연도/캐릭터/정렬 유지");
