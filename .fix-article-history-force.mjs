import fs from "node:fs";

const pageFile =
  "app/phone-items/articles/[publisherSlug]/[articleSlug]/page.tsx";

const cssFile = "app/globals.css";

let src = fs.readFileSync(pageFile, "utf8");

/* 기사 상세에 전용 페이지 클래스 */
src = src.replace(
  '<main className="phone-page">',
  '<main className="phone-page phone-page-article-detail">'
);

/* PhoneTopBar variant 보장 */
if (!src.includes('variant="articles"')) {
  const subtitle = 'subtitle="기사 상세"';

  if (!src.includes(subtitle)) {
    console.error("[ERROR] 기사 상세 subtitle을 찾지 못했습니다.");
    process.exit(1);
  }

  src = src.replace(
    subtitle,
    `subtitle="기사 상세"
          variant="articles"`
  );
}

/* aria-label="히스토리"가 들어간 Link 전체 강제 탐색 */
const anchor = 'aria-label="히스토리"';
const anchorIndex = src.indexOf(anchor);

if (anchorIndex < 0) {
  console.error("[ERROR] 히스토리 버튼을 찾지 못했습니다.");
  process.exit(1);
}

const linkStart = src.lastIndexOf(
  "<Link",
  anchorIndex
);

const linkEndStart = src.indexOf(
  "</Link>",
  anchorIndex
);

if (linkStart < 0 || linkEndStart < 0) {
  console.error("[ERROR] 히스토리 Link 범위를 찾지 못했습니다.");
  process.exit(1);
}

const linkEnd =
  linkEndStart + "</Link>".length;

const newLink = `<Link
              href={\`/phone-items/articles/\${publisherSlug}\`}
              className="article-topbar-history-button"
              aria-label="히스토리"
              title="히스토리"
            >
              히스토리
            </Link>`;

src =
  src.slice(0, linkStart) +
  newLink +
  src.slice(linkEnd);

fs.writeFileSync(pageFile, src, "utf8");

/* CSS도 Node로 안전하게 추가 */
let css = fs.readFileSync(cssFile, "utf8");

const marker =
  "ARTICLE HISTORY BUTTON FORCE FIX - 2026-11-15";

if (!css.includes(marker)) {
  css += `

/* =========================================================
   ARTICLE HISTORY BUTTON FORCE FIX - 2026-11-15
========================================================= */

.phone-page-article-detail .phone-topbar {
  grid-template-columns:
    86px minmax(0, 1fr) 86px !important;
}

.phone-page-article-detail .phone-topbar-right {
  width: 86px !important;
  min-width: 86px !important;
  max-width: 86px !important;

  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;

  overflow: visible !important;
}

.phone-page-article-detail
.article-topbar-history-button {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;

  flex: 0 0 66px !important;

  width: 66px !important;
  min-width: 66px !important;
  max-width: 66px !important;

  height: 32px !important;
  min-height: 32px !important;

  padding: 0 8px !important;

  box-sizing: border-box !important;

  border: 0 !important;
  border-radius: 9px !important;

  background: rgba(122, 204, 178, 0.90) !important;
  color: #ffffff !important;

  box-shadow: none !important;

  font-size: 11px !important;
  font-weight: 800 !important;
  line-height: 1 !important;

  white-space: nowrap !important;
  word-break: normal !important;
  overflow-wrap: normal !important;
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;

  text-indent: 0 !important;
  text-decoration: none !important;

  overflow: visible !important;

  transform: none !important;
}

.phone-page-article-detail
.article-topbar-history-button:hover {
  background: rgba(108, 193, 166, 0.98) !important;
}

@media (max-width: 768px) {
  .phone-page-article-detail .phone-topbar {
    grid-template-columns:
      80px minmax(0, 1fr) 80px !important;
  }

  .phone-page-article-detail .phone-topbar-right {
    width: 80px !important;
    min-width: 80px !important;
    max-width: 80px !important;
  }

  .phone-page-article-detail
  .article-topbar-history-button {
    flex-basis: 62px !important;
    width: 62px !important;
    min-width: 62px !important;
    max-width: 62px !important;

    height: 30px !important;
    min-height: 30px !important;

    padding: 0 6px !important;
    font-size: 10px !important;
  }
}
`;
}

fs.writeFileSync(cssFile, css, "utf8");

console.log("[OK] 기사 상세 전용 클래스 적용");
console.log("[OK] 기존 히스토리 Link 통째로 교체");
console.log("[OK] 히스토리 버튼 가로 66px 강제");
console.log("[OK] nowrap / horizontal writing 강제");
