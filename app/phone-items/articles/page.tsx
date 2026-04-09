import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import ArticleList from "@/components/phone/article/ArticleList";

const MOCK_ARTICLES = [
  {
    slug: "rainbow-news",
    title: "뉴스 미리보기",
    preview: "비 온 뒤 거대 무지개 출현! 점성사 왈 '무지개…'",
    iconUrl:
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=300&auto=format&fit=crop",
  },
  {
    slug: "french",
    title: "오늘의 불어",
    preview: "세상에서 가장 아름다운 불어 10마디를 알아…",
    iconUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=300&auto=format&fit=crop",
  },
];

export default function ArticlesPage() {
  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar title="핫이슈" />
        <div className="phone-content">
          <ArticleList items={MOCK_ARTICLES} />
        </div>
        <PhoneTabNav currentPath="/phone-items/articles" />
      </PhoneShell>
    </main>
  );
}