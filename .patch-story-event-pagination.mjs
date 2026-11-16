import fs from "node:fs";

const file = "app/stories/page.tsx";

let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
src = src.replace(/\r\n/g, "\n");

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

/* =========================================================
   1. 이벤트 / 기념일 실제 페이지 분할
========================================================= */

const oldEventPaging = `const eventTotalCount = events.length;
const eventIds = events.map((event) => event.id);`;

const newEventPaging = `const eventTotalCount = events.length;
const eventTotalPages = Math.max(
  1,
  Math.ceil(eventTotalCount / STORIES_PER_PAGE)
);
const eventCurrentPage = Math.min(
  Math.max(pageRaw || 1, 1),
  eventTotalPages
);
const eventStartIndex =
  (eventCurrentPage - 1) * STORIES_PER_PAGE;

const pagedEvents = events.slice(
  eventStartIndex,
  eventStartIndex + STORIES_PER_PAGE
);

const eventVisiblePages = getVisiblePages(
  eventTotalPages,
  eventCurrentPage
);

const eventIds = pagedEvents.map((event) => event.id);`;

if (!src.includes(oldEventPaging)) {
  fail("이벤트 페이지 계산 위치를 찾지 못했습니다.");
}

src = src.replace(oldEventPaging, newEventPaging);

/* 전체 events 출력 → 현재 페이지 이벤트만 출력 */
if (!src.includes("{events.map((event) => {")) {
  fail("events.map 렌더링을 찾지 못했습니다.");
}

src = src.replace(
  "{events.map((event) => {",
  "{pagedEvents.map((event) => {"
);

/* =========================================================
   공통 page jump hidden fields
========================================================= */

const jumpFields = `
                <input
                  type="hidden"
                  name="tab"
                  value={activeTab.key}
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

                {selectedYears.map((yearValue) => (
                  <input
                    key={\`jump-year-\${yearValue}\`}
                    type="hidden"
                    name="year"
                    value={yearValue}
                  />
                ))}

                {selectedCharacterKeys.map(
                  (characterKey) => (
                    <input
                      key={\`jump-character-\${characterKey}\`}
                      type="hidden"
                      name="character"
                      value={characterKey}
                    />
                  )
                )}

                {scope ? (
                  <input
                    type="hidden"
                    name="scope"
                    value={scope}
                  />
                ) : null}

                {sort ? (
                  <input
                    type="hidden"
                    name="sort"
                    value={sort}
                  />
                ) : null}
`;

/* =========================================================
   2. 이벤트 목록 아래 카드형 페이지네이션 추가
========================================================= */

const eventListEnd = `            </ul>
          )}
        </div>

        <aside className="story-archive-sidebar">`;

if (!src.includes(eventListEnd)) {
  fail("이벤트 목록 끝 위치를 찾지 못했습니다.");
}

const eventPagination = `            </ul>
          )}

          {eventTotalPages > 1 ? (
            <nav
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
                    tab: activeTab.key,
                    sub:
                      sub !== "all"
                        ? sub
                        : undefined,
                    tag: selectedTag || undefined,
                    q,
                    years: selectedYears,
                    characters:
                      selectedCharacterKeys,
                    scope,
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
                {eventVisiblePages.map(
                  (pageNumber) => {
                    const isActive =
                      pageNumber ===
                      eventCurrentPage;

                    return (
                      <Link
                        key={pageNumber}
                        href={buildStoriesHref({
                          tab: activeTab.key,
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
                          scope,
                          sort,
                          page: pageNumber,
                        })}
                        className={\`cards-pagination-number\${isActive ? " is-active" : ""}\`}
                        aria-current={
                          isActive
                            ? "page"
                            : undefined
                        }
                      >
                        {pageNumber}
                      </Link>
                    );
                  }
                )}
              </div>

              {eventCurrentPage ===
              eventTotalPages ? (
                <span className="cards-pagination-button is-disabled">
                  →
                </span>
              ) : (
                <Link
                  href={buildStoriesHref({
                    tab: activeTab.key,
                    sub:
                      sub !== "all"
                        ? sub
                        : undefined,
                    tag: selectedTag || undefined,
                    q,
                    years: selectedYears,
                    characters:
                      selectedCharacterKeys,
                    scope,
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
${jumpFields}
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
            </nav>
          ) : null}
        </div>

        <aside className="story-archive-sidebar">`;

src = src.replace(
  eventListEnd,
  eventPagination
);

/* =========================================================
   3. 기존 스토리 pagination → 카드 pagination UI
========================================================= */

const storyPaginationRegex =
  /<nav className="story-pagination" aria-label="스토리 페이지 이동">[\s\S]*?<\/nav>/;

if (!storyPaginationRegex.test(src)) {
  fail("기존 story-pagination을 찾지 못했습니다.");
}

const storyPagination = `<nav
                  className="cards-pagination"
                  aria-label="스토리 페이지 이동"
                >
                  {currentPage === 1 ? (
                    <span className="cards-pagination-button is-disabled">
                      ←
                    </span>
                  ) : (
                    <Link
                      href={buildStoriesHref({
                        tab: activeTab.key,
                        sub:
                          sub !== "all"
                            ? sub
                            : undefined,
                        tag:
                          selectedTag ||
                          undefined,
                        q,
                        years: selectedYears,
                        characters:
                          selectedCharacterKeys,
                        scope,
                        sort,
                        page:
                          currentPage - 1,
                      })}
                      className="cards-pagination-button"
                      aria-label="이전 페이지"
                    >
                      ←
                    </Link>
                  )}

                  <div className="cards-pagination-numbers">
                    {visiblePages.map(
                      (pageNumber) => {
                        const isActive =
                          pageNumber ===
                          currentPage;

                        return (
                          <Link
                            key={pageNumber}
                            href={buildStoriesHref({
                              tab:
                                activeTab.key,
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
                              scope,
                              sort,
                              page:
                                pageNumber,
                            })}
                            className={\`cards-pagination-number\${isActive ? " is-active" : ""}\`}
                            aria-current={
                              isActive
                                ? "page"
                                : undefined
                            }
                          >
                            {pageNumber}
                          </Link>
                        );
                      }
                    )}
                  </div>

                  {currentPage ===
                  totalPages ? (
                    <span className="cards-pagination-button is-disabled">
                      →
                    </span>
                  ) : (
                    <Link
                      href={buildStoriesHref({
                        tab: activeTab.key,
                        sub:
                          sub !== "all"
                            ? sub
                            : undefined,
                        tag:
                          selectedTag ||
                          undefined,
                        q,
                        years: selectedYears,
                        characters:
                          selectedCharacterKeys,
                        scope,
                        sort,
                        page:
                          currentPage + 1,
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
${jumpFields}
                    <input
                      className="cards-page-jump-input"
                      type="number"
                      name="page"
                      min={1}
                      max={totalPages}
                      defaultValue={
                        currentPage
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

src = src.replace(
  storyPaginationRegex,
  storyPagination
);

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log(
  "[OK] 스토리 / 이벤트 페이지네이션 카드 UI로 통일"
);
console.log(
  "- 스토리: 카드 UI + 직접 페이지 입력"
);
console.log(
  "- 이벤트/기념일: 실제 페이지 분할 + 카드 UI + 직접 페이지 입력"
);
