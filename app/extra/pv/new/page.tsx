import Link
  from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  isAdmin,
} from "@/lib/utils/admin-auth";

import PvForm
  from "@/components/extra/pv/PvForm";

import {
  createExtraPv,
} from "@/app/extra/pv/actions";

import {
  loadPvRelationCandidates,
} from "@/lib/extra/pv/relation-data";


export default async function Page() {

  const admin =
    await isAdmin();


  if (!admin) {
    redirect(
      "/admin/login"
    );
  }


  const relations =
    await loadPvRelationCandidates();


  return (
    <main className="extra-page">

      <header className="extra-sub-header">

        <div>

          <p className="page-eyebrow">
            EXTRA / PV / NEW
          </p>

          <h1 className="extra-title">
            PV / 공식 영상 등록
          </h1>

          <p className="extra-description">
            PV 전용 등록 화면입니다.
          </p>

        </div>


        <Link
          href="/extra/pv"
          className="extra-back-link"
        >
          ← PV 목록
        </Link>

      </header>


      <PvForm
        action={
          createExtraPv
        }
        relations={
          relations
        }
      />

    </main>
  );
}
