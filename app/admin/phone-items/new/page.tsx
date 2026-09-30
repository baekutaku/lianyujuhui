import PhoneItemForm from "@/components/admin/phone-items/PhoneItemForm";
import { createPhoneItem } from "@/app/admin/actions";

type NewPhoneItemPageProps = {
  searchParams?: Promise<{
    subtype?: string;
    server_key?: string;
    is_published?: string;
    error?: string;
  }>;
};

export default async function NewPhoneItemPage({
  searchParams,
}: NewPhoneItemPageProps) {
  const params = (await searchParams) ?? {};

  const subtype =
    params.subtype === "message" ||
    params.subtype === "moment" ||
    params.subtype === "call" ||
    params.subtype === "video_call" ||
    params.subtype === "article"
      ? params.subtype
      : "call";

  const serverKey = params.server_key === "cn" ? "cn" : "kr";
  const isPublished = params.is_published !== "off";

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin / Phone Items / New</div>
        <h1 className="page-title">휴대폰 콘텐츠 작성</h1>
        <p className="page-desc">
          메시지, 모멘트, 음성, 기사를 subtype별로 작성합니다.
        </p>
        {params.error ? (
          <p style={{ color: "crimson", marginTop: 12 }}>{params.error}</p>
        ) : null}
      </header>

      <PhoneItemForm
        action={createPhoneItem}
        submitLabel="저장"
        initialValues={{
          subtype,
          server_key: serverKey,
          is_published: isPublished,
        }}
      />
    </main>
  );
}