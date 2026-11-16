import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  isAdmin,
} from "@/lib/utils/admin-auth";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

import HundredDaysSeriesForm
  from "@/components/extra/hundred-days/HundredDaysSeriesForm";


export default async function Page() {
  if (!(await isAdmin())) {
    redirect(
      "/admin/login"
    );
  }

  const {
    data: characters,
  } =
    await supabaseAdmin
      .from("characters")
      .select(
        "key, name_ko"
      )
      .order(
        "sort_order",
        {
          ascending: true,
        }
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
    <main className="extra-page hundred-days-page">

      <header className="extra-sub-header">

        <div>
          <p className="page-eyebrow">
            EXTRA / HUNDRED DAYS / NEW
          </p>

          <h1 className="extra-title">
            백일동반 시리즈 등록
          </h1>
        </div>


        <Link
          href="/extra/hundred-days"
          className="extra-back-link"
        >
          ← 목록
        </Link>

      </header>


      <HundredDaysSeriesForm
        mode="create"
        characterOptions={
          characterOptions
        }
      />

    </main>
  );
}
