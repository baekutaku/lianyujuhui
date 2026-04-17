"use client";

type CardMedia = {
  beforeThumb?: string | null;
  afterThumb?: string | null;
  beforeCover?: string | null;
  afterCover?: string | null;
  title: string;
};

export default function CardDetailMediaSwitcher({
  media,
}: {
  media: CardMedia;
}) {
  const imageUrl =
    media.beforeCover ||
    media.beforeThumb ||
    media.afterCover ||
    media.afterThumb ||
    "";

  if (!imageUrl) {
    return <div className="empty-box">등록된 카드 이미지가 없습니다.</div>;
  }

  return (
    <div className="card-detail-media-shell">
      <div className="card-detail-media-frame">
        <img
          src={imageUrl}
          alt={media.title}
          className="card-detail-main-image"
        />
      </div>
    </div>
  );
}