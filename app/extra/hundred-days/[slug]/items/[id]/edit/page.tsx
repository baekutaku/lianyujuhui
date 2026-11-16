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

import HundredDaysItemForm
  from "@/components/extra/hundred-days/HundredDaysItemForm";


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
      id: string;
    }>;
}) {
  if (!(await isAdmin())) {
    redirect(
      "/admin/login"
    );
  }

  const {
    slug: rawSlug,
    id,
  } =
    await params;

  const slug =
    safeDecode(
      rawSlug
    );

  const [
    { data: series },
    { data: item },
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
        .from(
          "extra_hundred_days_items"
        )
        .select("*")
        .eq(
          "id",
          id
        )
        .maybeSingle(),
    ]);

  if (
    !series ||
    !item ||
    item.series_id !== series.id
  ) {
    notFound();
  }


  return (
    <main className="extra-page hundred-days-page">

      <header className="extra-sub-header">

        <div>

          <p className="page-eyebrow">
            EXTRA / HUNDRED DAYS / ITEM EDIT
          </p>

          <h1 className="extra-title">
            항목 수정
          </h1>

          <p className="extra-description">
            {
              item.entry_type ===
              "day"
                ? "DAY " +
                  item.day_number
                : item.title ||
                  item.entry_type
            }
          </p>

        </div>


        <Link
          href={
            "/extra/hundred-days/" +
            encodeURIComponent(
              series.slug
            )
          }
          className="extra-back-link"
        >
          ← 상세
        </Link>

      </header>


      <HundredDaysItemForm
        mode="update"
        series={series}
        item={item}
      />

    </main>
  );
}
