import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import MakerPhoneShell from "@/components/maker/MakerPhoneShell";
import MakerPhoneTopBar from "@/components/maker/MakerPhoneTopBar";
import MakerMessageThreadView from "@/components/maker/message/MakerMessageThreadView";
import { getMakerActor } from "@/lib/maker/auth";
import { getMakerViewerProfile } from "@/lib/maker/profile";
import { getMakerMessageThread } from "@/lib/maker/message-reader";

type Props = {
  params: Promise<{
    threadId: string;
  }>;
};

export default async function MakerMessageDetailPage({ params }: Props) {
  const actor = await getMakerActor();
  const { threadId } = await params;

  if (actor.needsInit) {
    redirect(`/maker/init?next=/maker/messages/${threadId}`);
  }

  const thread = await getMakerMessageThread(threadId);

  if (!thread) {
    notFound();
  }

  const viewer = await getMakerViewerProfile();

  return (
    <MakerPhoneShell noTabbar>
      <MakerPhoneTopBar
        title={thread.title}
        subtitle={thread.characterName}
        backHref="/maker/messages"
        rightSlot={
          <Link
            href={`/maker/messages/${thread.id}/edit`}
            className="maker-phone-topbar-icon"
          >
            ✎
          </Link>
        }
      />

      <div className="maker-phone-content thread-layout">
        <div className="thread-scroll">
          <MakerMessageThreadView
            entries={thread.entriesForView as any[]}
            otherAvatarUrl={thread.avatarUrl}
            myAvatarUrl={viewer.avatarUrl}
            otherProfileHref="/maker/me"
            myProfileHref="/maker/me"
          />
        </div>

        <div className="thread-toolbar">
          <button type="button" className="thread-toolbar-btn" aria-label="음성">
            <span className="material-symbols-rounded">volume_up</span>
          </button>

          <input className="thread-toolbar-input" readOnly />

          <button type="button" className="thread-toolbar-btn" aria-label="이모지">
            <span className="material-symbols-rounded">sentiment_satisfied</span>
          </button>

          <button type="button" className="thread-toolbar-btn" aria-label="추가">
            <span className="material-symbols-rounded">add</span>
          </button>
        </div>
      </div>
    </MakerPhoneShell>
  );
}