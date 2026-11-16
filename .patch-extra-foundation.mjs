import fs from "node:fs";
import path from "node:path";

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function patchFile(file, fn) {
  if (!fs.existsSync(file)) return;

  const before = read(file);
  const after = fn(before);

  if (before !== after) {
    write(file, after);
    console.log("[PATCHED]", file);
  } else {
    console.log("[SKIP]", file);
  }
}

/* =========================================================
   1. STORY에 반쯤 들어간 PV 제거
========================================================= */

for (const file of [
  "app/admin/stories/new/page.tsx",
  "app/admin/stories/[slug]/edit/page.tsx",
]) {
  patchFile(file, (src) => {
    src = src.replace(
      /^import StoryPvExtras from .*?;\n/gm,
      ""
    );

    src = src.replace(
      /\s*<StoryPvExtras(?:\s+storyId=\{[^}]+\})?\s*\/>\s*/g,
      "\n"
    );

    src = src.replace(
      /^\s*\{\s*value:\s*"promo_video",\s*label:\s*"PV \/ 공식 영상"\s*\},?\s*\n/gm,
      ""
    );

    return src;
  });
}

patchFile("app/stories/page.tsx", (src) => {
  src = src.replace(
    /\s*\{\s*key:\s*"promo",[\s\S]*?subtypes:\s*\["promo_video"\],[\s\S]*?\},\s*/g,
    "\n"
  );

  src = src.replace(
    /^\s*promo_video:\s*"PV \/ 공식 영상",?\s*\n/gm,
    ""
  );

  src = src.replace(
    /\["all", "main", "card", "promo"\]/g,
    '["all", "main", "card"]'
  );

  return src;
});

patchFile("app/stories/[slug]/page.tsx", (src) => {
  src = src.replace(
    /^import StoryLinkedIllustrationGallery from .*?;\n/gm,
    ""
  );

  src = src.replace(
    /\s*<StoryLinkedIllustrationGallery[\s\S]*?\/>\s*/g,
    "\n"
  );

  src = src.replace(
    /\s*\{\s*key:\s*"promo",[\s\S]*?subtypes:\s*\["promo_video"\],[\s\S]*?\},\s*/g,
    "\n"
  );

  src = src.replace(
    /^\s*promo_video:\s*"PV \/ 공식 영상",?\s*\n/gm,
    ""
  );

  return src;
});

/* 생성됐던 임시 컴포넌트 제거 */
for (const file of [
  "components/admin/stories/StoryPvExtras.tsx",
  "components/story/StoryLinkedIllustrationGallery.tsx",
]) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log("[REMOVED]", file);
  }
}

/* =========================================================
   2. EXTRA 메인
========================================================= */

write(
  "app/extra/page.tsx",
`import Link from "next/link";

const EXTRA_CATEGORIES = [
  {
    key: "pv",
    title: "PV / 공식 영상",
    href: "/extra/pv",
    kicker: "PROMOTION VIDEO",
    description:
      "공식 PV, 티저, 이벤트 영상과 관련 이미지를 정리합니다.",
    meta: "CN · KR · 이미지",
  },
  {
    key: "mail",
    title: "우편",
    href: "/extra/mail",
    kicker: "MAIL",
    description:
      "게임 내 우편, 기념일 편지와 첨부 선물을 정리합니다.",
    meta: "원문 · 번역 · 선물",
  },
  {
    key: "touch-room",
    title: "터치룸 음성",
    href: "/extra/touch-room",
    kicker: "VOICE",
    description:
      "去见他 터치 음성을 상황과 시즌별로 정리합니다.",
    meta: "일상 · 의상 · 명절 · 생일",
  },
];

export default function ExtraPage() {
  return (
    <main className="extra-page">
      <header className="extra-hero">
        <p className="page-eyebrow">ARCHIVE / EXTRA</p>
        <h1 className="extra-title">기타</h1>
        <p className="extra-description">
          스토리·카드·휴대폰과 별도로 분류되는
          게임 내 자료를 모아둡니다.
        </p>
      </header>

      <nav
        className="extra-category-grid"
        aria-label="기타 카테고리"
      >
        {EXTRA_CATEGORIES.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="extra-category-card"
          >
            <span className="extra-category-kicker">
              {item.kicker}
            </span>

            <strong className="extra-category-title">
              {item.title}
            </strong>

            <span className="extra-category-description">
              {item.description}
            </span>

            <span className="extra-category-meta">
              {item.meta}
            </span>

            <span className="extra-category-arrow">
              보기 →
            </span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
`
);

