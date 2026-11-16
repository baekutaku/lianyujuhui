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

import MailForm
  from "@/components/extra/mail/MailForm";

import {
  createExtraMail,
} from "@/app/extra/mail/actions";

import {
  loadMailRelationCandidates,
} from "@/lib/extra/mail/relation-data";


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

      loadMailRelationCandidates(),
    ]);


  const characterOptions =
    (characters ?? []).map(
      (item: any) => ({
        value: item.key,
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
            EXTRA / MAIL / NEW
          </p>

          <h1 className="extra-title">
            우편 등록
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
          createExtraMail
        }
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

