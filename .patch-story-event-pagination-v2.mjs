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
   EVENT PAGINATION
========================================================= */

if (!src.includes("const eventTotalPages =")) {
  const eventPagingRegex =
    /const\s+eventTotalCount\s*=\s*events\.length\s*;\s*const\s+eventIds\s*=\s*events\.map\(\s*\(event\)\s*=>\s*event\.id\s*\)\s*;/;

  if (!eventPagingRegex.test(src)) {
    console.error("\n=== eventTotalCount 주변 ===");

    const pos = src.indexOf("eventTotalCount");

    if (pos >= 0) {
      console.error(
        src.slice(
          Math.max(0, pos - 250),
          Math.min(src.length, pos + 650)
        )
      );
    }

    fail("eventTotalCount / eventIds 계산부를 찾지 못했습니다.");
  }

  src = src.replace(
    eventPagingRegex,
`const eventTotalCount = events.length;

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

const eventIds = pagedEvents.map(
  (event) => event.id
);`
  );

  console.log("[PATCHED] event paging calculation");
} else {
  console.log("[SKIP] event paging calculation already exists");
}

/* 이벤트 branch 안의 events.map만 pagedEvents.map으로 */
const eventBranchStart = src.indexOf(
  'if (activeTab.key === "event")'
);

if (eventBranchStart < 0) {
  fail("event branch를 찾지 못했습니다.");
}

const eventMapIndex = src.indexOf(
  "{events.map((event) => {",
  eventBranchStart
);

if (eventMapIndex >= 0) {
  src =
    src.slice(0, eventMapIndex) +
    "{pagedEvents.map((event) => {" +
    src.slice(
      eventMapIndex +
        "{events.map((event) => {".length
    );

  console.log("[PATCHED] events.map -> pagedEvents.map");
} else if (
  src.indexOf(
    "{pagedEvents.map((event) => {",
    eventBranchStart
  ) >= 0
) {
  console.log("[SKIP] pagedEvents.map already exists");
} else {
  fail("이벤트 목록 map을 찾지 못했습니다.");
}

/* =========================================================
   COMMON PAGE JUMP FIELDS
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
   EVENT PAGINATION JSX
========================================================= */

if (
  !src.includes(
    'aria-label="이벤트 페이지 이동"'
  )
) {
  const eventAsideIndex = src.indexOf(
    '<aside className="story-archive-sidebar">',
    eventBranchStart
  );

  if (eventAsideIndex < 0) {
    fail("event sidebar 위치를 찾지 못했습니다.");
  }

  const beforeAside = src.slice(
    eventBranchStart,
    eventAsideIndex
  );

  /*
   이벤트 main div 닫힘 직전에 pagination 삽입.
   sidebar 직전의 마지막 </div>를 찾는다.
  */
  const lastMainClose =
    beforeAside.lastIndexOf("</div>");

  if (lastMainClose < 0) {
    fail("event main 영역 끝을 찾지 못했습니다.");
  }

  const insertPos =
    eventBranchStart +
    lastMainClose;

  const eventPagination = `
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

`;

  src =
    src.slice(0, insertPos) +
    eventPagination +
    src.slice(insertPos);

  console.log("[PATCHED] event pagination UI");
} else {
  console.log("[SKIP] event pagination UI already exists");
}

/* =========================================================
   STORY PAGINATION JSX
========================================================= */

if (
  src.includes(
    '<nav className="story-pagination" aria-label="스토리 페이지 이동">'
  )
) {
  const storyPaginationRegex =
    /<nav\s+className="story-pagination"\s+aria-label="스토리 페이지 이동">[\s\S]*?<\/nav>/;

  if (!storyPaginationRegex.test(src)) {
    fail("story-pagination 전체 범위를 찾지 못했습니다.");
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

                  {currentPage === totalPages ? (
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

  console.log("[PATCHED] story pagination UI");
} else if (
  src.includes(
    'aria-label="스토리 페이지 이동"'
  )
) {
  console.log(
    "[SKIP] story pagination already converted"
  );
} else {
  fail("스토리 페이지네이션을 찾지 못했습니다.");
}

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("");
console.log(
  "=== STORY / EVENT PAGINATION V2 COMPLETE ==="
);
console.log(
  "- 카드와 동일한 pagination CSS"
);
console.log(
  "- 스토리 직접 페이지 이동"
);
console.log(
  "- 이벤트/기념일 실제 페이지 분할 + 직접 이동"
);
