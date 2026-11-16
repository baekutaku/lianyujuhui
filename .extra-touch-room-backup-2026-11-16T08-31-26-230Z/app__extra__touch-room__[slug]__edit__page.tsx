import Link
  from "next/link";

import {
  notFound,
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
  deleteTouchRoomItem,
  updateTouchRoomItem,
} from "@/app/extra/touch-room/actions";

import {
  loadTouchRoomInitialRelations,
  loadTouchRoomRelationCandidates,
} from "@/lib/extra/touch-room/relation-data";


export default async function Page({
  params,
}: {
  params:
    Promise<{
      slug: string;
    }>;
}) {
  if (
    !(await isAdmin())
  ) {
    redirect(
      "/admin/login"
    );
  }


  const {
    slug,
  } =
    await params;


  const [
    { data: item },
    { data: characters },
    pools,
  ] =
    await Promise.all([

      supabaseAdmin
        .from(
          "extra_touch_room_items"
        )
        .select("*")
        .eq(
          "slug",
          slug
        )
        .maybeSingle(),

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


  if (!item) {
    notFound();
  }


  const initial =
    await loadTouchRoomInitialRelations(
      item.id,
      pools
    );


  const characterOptions =
    (characters ?? []).map(
      (row: any) => ({
        value:
          row.key,

        label:
          row.name_ko ||
          row.key,
      })
    );


  return (
    <main className="extra-page">

      <header className="extra-sub-header">

        <div>

          <p className="page-eyebrow">
            EXTRA / TOUCH ROOM / EDIT
          </p>

          <h1 className="extra-title">
            터치룸 음성 수정
          </h1>

        </div>


        <Link
          href={
            "/extra/touch-room/" +
            item.slug
          }
          className="extra-back-link"
        >
          ← 상세
        </Link>

      </header>


      <TouchRoomForm
        action={
          updateTouchRoomItem
        }
        item={item}
        characterOptions={
          characterOptions
        }
        relations={{
          ...pools,
          ...initial,
        }}
      />


      <form
        action={
          deleteTouchRoomItem
        }
        className="touch-room-delete-form"
      >

        <input
          type="hidden"
          name="id"
          value={item.id}
        />

        <button
          type="submit"
          className="mini-button"
        >
          터치룸 음성 삭제
        </button>

      </form>

    </main>
  );
}
