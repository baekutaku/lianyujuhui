import fs from "node:fs";

const file =
  "components/admin/phone-items/PhoneItemForm.tsx";

let src = fs.readFileSync(file, "utf8");

const oldValue =
  'className="form-panel"';

const newValue =
  'className="form-panel phone-item-admin-form"';

if (src.includes(newValue)) {
  console.log("[SKIP] class already applied");
  process.exit(0);
}

if (!src.includes(oldValue)) {
  console.error("[ERROR] form-panel class를 찾지 못했습니다.");
  process.exit(1);
}

src = src.replace(oldValue, newValue);

fs.writeFileSync(file, src, "utf8");

console.log("[OK] phone admin form class applied");
