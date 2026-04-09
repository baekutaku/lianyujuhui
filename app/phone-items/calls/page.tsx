import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import CallHistoryList from "@/components/phone/call/CallHistoryList";

const MOCK_CALLS = [
  {
    characterKey: "baiqi",
    characterName: "백기",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    level: 45,
    slug: "honor-menu",
    title: "명절 메뉴",
    isVideo: false,
  },
  {
    characterKey: "baiqi",
    characterName: "백기",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    level: 45,
    slug: "gift-of-flowers",
    title: "뜻밖의 선물",
    isVideo: false,
  },
  {
    characterKey: "baiqi",
    characterName: "백기",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    level: 45,
    slug: "peace",
    title: "평온",
    isVideo: true,
  },
  {
    characterKey: "xumo",
    characterName: "허묵",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    level: 39,
    slug: "seedling",
    title: "새싹",
    isVideo: false,
  },
];

export default function CallsPage() {
  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title="통화 기록"
          rightSlot={<a className="phone-topbar-button">통화배경변경</a>}
        />
        <div className="phone-content">
          <CallHistoryList items={MOCK_CALLS} />
        </div>
        <PhoneTabNav currentPath="/phone-items/calls" />
      </PhoneShell>
    </main>
  );
}