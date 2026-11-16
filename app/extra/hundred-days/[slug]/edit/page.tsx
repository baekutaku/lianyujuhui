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

import HundredDaysSeriesForm
  from "@/components/extra/hundred-days/HundredDaysSeriesForm";


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


export default async function Page({
  params,
}: {
  params:
    Promise<{
      slug: string;
    }>;
}) {
  if (!(await isAdmin())) {
    redirect(
      "/admin/login"
    );
  }

  const {
    slug: rawSlug,
  } =
    await params;

  const slug =
    safeDecode(
      rawSlug
    );

  const [
    { data: item },
    { data: characters },
  ] =
    await Promise.all([
      supabaseAdmin
        .from(
          "extra_hundred_days_series"
        )
        .select("*")
        .in(
          "slug",
          Array.from(
            new Set([
              rawSlug,
              slug,
            ])
          )
        )
        .maybeSingle(),

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
    ]);

  if (!item) {
    notFound();
  }

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
            EXTRA / HUNDRED DAYS / EDIT
          </p>

          <h1 className="extra-title">
            시리즈 수정
          </h1>
        </div>


        <Link
          href={
            "/extra/hundred-days/" +
            encodeURIComponent(
              item.slug
            )
          }
          className="extra-back-link"
        >
          ← 상세
        </Link>

      </header>


      <HundredDaysSeriesForm
        mode="update"
        item={item}
        characterOptions={
          characterOptions
        }
      />

    </main>
  );
}
