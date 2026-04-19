import { redirect } from "next/navigation";
import MakerPhoneShell from "@/components/maker/MakerPhoneShell";
import MakerPhoneTopBar from "@/components/maker/MakerPhoneTopBar";
import MakerPhoneTabNav from "@/components/maker/MakerPhoneTabNav";
import MakerMomentForm from "@/components/maker/moment/MakerMomentForm";
import { getMakerActor } from "@/lib/maker/auth";
import { createMakerMomentFromForm } from "@/lib/maker/moment-actions";

export default async function MakerNewMomentPage() {
  const actor = await getMakerActor();

  if (actor.needsInit) {
    redirect("/maker/init?next=/maker/moments/new");
  }

  return (
    <MakerPhoneShell>
      <MakerPhoneTopBar title="모멘트 작성" backHref="/maker/moments" />
      <div className="maker-phone-content" style={{ padding: 16 }}>
        <MakerMomentForm
          action={createMakerMomentFromForm}
          submitLabel="모멘트 저장"
        />
      </div>
      <MakerPhoneTabNav active="moments" />
    </MakerPhoneShell>
  );
}