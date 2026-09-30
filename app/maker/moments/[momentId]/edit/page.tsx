import { notFound, redirect } from "next/navigation";
import MakerMomentForm from "@/components/maker/moment/MakerMomentForm";
import MakerPhoneShell from "@/components/maker/MakerPhoneShell";
import MakerPhoneTopBar from "@/components/maker/MakerPhoneTopBar";
import MakerPhoneTabNav from "@/components/maker/MakerPhoneTabNav";
import { getMakerActor } from "@/lib/maker/auth";
import { getMakerMoment } from "@/lib/maker/moment-reader";
import { updateMakerMomentFromForm } from "@/lib/maker/moment-actions";

type PageProps = {
  params: Promise<{
    momentId: string;
  }>;
};

export default async function MakerMomentEditPage({ params }: PageProps) {
  const { momentId } = await params;

  const actor = await getMakerActor();
  if (actor.needsInit) {
    redirect(`/maker/init?next=/maker/moments/${momentId}/edit`);
  }

  const moment = await getMakerMoment(momentId);

  if (!moment) {
    notFound();
  }

  const payload = moment.payload;

  return (
    <MakerPhoneShell>
      <MakerPhoneTopBar
        title="모멘트 수정"
        subtitle={moment.title?.trim() || "메이커"}
        backHref={`/maker/moments/${momentId}`}
      />

      <div className="maker-phone-content" style={{ padding: 16 }}>
        <MakerMomentForm
          action={updateMakerMomentFromForm}
          submitLabel="저장"
          hiddenFields={<input type="hidden" name="momentId" value={momentId} />}
          initialValues={{
            moment_title: moment.title ?? "",
            moment_author_key: moment.authorKey ?? "mc",
            moment_author_name: moment.authorName ?? "",
            moment_author_avatar_url: moment.authorAvatarUrl ?? "",
            moment_author_has_profile: payload.authorHasProfile ?? true,

            moment_category: payload.momentCategory ?? "daily",
            moment_year:
              typeof payload.momentYear === "number"
                ? String(payload.momentYear)
                : "",
            moment_date_text: payload.momentDateText ?? "",

            moment_body: payload.momentBody ?? "",
            moment_summary: payload.momentSummary ?? "",
            moment_source: payload.momentSource ?? "",

            moment_image_urls_text: Array.isArray(payload.momentImageUrls)
              ? payload.momentImageUrls.join("\n")
              : "",

            moment_choice_options_json: Array.isArray(payload.momentChoiceOptions)
              ? JSON.stringify(payload.momentChoiceOptions, null, 2)
              : "[]",

            moment_reply_lines_json: Array.isArray(payload.momentReplyLines)
              ? JSON.stringify(payload.momentReplyLines, null, 2)
              : "[]",

            moment_comments_json: Array.isArray(payload.momentComments)
              ? JSON.stringify(payload.momentComments, null, 2)
              : "[]",

            moment_is_favorite: Boolean(payload.isFavorite),
            moment_is_complete: Boolean(payload.isComplete),
          }}
        />
      </div>

      <MakerPhoneTabNav active="moments" />
    </MakerPhoneShell>
  );
}