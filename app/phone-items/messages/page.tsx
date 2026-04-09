import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import MessageInboxList from "@/components/phone/message/MessageInboxList";

const MOCK_INBOX = [
  {
    characterKey: "xumo",
    characterName: "허묵",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    level: 39,
    preview: "옷에 묻은 립스틱 자국은 지워졌나요?",
  },
  {
    characterKey: "baiqi",
    characterName: "백기",
    avatarUrl:
      "https://lianyujuhui.ivyro.net/data/file/pic/2009648324_0qlIJGgx_72d730ad05cc87c44f0829a386a0c0cfc426b609.jpg",
    level: 45,
    preview: "이 계절에 갑자기 색다른 즐거움이 더해진 것…",
  },
  {
    characterKey: "lizeyan",
    characterName: "택언",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    level: 40,
    preview: "책상 위의 밀크티, 당신이 산 건가요?",
  },
];

export default function MessagesPage() {
  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar title="메시지" />
        <div className="phone-content">
          <MessageInboxList items={MOCK_INBOX} />
        </div>
        <PhoneTabNav currentPath="/phone-items/messages" />
      </PhoneShell>
    </main>
  );
}