/* =========================================================
   3. 공용 EXTRA 하위 페이지 생성
========================================================= */

function makeArchivePage({
  title,
  eyebrow,
  description,
  note,
}) {
  return `import Link from "next/link";

export default function Page() {
  return (
    <main className="extra-page">
      <header className="extra-sub-header">
        <div>
          <p className="page-eyebrow">
            EXTRA / ${eyebrow}
          </p>

          <h1 className="extra-title">
            ${title}
          </h1>

          <p className="extra-description">
            ${description}
          </p>
        </div>

        <Link
          href="/extra"
          className="extra-back-link"
        >
          ← 기타
        </Link>
      </header>

      <section className="extra-empty-panel">
        <span className="extra-empty-icon">
          archive
        </span>

        <strong>
          ${title} 아카이브 준비 중
        </strong>

        <p>
          ${note}
        </p>
      </section>
    </main>
  );
}
`;
}

write(
  "app/extra/pv/page.tsx",
  makeArchivePage({
    title: "PV / 공식 영상",
    eyebrow: "PV",
    description:
      "공식 PV, 티저, 프로모션 영상과 관련 이미지를 정리합니다.",
    note:
      "다음 단계에서 CN / KR 영상, 번역, 복수 캐릭터, 다중 이미지와 관련 이벤트 연결을 추가합니다.",
  })
);

write(
  "app/extra/mail/page.tsx",
  makeArchivePage({
    title: "우편",
    eyebrow: "MAIL",
    description:
      "게임 내 우편과 기념일 편지, 첨부 선물을 정리합니다.",
    note:
      "한 통을 하나의 게시물로 저장하고 이미지가 없는 우편도 등록할 수 있게 만들 예정입니다.",
  })
);

write(
  "app/extra/touch-room/page.tsx",
  makeArchivePage({
    title: "터치룸 음성",
    eyebrow: "TOUCH ROOM",
    description:
      "去见他 음성을 상황·시즌·캐릭터별로 정리합니다.",
    note:
      "일상, 의상, 액세서리, 업무, 학습, 수면, 단어 암기, 명절, 생리 기간, 유저 생일로 나눌 예정입니다.",
  })
);

console.log("[CREATED] /extra routes");

/* =========================================================
   4. PC SIDEBAR
========================================================= */

patchFile("app/layout.tsx", (src) => {
  if (src.includes('href="/extra"')) {
    return src;
  }

  const phoneLinkRegex =
    /(<Link\s+href="\/phone-items"\s+className="nav-link">[\s\S]*?<\/Link>)/;

  if (!phoneLinkRegex.test(src)) {
    console.error(
      "[WARN] layout.tsx 휴대폰 링크를 못 찾아 기타 메뉴는 자동 추가하지 못함"
    );
    return src;
  }

  return src.replace(
    phoneLinkRegex,
`$1
                    <Link href="/extra" className="nav-link">
                      기타
                    </Link>`
  );
});

/* =========================================================
   5. MOBILE MENU
========================================================= */

patchFile(
  "components/FloatingMobileMenu.tsx",
  (src) => {
    if (
      src.includes(
        '{ href: "/extra", label: "기타" }'
      )
    ) {
      return src;
    }

    const anchor =
      '{ href: "/phone-items", label: "휴대폰" },';

    if (!src.includes(anchor)) {
      console.error(
        "[WARN] FloatingMobileMenu 휴대폰 항목을 못 찾음"
      );
      return src;
    }

    return src.replace(
      anchor,
`${anchor}
  { href: "/extra", label: "기타" },`
    );
  }
);

/* =========================================================
   6. 홈 PV 링크가 있으면 새 주소로 변경
========================================================= */

patchFile("app/page.tsx", (src) => {
  const pvIndex = src.indexOf('id: "pv"');

  if (pvIndex < 0) return src;

  const nextObjectEnd = src.indexOf("},", pvIndex);

  if (nextObjectEnd < 0) return src;

  const before = src.slice(0, pvIndex);
  let block = src.slice(
    pvIndex,
    nextObjectEnd + 2
  );
  const after = src.slice(nextObjectEnd + 2);

  block = block.replace(
    /href:\s*"[^"]*"/,
    'href: "/extra/pv"'
  );

  return before + block + after;
});

