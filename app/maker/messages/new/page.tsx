import { redirect } from "next/navigation";
import MakerPhoneShell from "@/components/maker/MakerPhoneShell";
import MakerPhoneTopBar from "@/components/maker/MakerPhoneTopBar";
import MakerPhoneTabNav from "@/components/maker/MakerPhoneTabNav";
import MakerMessageForm from "@/components/maker/message/MakerMessageForm";
import { getMakerActor } from "@/lib/maker/auth";
import { createMakerMessageFromForm } from "@/lib/maker/message-actions";

export default async function MakerNewMessagePage() {
  const actor = await getMakerActor();

  if (actor.needsInit) {
    redirect("/maker/init?next=/maker/messages/new");
  }

  return (
    <MakerPhoneShell>
      <MakerPhoneTopBar title="메세지 작성" backHref="/maker/messages" />
      <div className="maker-phone-content" style={{ padding: 16 }}>
        <MakerMessageForm
          action={createMakerMessageFromForm}
          submitLabel="메세지 저장"
        />
      </div>
      <MakerPhoneTabNav active="messages" />
    </MakerPhoneShell>
  );
}