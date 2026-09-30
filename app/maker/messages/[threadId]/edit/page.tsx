import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import MakerPhoneShell from "@/components/maker/MakerPhoneShell";
import MakerPhoneTopBar from "@/components/maker/MakerPhoneTopBar";
import MakerPhoneTabNav from "@/components/maker/MakerPhoneTabNav";
import MakerMessageForm from "@/components/maker/message/MakerMessageForm";
import { getMakerActor } from "@/lib/maker/auth";
import {
  softDeleteMakerMessage,
  updateMakerMessageFromForm,
} from "@/lib/maker/message-actions";
import { getMakerMessageThread } from "@/lib/maker/message-reader";

type Props = {
  params: Promise<{
    threadId: string;
  }>;
};

export default async function MakerEditMessagePage({ params }: Props) {
  const actor = await getMakerActor();
  const { threadId } = await params;

  if (actor.needsInit) {
    redirect(`/maker/init?next=/maker/messages/${threadId}/edit`);
  }

  const thread = await getMakerMessageThread(threadId);

  if (!thread) {
    notFound();
  }

  return (
    <MakerPhoneShell>
      <MakerPhoneTopBar
        title="메세지 수정"
        backHref={`/maker/messages/${threadId}`}
        rightSlot={
          <Link href={`/maker/messages/${threadId}`} className="maker-phone-topbar-icon">
            ↗
          </Link>
        }
      />
      <div className="maker-phone-content" style={{ padding: 16, display: "grid", gap: 16 }}>
        <MakerMessageForm
          action={updateMakerMessageFromForm}
          submitLabel="수정 저장"
          hiddenFields={<input type="hidden" name="threadId" value={thread.id} />}
          initialValues={{
            title: thread.title,
            character_key: thread.characterKey,
            character_name: thread.characterName,
            avatar_url: thread.avatarUrl,
            preview: thread.preview,
            editor_entries_json: JSON.stringify(thread.payload.editorEntries),
            input_mode: "simple",
          }}
        />

        <form action={softDeleteMakerMessage}>
          <input type="hidden" name="threadId" value={thread.id} />
          <button
            type="submit"
            className="nav-link"
            style={{
              display: "inline-flex",
              border: "1px solid #e2caca",
              background: "#fff7f7",
              color: "#8c4d4d",
            }}
          >
            삭제
          </button>
        </form>
      </div>
      <MakerPhoneTabNav active="messages" />
    </MakerPhoneShell>
  );
}