/* =========================================================
   7. CSS
========================================================= */

patchFile("app/globals.css", (src) => {
  const marker =
    "EXTRA ARCHIVE FOUNDATION - 2026-11-16";

  if (src.includes(marker)) return src;

  return (
    src +
`

/* =========================================================
   EXTRA ARCHIVE FOUNDATION - 2026-11-16
========================================================= */

.extra-page {
  width: 100%;
  min-width: 0;
}

.extra-hero,
.extra-sub-header {
  margin-bottom: 22px;
}

.extra-sub-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.extra-title {
  margin: 0;
  color: rgba(66, 52, 72, 0.96);
  font-size: clamp(30px, 4vw, 48px);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.04em;
}

.extra-description {
  max-width: 720px;
  margin: 12px 0 0;
  color: rgba(83, 74, 89, 0.64);
  font-size: 13px;
  line-height: 1.75;
}

.extra-category-grid {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.extra-category-card {
  position: relative;

  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 220px;

  padding: 22px;

  border:
    1px solid rgba(194, 182, 201, 0.34);
  border-radius: 18px;

  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.64),
      rgba(246, 241, 248, 0.36)
    );

  box-shadow:
    0 12px 36px rgba(83, 66, 91, 0.05);

  color: inherit;
  text-decoration: none;

  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.extra-category-card:hover {
  transform: translateY(-2px);
  border-color:
    rgba(175, 156, 185, 0.58);
  box-shadow:
    0 16px 40px rgba(83, 66, 91, 0.09);
}

.extra-category-kicker {
  margin-bottom: 10px;

  color: rgba(113, 97, 121, 0.42);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.extra-category-title {
  color: rgba(67, 53, 73, 0.94);
  font-size: 19px;
  font-weight: 700;
}

.extra-category-description {
  margin-top: 12px;

  color: rgba(82, 72, 88, 0.62);
  font-size: 12px;
  line-height: 1.65;
}

.extra-category-meta {
  margin-top: auto;
  padding-top: 18px;

  color: rgba(104, 91, 112, 0.48);
  font-size: 10px;
}

.extra-category-arrow {
  margin-top: 8px;

  color: rgba(87, 71, 96, 0.72);
  font-size: 11px;
  font-weight: 700;
}

.extra-back-link {
  flex: 0 0 auto;

  padding: 8px 10px;

  border-radius: 8px;

  color: rgba(78, 68, 84, 0.65);
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}

.extra-back-link:hover {
  background:
    rgba(255, 255, 255, 0.46);
}

.extra-empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  min-height: 280px;
  padding: 30px;

  border:
    1px dashed rgba(185, 169, 194, 0.42);
  border-radius: 18px;

  background:
    rgba(255, 255, 255, 0.28);

  text-align: center;
}

.extra-empty-panel strong {
  margin-top: 10px;

  color: rgba(71, 58, 77, 0.86);
  font-size: 14px;
}

.extra-empty-panel p {
  max-width: 580px;
  margin: 8px 0 0;

  color: rgba(91, 80, 97, 0.54);
  font-size: 11px;
  line-height: 1.7;
}

.extra-empty-icon {
  font-family:
    "Material Symbols Rounded",
    sans-serif;

  color: rgba(118, 98, 128, 0.34);
  font-size: 30px;
}

@media (max-width: 900px) {
  .extra-category-grid {
    grid-template-columns: 1fr;
  }

  .extra-category-card {
    min-height: 170px;
  }

  .extra-sub-header {
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .extra-category-card {
    padding: 17px;
    border-radius: 14px;
  }

  .extra-title {
    font-size: 30px;
  }

  .extra-sub-header {
    flex-direction: column;
    gap: 10px;
  }
}
`
  );
});

console.log("");
console.log("=== EXTRA FOUNDATION COMPLETE ===");
console.log("- 스토리 PV 부분 적용 흔적 정리");
console.log("- /extra");
console.log("- /extra/pv");
console.log("- /extra/mail");
console.log("- /extra/touch-room");
console.log("- PC / 모바일 기타 메뉴 추가");
console.log("- 홈 PV 링크 -> /extra/pv");
