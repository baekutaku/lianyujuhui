import RelatedContentGroup from "./RelatedContentGroup";

type RelatedItem = {
  id: string;
  title: string;
  slug: string;
};

type CardRelatedContentProps = {
  related: {
    stories: RelatedItem[];
    messages: RelatedItem[];
    moments: RelatedItem[];
    calls: RelatedItem[];
    videoCalls: RelatedItem[];
    articles: RelatedItem[];
    asmr: RelatedItem[];
    events: RelatedItem[];
  };
};

export default function CardRelatedContent({
  related,
}: CardRelatedContentProps) {
  return (
    <div className="rounded-[32px] bg-white p-6">
      <h2 className="mb-6 text-3xl font-bold text-slate-800">연결 콘텐츠</h2>

      <div className="space-y-6">
        <RelatedContentGroup title="연결 스토리" basePath="/stories" items={related.stories} />
        <RelatedContentGroup title="연결 문자" basePath="/phone-items" items={related.messages} />
        <RelatedContentGroup title="연결 모멘트" basePath="/phone-items" items={related.moments} />
        <RelatedContentGroup title="연결 전화" basePath="/phone-items" items={related.calls} />
        <RelatedContentGroup title="연결 영상통화" basePath="/phone-items" items={related.videoCalls} />
        <RelatedContentGroup title="연결 기사" basePath="/phone-items" items={related.articles} />
        <RelatedContentGroup title="연결 ASMR" basePath="/stories" items={related.asmr} />
        <RelatedContentGroup title="관련 이벤트" basePath="/events" items={related.events} />
      </div>
    </div>
  );
}