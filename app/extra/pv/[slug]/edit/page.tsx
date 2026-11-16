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

import PvForm
  from "@/components/extra/pv/PvForm";

import {
  deleteExtraPv,
  updateExtraPv,
} from "@/app/extra/pv/actions";

import {
  loadPvInitialRelations,
  loadPvRelationCandidates,
} from "@/lib/extra/pv/relation-data";


export default async function Page({
  params,
}: {
  params:
    Promise<{
      slug: string;
    }>;
}) {

  const admin =
    await isAdmin();


  if (!admin) {
    redirect(
      "/admin/login"
    );
  }


  const { slug } =
    await params;


  const { data: item } =
    await supabaseAdmin
      .from(
        "extra_pv_items"
      )
      .select("*")
      .eq(
        "slug",
        slug
      )
      .maybeSingle();


  if (!item) {
    notFound();
  }


  const pools =
    await loadPvRelationCandidates();


  const initial =
    await loadPvInitialRelations(
      item.id,
      pools
    );


  const relations = {
    ...pools,
    ...initial,
  };


  return (
    <main className="extra-page">

      <header className="extra-sub-header">

        <div>

          <p className="page-eyebrow">
            EXTRA / PV / EDIT
          </p>

          <h1 className="extra-title">
            PV 수정
          </h1>

        </div>


        <Link
          href={
            `/extra/pv/${item.slug}`
          }
          className="extra-back-link"
        >
          ← 상세
        </Link>

      </header>


      <PvForm
        action={
          updateExtraPv
        }
        item={item}
        relations={
          relations
        }
      />


      <form
        action={
          deleteExtraPv
        }
        className="extra-pv-delete-form"
      >

        <input
          type="hidden"
          name="id"
          value={item.id}
        />

        <button
          type="submit"
          className="nav-link"
        >
          PV 삭제
        </button>

      </form>

    </main>
  );
}
