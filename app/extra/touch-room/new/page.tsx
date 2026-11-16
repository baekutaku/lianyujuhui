import Link
  from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  isAdmin,
} from "@/lib/utils/admin-auth";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

import TouchRoomForm
  from "@/components/extra/touch-room/TouchRoomForm";

import {
  loadTouchRoomRelationCandidates,
} from "@/lib/extra/touch-room/relation-data";


export default async function Page() {
  if (
    !(await isAdmin())
  ) {
    redirect(
      "/admin/login"
    );
  }


  const [
    { data: characters },
    relations,
  ] =
    await Promise.all([

      supabaseAdmin
        .from("characters")
        .select(
          "key, name_ko"
        )
        .order(
          "sort_order",
          { ascending: true }
        ),

      loadTouchRoomRelationCandidates(),
    ]);


  const characterOptions =
    (characters ?? []).map(
      (item: any) => ({
        value:
          item.key,

        label:
          item.name_ko ||
          item.key,
      })
    );


  return (
    <main className="extra-page">

      <header className="extra-sub-header">

        <div>

          <p className="page-eyebrow">
            EXTRA / TOUCH ROOM / NEW
          </p>

          <h1 className="extra-title">
            터치룸 음성 등록
          </h1>

          <p className="extra-description">
            YouTube Shorts 영상과
            원문 · 번역을 함께 정리합니다.
          </p>

        </div>


        <Link
          href="/extra/touch-room"
          className="extra-back-link"
        >
          ← 터치룸 목록
        </Link>

      </header>


      <TouchRoomForm
        mode="create"
        characterOptions={
          characterOptions
        }
        relations={
          relations
        }
      />

    </main>
  );
}
