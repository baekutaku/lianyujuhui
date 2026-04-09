import MomentFeed from "./MomentFeed";

type MomentItem = {
  id: string;
  characterKey: string;
  authorName: string;
  authorAvatar: string;
  authorLevel?: number;
  body: string;
  imageUrl?: string;
  quoteText?: string;
};

export default function MomentCharacterView({
  items,
}: {
  items: MomentItem[];
}) {
  return <MomentFeed items={items} />;
}