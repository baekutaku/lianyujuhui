import fs from "node:fs";

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, text) {
  fs.writeFileSync(file, text, "utf8");
}

/* =========================================================
   1. MailForm 이미지 필드 -> 드래그 업로드
========================================================= */

{
  const file =
    "components/extra/mail/MailForm.tsx";

  let src = read(file);

  if (
    !src.includes(
      'PhoneImageField'
    )
  ) {
    src =
`import PhoneImageField
  from "@/components/admin/phone-items/PhoneImageField";

` + src;
  }

  const oldBlock = `          <label className="field">

            <span>
              이미지 URL
            </span>

            <input
              type="url"
              name="imageUrl"
              defaultValue={
                item?.image_url ??
                ""
              }
              placeholder="선택 사항"
            />

          </label>`;

  const newBlock = `          <div className="field full">

            <PhoneImageField
              label="우편 이미지"
              name="imageUrl"
              initialUrls={
                item?.image_url
                  ? [
                      item.image_url
                    ]
                  : []
              }
              multiple={false}
              help="이미지를 드래그하거나 파일 선택, URL 직접 입력이 가능합니다."
            />

          </div>`;

  if (
    src.includes(oldBlock)
  ) {
    src =
      src.replace(
        oldBlock,
        newBlock
      );
  } else {
    console.warn(
      "[WARN] 기존 이미지 URL 필드를 찾지 못했습니다."
    );
  }

  write(file, src);

  console.log(
    "[PATCHED] mail image drag upload"
  );
}


/* =========================================================
   2. 우편 목록 더보기 / 접기 표시
========================================================= */

{
  const file =
    "app/extra/mail/page.tsx";

  let src = read(file);

  const oldChevron = `                            <span className="material-symbols-rounded extra-mail-chevron">
                              expand_more
                            </span>`;

  const newChevron = `                            <span className="extra-mail-more-label">
                              <span className="extra-mail-more-closed">
                                더보기
                              </span>

                              <span className="extra-mail-more-open">
                                접기
                              </span>

                              <span className="material-symbols-rounded extra-mail-chevron">
                                expand_more
                              </span>
                            </span>`;

  if (
    src.includes(oldChevron)
  ) {
    src =
      src.replace(
        oldChevron,
        newChevron
      );
  }

  write(file, src);

  console.log(
    "[PATCHED] mail more / close label"
  );
}


console.log("");
console.log(
  "=== EXTRA MAIL IMAGE PATCH COMPLETE ==="
);
