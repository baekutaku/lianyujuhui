import Link from "next/link";

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
  loadTouchRoomInitialRelations,
  loadTouchRoomRelationCandidates,
} from "@/lib/extra/touch-room/relation-data";


function safeDecode(
  value: string
) {
  try {
    return decodeURIComponent(
      value
    );
  } catch {
    return value;
  }
}


export default async function TouchRoomEditPage({
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


  const raw =
    (await params).slug;


  const decoded =
    safeDecode(raw);


  const slugs =
    Array.from(
      new Set([
        raw,
        decoded,
      ])
    );


  const [
    {
      data: items,
      error,
    },

    {
      data: characters,
    },

    pools,
  ] =
    await Promise.all([

      supabaseAdmin
        .from(
          "extra_touch_room_items"
        )
        .select("*")
        .in(
          "slug",
          slugs
        )
        .limit(1),

      supabaseAdmin
        .from("characters")
        .select(
          "key, name_ko"
        )
        .order(
          "sort_order",
          {
            ascending: true,
          }
        ),

      loadTouchRoomRelationCandidates(),
    ]);


  if (error) {
    console.error(
      "[touch-room edit]",
      error
    );
  }


  const item =
    items?.[0];


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
            `/extra/touch-room/${encodeURIComponent(
              item.slug
            )}`
          }
          className="extra-back-link"
        >
          ← 상세
        </Link>

      </header>


      <TouchRoomForm
        mode="update"
        item={item}
        characterOptions={
          characterOptions
        }
        relations={{
          ...pools,
          ...initial,
        }}
      />


      

    </main>
  );
}
