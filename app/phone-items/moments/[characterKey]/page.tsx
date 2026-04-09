import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import MessageThreadView from "@/components/phone/message/MessageThreadView";
import { MESSAGE_THREAD_MAP } from "@/lib/phone-items";

type PageProps = {
  params: Promise<{ characterKey: string }>;
};

export default async function MessageThreadPage({ params }: PageProps) {
  const { characterKey } = await params;
  const thread =
    MESSAGE_THREAD_MAP[characterKey as keyof typeof MESSAGE_THREAD_MAP];

  if (!thread) notFound();

  return (
    <main className="phone-detail-page">
      <PhoneShell>
        <div className="phone-shell-inner">
          <PhoneTopBar title={thread.title} subtitle={thread.subtitle} />
          <MessageThreadView
            avatarUrl={thread.avatarUrl}
            messages={[...thread.messages]}
          />
        </div>
      </PhoneShell>
    </main>
  );
}