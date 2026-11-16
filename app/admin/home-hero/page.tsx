import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/utils/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import HomeHeroManager, {
  type HomeHeroItem,
} from "@/components/admin/home/HomeHeroManager";

export default async function AdminHomeHeroPage() {
  const admin = await isAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  const { data, error } =
    await supabaseAdmin
      .from("home_hero_images")
      .select(
        "id, image_url, source_type, object_key, sort_order, is_active, created_at"
      )
      .order("sort_order", {
        ascending: true,
      })
      .order("created_at", {
        ascending: true,
      });

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">
          Admin / Home
        </div>

        <h1 className="page-title">
          홈 대문 일러스트
        </h1>

        <p className="page-desc">
          홈 로비 배경 이미지를 업로드하거나 URL로 추가하고
          순서·노출 여부를 관리합니다.
        </p>
      </header>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <Link
          href="/admin"
          className="nav-link"
        >
          관리자 홈
        </Link>

        <Link
          href="/"
          className="nav-link"
        >
          홈 확인
        </Link>
      </div>

      {error ? (
        <div className="error-box">
          {error.message}
        </div>
      ) : (
        <HomeHeroManager
          initialItems={
            (data ?? []) as HomeHeroItem[]
          }
        />
      )}
    </main>
  );
}
