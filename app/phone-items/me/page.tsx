import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";

export default function MePage() {
  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar title="개인 정보" />
        <div className="phone-content">
          <div className="phone-empty">나 탭은 다음 단계에서 구현.</div>
        </div>
        <PhoneTabNav currentPath="/phone-items/me" />
      </PhoneShell>
    </main>
  );
}