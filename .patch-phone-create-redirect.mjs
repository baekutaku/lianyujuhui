import fs from "node:fs";

const file = "lib/admin/phone-items/actions.ts";

let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
src = src.replace(/\r\n/g, "\n");

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

const oldRedirect =
  '  redirect(`/admin/phone-items/${createdItem.id}/edit`);';

if (!src.includes(oldRedirect)) {
  fail("기존 createPhoneItemAction 마지막 redirect를 찾지 못했습니다.");
}

const newRedirect = `  const createdSubtype =
    String(formData.get("subtype") || "").trim();

  if (createdSubtype === "message") {
    const characterKey =
      String(formData.get("character_key") || "").trim() ||
      "baiqi";

    redirect(
      \`/phone-items/messages/\${encodeURIComponent(
        characterKey
      )}/\${encodeURIComponent(createdItem.slug)}\`
    );
  }

  if (createdSubtype === "moment") {
    redirect("/phone-items/moments");
  }

  if (
    createdSubtype === "call" ||
    createdSubtype === "video_call"
  ) {
    redirect("/phone-items/calls");
  }

  if (createdSubtype === "article") {
    const publisherSlug =
      String(
        formData.get("article_publisher_slug") || ""
      ).trim() || "news-preview";

    redirect(
      \`/phone-items/articles/\${encodeURIComponent(
        publisherSlug
      )}/\${encodeURIComponent(createdItem.slug)}\`
    );
  }

  redirect("/admin/phone-items");`;

src = src.replace(oldRedirect, newRedirect);

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("[OK] phone item create redirect updated");
console.log("- message -> character/slug detail");
console.log("- moment -> moments");
console.log("- call/video_call -> calls");
console.log("- article -> publisher/slug detail");
