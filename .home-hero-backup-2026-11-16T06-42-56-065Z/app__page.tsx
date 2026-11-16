import { supabase } from "@/lib/supabase/server";
import HomeMixedBody from "@/components/home/HomeMixedBody";
import HomeLobby from "@/components/home/HomeLobby";

export const revalidate = 60;

// 홈 일러스트 풀. 나중에 백기 중심 이미지 URL만 넣으면 랜덤 로비 배경으로 사용됩니다.
const LEGACY_HERO_IMAGES = [
  "https://lianyujuhui.ivyro.net/data/file/pic/3553024586_ojVXpgCP_4d95c7745a8dc657d729f07a2e87839e4bd16757.jpg",
  "https://lianyujuhui.ivyro.net/data/file/pic/3553024586_cY85vLGD_92725175f100fb07e6de1c870635c59e337d93b2.jpg",
  "https://lianyujuhui.ivyro.net/data/editor/2601/8fb0c6d84c29941dd6950c3779c934de_1768844981_1157.jpg",
];

function getRandomHeroImage(images: string[]) {
  const pool =
    images.length > 0
      ? images
      : LEGACY_HERO_IMAGES;

  return (
    pool[Math.floor(Math.random() * pool.length)] ??
    LEGACY_HERO_IMAGES[0]
  );
}

export default async function HomePage() {
  const [
    { data: siteUpdates },
    { data: latestMainStory },
    { data: featuredEvent },
    { data: homeHeroImages },
  ] =
    await Promise.all([
      supabase
        .from("site_updates")
        .select("id, title, body, category, target_area, is_pinned, published_at")
        .eq("is_published", true)
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("stories")
        .select("id, title, slug, release_date, release_year, created_at")
        .eq("is_published", true)
        .eq("subtype", "main_story")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("events")
        .select("id, title, slug, summary, start_date, end_date, thumbnail_url, created_at")
        .eq("is_published", true)
        .order("start_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    
      supabase
        .from("home_hero_images")
        .select("image_url")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

  const mainStoryPreview = latestMainStory
    ? {
        title: latestMainStory.title,
        href: `/stories/${encodeURIComponent(latestMainStory.slug)}`,
        meta:
          latestMainStory.release_date ||
          (latestMainStory.release_year ? String(latestMainStory.release_year) : "") ||
          latestMainStory.created_at?.slice(0, 10) ||
          "",
      }
    : null;

  const eventPreview = featuredEvent
    ? {
        id: featuredEvent.id,
        title: featuredEvent.title,
        href: `/events/${encodeURIComponent(featuredEvent.slug)}`,
        thumb: featuredEvent.thumbnail_url,
        startDate: featuredEvent.start_date,
        endDate: featuredEvent.end_date,
        summary: featuredEvent.summary,
      }
    : null;

  return (
    <main className="home-page home-page-game">
      <HomeMixedBody
        updates={siteUpdates ?? []}
        lead={
          <HomeLobby
            heroImage={getRandomHeroImage(
              (homeHeroImages ?? [])
                .map((item: { image_url: string | null }) => item.image_url)
                .filter((value): value is string => Boolean(value))
            )}
            updates={siteUpdates ?? []}
            mainStory={mainStoryPreview}
            featuredEvent={eventPreview}
          />
        }
      />
    </main>
  );
}
