import fs from "node:fs";

const file =
  "app/phone-items/articles/[publisherSlug]/[articleSlug]/page.tsx";

let src = fs.readFileSync(file, "utf8");

const old = `rightSlot={
            <Link
              href={\`/phone-items/articles/\${publisherSlug}\`}
              className="phone-topbar-icon-button"
              aria-label="히스토리"
              title="히스토리"
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: "rgba(122, 204, 178, 0.85)",
                  color: "white",
                }}
              >
                히스토리
              </span>
            </Link>
          }`;

const next = `rightSlot={
            <Link
              href={\`/phone-items/articles/\${publisherSlug}\`}
              className="article-topbar-history-button"
              aria-label="히스토리"
              title="히스토리"
            >
              히스토리
            </Link>
          }`;

if (!src.includes(old)) {
  console.error("[ERROR] 기존 기사 히스토리 버튼을 찾지 못했습니다.");
  process.exit(1);
}

src = src.replace(old, next);

fs.writeFileSync(file, src, "utf8");

console.log("[OK] 기사 히스토리 버튼 JSX 교체");
