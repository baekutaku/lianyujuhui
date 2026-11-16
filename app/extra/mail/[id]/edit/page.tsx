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

import MailForm
  from "@/components/extra/mail/MailForm";

import {
  deleteExtraMail,
  updateExtraMail,
} from "@/app/extra/mail/actions";

import {
  loadMailInitialRelations,
  loadMailRelationCandidates,
} from "@/lib/extra/mail/relation-data";


export default async function Page({
  params,
}: {
  params:
    Promise<{
      id: string;
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
    id,
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
          "extra_mail_items"
        )
        .select("*")
        .eq(
          "id",
          id
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

      loadMailRelationCandidates(),
    ]);


  if (!item) {
    notFound();
  }


  const initial =
    await loadMailInitialRelations(
      item.id,
      pools
    );


  const characterOptions =
    (characters ?? []).map(
      (row: any) => ({
        value: row.key,
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
            EXTRA / MAIL / EDIT
          </p>

          <h1 className="extra-title">
            우편 수정
          </h1>

        </div>


        <Link
          href="/extra/mail"
          className="extra-back-link"
        >
          ← 우편 목록
        </Link>

      </header>


      <MailForm
        action={
          updateExtraMail
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
          deleteExtraMail
        }
        className="extra-mail-delete-form"
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
          우편 삭제
        </button>

      </form>

    </main>
  );
}

