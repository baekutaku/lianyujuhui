"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

type GalleryImage = {
  id?: string | null;
  url: string;
};

type CardMedia = {
  beforeThumb?: string | null;
  afterThumb?: string | null;
  beforeCover?: string | null;
  afterCover?: string | null;
  title: string;
  gallery?: GalleryImage[];
};

type Pan = {
  x: number;
  y: number;
};

type MainMode = "before" | "after" | "gallery";

type ViewerItem = {
  key: string;
  url: string;
  label: string;
  kind: "before" | "after" | "extra";
  extraIndex?: number;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export default function CardDetailMediaSwitcher({
  media,
}: {
  media: CardMedia;
}) {
  const beforeUrl =
    media.beforeCover ||
    media.beforeThumb ||
    media.afterCover ||
    media.afterThumb ||
    "";

  const afterUrl =
    media.afterCover ||
    media.afterThumb ||
    media.beforeCover ||
    media.beforeThumb ||
    "";

  const hasAfter = Boolean(media.afterCover || media.afterThumb);

  const [mode, setMode] = useState<MainMode>("before");
  const [galleryUrl, setGalleryUrl] = useState("");

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);

  const gallery = useMemo(() => {
    const seen = new Set<string>();
    const result: GalleryImage[] = [];

    for (const item of media.gallery ?? []) {
      const url = String(item?.url || "").trim();
      if (!url || seen.has(url)) continue;

      seen.add(url);
      result.push({ ...item, url });
    }

    return result;
  }, [media.gallery]);

  const extraGallery = useMemo(
    () =>
      gallery.filter(
        (item) => item.url !== beforeUrl && item.url !== afterUrl
      ),
    [gallery, beforeUrl, afterUrl]
  );

  /*
    상세 페이지 UI에서는 진화 전/후와 기타 이미지를 분리해서 보여주되,
    돋보기 안에서는 이 카드의 모든 이미지를 하나의 순서로 이어 본다.
  */
  const viewerItems = useMemo(() => {
    const seen = new Set<string>();
    const items: ViewerItem[] = [];

    if (beforeUrl && !seen.has(beforeUrl)) {
      seen.add(beforeUrl);
      items.push({
        key: "before",
        url: beforeUrl,
        label: "진화 전",
        kind: "before",
      });
    }

    if (hasAfter && afterUrl && !seen.has(afterUrl)) {
      seen.add(afterUrl);
      items.push({
        key: "after",
        url: afterUrl,
        label: "진화 후",
        kind: "after",
      });
    }

    extraGallery.forEach((item, index) => {
      if (!item.url || seen.has(item.url)) return;

      seen.add(item.url);
      items.push({
        key: `extra-${item.id || index}`,
        url: item.url,
        label: `추가 이미지 ${index + 1}`,
        kind: "extra",
        extraIndex: index,
      });
    });

    return items;
  }, [beforeUrl, afterUrl, hasAfter, extraGallery]);

  const imageUrl =
    mode === "gallery" && galleryUrl
      ? galleryUrl
      : mode === "after"
        ? afterUrl
        : beforeUrl;

  const viewerItem = viewerItems[viewerIndex] ?? null;
  const viewerUrl = viewerItem?.url || "";

  function resetViewerTransform() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    dragRef.current = null;
  }

  function closeViewer() {
    setViewerOpen(false);
    resetViewerTransform();
  }

  function showBefore() {
    setMode("before");
    setGalleryUrl("");
  }

  function showAfter() {
    setMode("after");
    setGalleryUrl("");
  }

  function selectExtra(url: string) {
    setGalleryUrl(url);
    setMode("gallery");
  }

  function openViewer() {
    if (!imageUrl || viewerItems.length === 0) return;

    const index = viewerItems.findIndex(
      (item) => item.url === imageUrl
    );

    setViewerIndex(index >= 0 ? index : 0);
    resetViewerTransform();
    setViewerOpen(true);
  }

  function moveViewer(direction: -1 | 1) {
    if (viewerItems.length <= 1) return;

    setViewerIndex((current) => {
      return (
        (current + direction + viewerItems.length) %
        viewerItems.length
      );
    });

    resetViewerTransform();
  }

  function changeZoom(nextZoom: number) {
    const clamped = clampZoom(nextZoom);
    setZoom(clamped);

    if (clamped === 1) {
      setPan({ x: 0, y: 0 });
    }
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    changeZoom(zoom + (event.deltaY < 0 ? 0.2 : -0.2));
  }

  function handlePointerDown(
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    if (zoom <= 1) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    setPan({
      x: drag.panX + (event.clientX - drag.startX),
      y: drag.panY + (event.clientY - drag.startY),
    });
  }

  function endPointer(
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (viewerOpen && !dialog.open) {
      dialog.showModal();
    } else if (!viewerOpen && dialog.open) {
      dialog.close();
    }
  }, [viewerOpen]);

  useEffect(() => {
    if (!viewerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveViewer(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveViewer(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewerOpen, viewerItems.length]);

  if (!imageUrl) {
    return (
      <div className="empty-box">
        등록된 카드 이미지가 없습니다.
      </div>
    );
  }

  return (
    <div className="card-detail-media-shell">
      <div className="card-detail-media-toolbar">
        <div className="card-detail-media-toolbar-tabs">
          {hasAfter ? (
            <>
              <button
                type="button"
                className={`card-detail-tab ${
                  mode === "before" ? "is-active" : ""
                }`}
                onClick={showBefore}
              >
                진화 전
              </button>

              <button
                type="button"
                className={`card-detail-tab ${
                  mode === "after" ? "is-active" : ""
                }`}
                onClick={showAfter}
              >
                진화 후
              </button>
            </>
          ) : (
            <span className="card-detail-media-toolbar-label">
              카드 이미지
            </span>
          )}
        </div>

        <div className="card-detail-media-toolbar-actions">
          <button
            type="button"
            className="card-detail-image-zoom-button"
            onClick={openViewer}
            aria-label="이미지 확대"
            title="확대 보기"
          >
            <span className="material-symbols-rounded">
              zoom_in
            </span>
          </button>

          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="card-detail-image-original-button"
            aria-label="원본 이미지 새 탭에서 보기"
            title="원본 보기"
          >
            <span className="material-symbols-rounded">
              open_in_new
            </span>
            <span>원본 보기</span>
          </a>
        </div>
      </div>

      <div
        className={`card-detail-media-frame${
          mode === "gallery"
            ? " is-extra-image"
            : " is-card-image"
        }`}
      >
        <img
          src={imageUrl}
          alt={
            mode === "gallery"
              ? `${media.title} 추가 이미지`
              : `${media.title} ${
                  mode === "after" ? "진화 후" : "진화 전"
                }`
          }
          className={`card-detail-main-image${
            mode === "gallery"
              ? " is-extra-image"
              : " is-card-image"
          }`}
          decoding="async"
        />
      </div>

      {extraGallery.length > 0 ? (
        <div className="card-detail-extra-gallery">
          <div
            className={`card-detail-extra-grid${
              extraGallery.length <= 4 ? " is-compact" : ""
            }`}
            role="list"
          >
            {extraGallery.map((item, index) => {
              const active =
                mode === "gallery" &&
                galleryUrl === item.url;

              return (
                <button
                  key={`${item.id || "image"}-${index}-${item.url}`}
                  type="button"
                  className={`card-detail-extra-thumb${
                    active ? " is-active" : ""
                  }`}
                  onClick={() => selectExtra(item.url)}
                  aria-label={`${media.title} 추가 이미지 ${
                    index + 1
                  }`}
                  aria-pressed={active}
                  role="listitem"
                >
                  <img
                    src={item.url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <dialog
        ref={dialogRef}
        className="card-image-viewer card-image-viewer-dialog"
        aria-label={`${media.title} 이미지 확대 보기`}
        onCancel={(event) => {
          event.preventDefault();
          closeViewer();
        }}
        onClose={() => {
          if (viewerOpen) {
            setViewerOpen(false);
          }
        }}
      >
        {viewerUrl ? (
          <>
            <button
              type="button"
              className="card-image-viewer-close"
              onClick={closeViewer}
              aria-label="닫기"
            >
              <span className="material-symbols-rounded">
                close
              </span>
            </button>

            {viewerItems.length > 1 ? (
              <>
                <button
                  type="button"
                  className="card-image-viewer-nav is-prev"
                  onClick={() => moveViewer(-1)}
                  aria-label="이전 이미지"
                >
                  <span className="material-symbols-rounded">
                    chevron_left
                  </span>
                </button>

                <button
                  type="button"
                  className="card-image-viewer-nav is-next"
                  onClick={() => moveViewer(1)}
                  aria-label="다음 이미지"
                >
                  <span className="material-symbols-rounded">
                    chevron_right
                  </span>
                </button>
              </>
            ) : null}

            <div
              className={`card-image-viewer-stage${
                zoom > 1 ? " is-zoomed" : ""
              }`}
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endPointer}
              onPointerCancel={endPointer}
              onDoubleClick={() =>
                changeZoom(zoom > 1 ? 1 : 2)
              }
            >
              <img
                src={viewerUrl}
                alt={`${media.title} ${
                  viewerItem?.label || "원본 이미지"
                }`}
                draggable={false}
                style={{
                  transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                }}
              />
            </div>

            <div className="card-image-viewer-toolbar">
              <a
                href={viewerUrl}
                target="_blank"
                rel="noreferrer"
                className="card-image-viewer-original"
              >
                <span className="material-symbols-rounded">
                  open_in_new
                </span>
                <span>원본</span>
              </a>

              <button
                type="button"
                onClick={() => changeZoom(zoom - 0.25)}
                disabled={zoom <= MIN_ZOOM}
                aria-label="축소"
              >
                <span className="material-symbols-rounded">
                  zoom_out
                </span>
              </button>

              <span>{Math.round(zoom * 100)}%</span>

              <button
                type="button"
                onClick={() => changeZoom(zoom + 0.25)}
                disabled={zoom >= MAX_ZOOM}
                aria-label="확대"
              >
                <span className="material-symbols-rounded">
                  zoom_in
                </span>
              </button>

              <button
                type="button"
                onClick={resetViewerTransform}
                aria-label="확대 초기화"
              >
                <span className="material-symbols-rounded">
                  restart_alt
                </span>
              </button>
            </div>

            <div className="card-image-viewer-hint">
              <span>
                {viewerIndex + 1} / {viewerItems.length}
                {" · "}
                {viewerItem?.label || "이미지"}
              </span>

              <span>
                원본 비율 · 휠 확대 · 확대 후 드래그 · 더블클릭
              </span>
            </div>
          </>
        ) : null}
      </dialog>
    </div>
  );
}
