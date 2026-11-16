import fs from "node:fs";

const file =
  "components/admin/phone-items/PhoneItemForm.tsx";

let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
src = src.replace(/\r\n/g, "\n");

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

if (
  src.includes(
    'help="NPC/기타 작성자 프로필 이미지"'
  )
) {
  console.log("[SKIP] 이미 적용되어 있습니다.");
  process.exit(0);
}

const marker =
  'name="moment_author_avatar_url"';

const markerIndex = src.indexOf(marker);

if (markerIndex < 0) {
  fail("moment_author_avatar_url 입력칸을 찾지 못했습니다.");
}

const labelStart = src.lastIndexOf(
  '<label className="form-field form-field-full">',
  markerIndex
);

const labelEndStart = src.indexOf(
  "</label>",
  markerIndex
);

if (labelStart < 0 || labelEndStart < 0) {
  fail("작성자 프사 label 범위를 찾지 못했습니다.");
}

const labelEnd =
  labelEndStart + "</label>".length;

const replacement = `{isNpcMoment ? (
        <div className="form-field form-field-full">
          <PhoneImageField
            label="작성자 프사"
            name="moment_author_avatar_url"
            initialUrls={
              momentAuthorAvatarUrl
                ? [momentAuthorAvatarUrl]
                : []
            }
            onUrlsChange={(nextUrls) =>
              setMomentAuthorAvatarUrl(
                nextUrls[0] ?? ""
              )
            }
            help="NPC/기타 작성자 프로필 이미지 · 드래그앤드롭 / 파일 선택 / URL 직접 입력"
          />
        </div>
      ) : (
        <div className="form-field form-field-full">
          <span>작성자 프사</span>

          <input
            type="hidden"
            name="moment_author_avatar_url"
            value=""
          />

          {resolvedMomentAvatarPreview ? (
            <div style={{ marginTop: "10px" }}>
              <img
                src={resolvedMomentAvatarPreview}
                alt="avatar preview"
                style={{
                  width: "88px",
                  height: "88px",
                  borderRadius: "999px",
                  objectFit: "cover",
                  border: "1px solid #d7e0ec",
                  background: "#fff",
                }}
              />
            </div>
          ) : null}
        </div>
      )}`;

src =
  src.slice(0, labelStart) +
  replacement +
  src.slice(labelEnd);

/* NPC → 일반 캐릭터로 바꿀 때
   이전 NPC 프사 URL이 남지 않게 초기화 */
const changeAnchor =
`  setMomentAuthorKey(nextKey);

  if (!currentName || defaultNames.includes(currentName)) {`;

if (src.includes(changeAnchor)) {
  src = src.replace(
    changeAnchor,
`  setMomentAuthorKey(nextKey);

  if (nextKey !== "other") {
    setMomentAuthorAvatarUrl("");
  }

  if (!currentName || defaultNames.includes(currentName)) {`
  );
} else {
  console.warn(
    "[WARN] 작성자 변경 시 avatar 초기화 코드는 자동 삽입하지 못했습니다."
  );
}

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("[OK] 모멘트 NPC 프사 업로더 적용");
console.log("- NPC/기타: 드래그 / 파일 / URL");
console.log("- 남주/유연: 기존 기본 프사");
