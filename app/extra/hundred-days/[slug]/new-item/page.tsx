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

  const {
    data: series,
  } =
    await supabaseAdmin
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
      .maybeSingle();

  if (!series) {
    notFound();
  }


  return (
    <main className="extra-page hundred-days-page">

      <header className="extra-sub-header">

        <div>

          <p className="page-eyebrow">
            EXTRA / HUNDRED DAYS / ITEM
          </p>

          <h1 className="extra-title">
            항목 등록
          </h1>

          <p className="extra-description">
            {
              series.title_ko ||
              series.title_cn
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
        mode="create"
        series={series}
      />

    </main>
  );
}
