import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import MomentFeed from "@/components/phone/moment/MomentFeed";

const MOCK_FEED = [
  {
    id: "1",
    characterKey: "baiqi",
    authorName: "백기",
    authorAvatar:
      "https://lianyujuhui.ivyro.net/data/file/pic/2009648324_0qlIJGgx_72d730ad05cc87c44f0829a386a0c0cfc426b609.jpg",
    authorLevel: 45,
    body: "헬러윈 가면 무도회엔 이상한 옷차림이 많다… 변장이 이 정도로 자유로워진 건가?",
    quoteText:
      "유연 : 요즘은 엄청 자유로워졌어요.\n백기답장유연 : 네가 곁에 있다면, 난 아무거나 괜찮아.",
  },
  {
    id: "2",
    characterKey: "yanxihao",
    authorName: "시호",
    authorAvatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop",
    authorLevel: 16,
    body: "단번에 클리어할 수 있는 게임이 뭐가 재미 있다는 거지?",
    quoteText:
      "유연 : 몰입형 게임은 클리어만이 목표가 아니에요.\n시호답장유연 : 어떤 고건이 있는지 말해봐요.",
  },
  {
    id: "3",
    characterKey: "mc",
    authorName: "유연",
    authorAvatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop",
    body: "무조건 믿을 수 있는 사람을 만났다는 건 정말 행운인 것 같다.",
    quoteText:
      "기락 : 내 얘기네!!\n백기 : 누구?\n택언 : 바보.",
  },
];

export default function MomentsPage() {
  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title="모멘트"
          rightSlot={<a className="phone-topbar-button">모멘트 작성</a>}
        />
        <div className="phone-content">
          <MomentFeed items={MOCK_FEED} />
        </div>
        <PhoneTabNav currentPath="/phone-items/moments" />
      </PhoneShell>
    </main>
  );
}