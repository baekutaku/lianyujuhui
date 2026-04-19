import Link from "next/link";
import { redirect } from "next/navigation";
import MakerPhoneShell from "@/components/maker/MakerPhoneShell";
import MakerPhoneTopBar from "@/components/maker/MakerPhoneTopBar";
import MakerPhoneTabNav from "@/components/maker/MakerPhoneTabNav";
import MakerMessageInboxList from "@/components/maker/message/MakerMessageInboxList";
import { getMakerActor } from "@/lib/maker/auth";
import { listMakerMessageThreads } from "@/lib/maker/message-reader";

export default async function MakerMessagesPage() {
  const actor = await getMakerActor();

  if (actor.needsInit) {
    redirect("/maker/init?next=/maker/messages");
  }

  const threads = await listMakerMessageThreads();

  return (
    <MakerPhoneShell>
    <MakerPhoneTopBar
  title="메세지"
  subtitle="최근 대화"
  backHref="/maker/me"
  rightSlot={
    <Link
      href="/maker/messages/new"
      className="phone-topbar-history-button"
      aria-label="메세지 추가"
      title="메세지 추가"
    >
      추가
    </Link>
  }
/>
      <div className="maker-phone-content">
        {threads.length > 0 ? (
          <MakerMessageInboxList
            items={threads.map((thread) => ({
              id: thread.id,
              characterName: thread.characterName,
              avatarUrl: thread.avatarUrl,
              preview: thread.preview,
            }))}
          />
        ) : (
          <div className="phone-empty">
            아직 만든 메세지가 없음
          </div>
        )}
      </div>
      <MakerPhoneTabNav active="messages" />
    </MakerPhoneShell>
  );
}