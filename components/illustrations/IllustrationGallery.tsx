"use client";

import { useMemo, useState } from "react";

type GalleryImage = {
  id?: string | null;
  url: string;
  isPrimary?: boolean | null;
};

type IllustrationGalleryProps = {
  title: string;
  images: GalleryImage[];
  primaryUrl?: string | null;
};

export default function IllustrationGallery({
  title,
  images,
  primaryUrl,
}: IllustrationGalleryProps) {
  const normalized = useMemo(() => {
    const seen = new Set<string>();
    const result: GalleryImage[] = [];

    for (const item of images) {
      const url = String(item?.url || "").trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      result.push({ ...item, url });
    }

    return result;
  }, [images]);

  const preferred =
    String(primaryUrl || "").trim() ||
    normalized.find((item) => item.isPrimary)?.url ||
    normalized[0]?.url ||
    "";

  const [activeUrl, setActiveUrl] = useState(preferred);

  return (
    <section className="illustration-detail-gallery">
      <div className="illustration-detail-main">
        {activeUrl ? (
          <img src={activeUrl} alt={title} />
        ) : (
          <div className="story-thumb-empty">NO IMAGE</div>
        )}
      </div>

      {normalized.length > 1 ? (
        <div className="illustration-detail-thumbs-wrap">
          <div className="illustration-detail-thumbs-label">
            <span>IMAGES</span>
            <strong>{normalized.length}</strong>
          </div>

          <div className="illustration-detail-thumbs" role="list">
            {normalized.map((item, index) => {
              const active = item.url === activeUrl;

              return (
                <button
                  key={`${item.id || "image"}-${index}-${item.url}`}
                  type="button"
                  className={`illustration-detail-thumb${
                    active ? " is-active" : ""
                  }`}
                  onClick={() => setActiveUrl(item.url)}
                  aria-label={`${title} 이미지 ${index + 1} 보기`}
                  aria-pressed={active}
                  role="listitem"
                >
                  <img src={item.url} alt="" />
                  {item.isPrimary ? (
                    <span
                      className="material-symbols-rounded"
                      aria-label="대표 이미지"
                      title="대표 이미지"
                    >
                      star
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
