import PhoneItemForm from "@/components/admin/phone-items/PhoneItemForm";
import { createPhoneItemAction } from "./actions";

export default function NewPhoneItemPage() {
  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Phone Items / New</div>
        <h1 className="page-title">휴대폰 콘텐츠 작성</h1>
        <p className="page-desc">
          메시지, 모멘트, 음성, 기사를 subtype별로 작성합니다.
        </p>
      </header>

      <PhoneItemForm
        action={createPhoneItemAction}
        submitLabel="저장"
        initialValues={{
          subtype: "call",
          server_key: "kr",
          is_published: true,
        }}
      />
    </main>
  );
}