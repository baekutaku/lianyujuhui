import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import MakerPhoneShell from "@/components/maker/MakerPhoneShell";
import MakerPhoneTopBar from "@/components/maker/MakerPhoneTopBar";
import MakerPhoneTabNav from "@/components/maker/MakerPhoneTabNav";
import MakerMomentFeedPost, {
  type MakerMomentFeedItem,
} from "@/components/maker/moment/MakerMomentFeedPost";
import { getMakerActor } from "@/lib/maker/auth";
import { getMakerViewerProfile } from "@/lib/maker/profile";
import { getMakerMoment } from "@/lib/maker/moment-reader";
import { softDeleteMakerMoment } from "@/lib/maker/moment-actions";

const DEFAULT_AVATAR_MAP: Record<string, string> = {
  baiqi: "/profile/baiqi.png",
  lizeyan: "/profile/lizeyan.png",
  zhouqiluo: "/profile/zhouqiluo.png",
  xumo: "/profile/xumo.png",
  lingxiao: "/profile/lingxiao.png",
  mc: "/profile/mc.png",
  other: "/profile/npc.png",
  npc: "/profile/npc.png",
};

const DEFAULT_NAME_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
  mc: "유연",
  other: "NPC",
  npc: "NPC",
};

type PageProps = {
  params: Promise<{
    momentId: string;
  }>;
  searchParams?: Promise<{
    choice?: string;
  }>;
};

export default async function MakerMomentDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { momentId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const requestedChoiceId = String(resolvedSearchParams?.choice || "").trim();

  const actor = await getMakerActor();
  if (actor.needsInit) {
    redirect(`/maker/init?next=/maker/moments/${momentId}`);
  }

  const viewerProfile = await getMakerViewerProfile();
  const moment = await getMakerMoment(momentId);

  if (!moment) {
    notFound();
  }

  const authorKey = moment.authorKey?.trim() || "npc";
  const isViewerMoment = authorKey === "mc";

  const choiceOptions = Array.isArray(moment.payload.momentChoiceOptions)
    ? moment.payload.momentChoiceOptions.map((option) => ({
        ...option,
        replySpeakerName:
          option.replySpeakerKey?.trim() === "mc"
            ? viewerProfile.displayName
            : option.replySpeakerName?.trim() ||
              DEFAULT_NAME_MAP[option.replySpeakerKey?.trim() || "npc"] ||
              "이름 없음",
        replyTargetName:
          option.replyTargetName?.trim() || viewerProfile.displayName,
      }))
    : [];

  const selectedOptionId =
    requestedChoiceId || moment.payload.momentSelectedOptionId || null;

  const replyLines = Array.isArray(moment.payload.momentReplyLines)
    ? moment.payload.momentReplyLines
        .filter((line) => line && String(line.content ?? "").trim())
        .map((line) => ({
          ...line,
          speakerName:
            line.speakerKey?.trim() === "mc"
              ? viewerProfile.displayName
              : line.speakerName?.trim() ||
                DEFAULT_NAME_MAP[line.speakerKey?.trim() || "npc"] ||
                "이름 없음",
          targetName:
            line.isReplyToMc
              ? line.targetName?.trim() || viewerProfile.displayName
              : line.targetName?.trim() || "",
        }))
    : [];

  const comments = Array.isArray(moment.payload.momentComments)
    ? moment.payload.momentComments.map((comment) => ({
        ...comment,
        speakerName:
          comment.speakerName?.trim() ||
          DEFAULT_NAME_MAP[comment.speakerKey?.trim() || "npc"] ||
          "NPC",
        avatarUrl:
          comment.avatarUrl?.trim() ||
          DEFAULT_AVATAR_MAP[comment.speakerKey?.trim() || "npc"] ||
          "/profile/npc.png",
      }))
    : [];

  const item: MakerMomentFeedItem = {
    id: moment.id,
    title: moment.title || "",
    authorKey,
    authorName: isViewerMoment
      ? viewerProfile.displayName
      : moment.authorName?.trim() ||
        DEFAULT_NAME_MAP[authorKey] ||
        "이름 없음",
    authorAvatarUrl: isViewerMoment
      ? viewerProfile.avatarUrl
      : moment.authorAvatarUrl?.trim() ||
        DEFAULT_AVATAR_MAP[authorKey] ||
        "/profile/npc.png",
    authorHasProfile: Boolean(moment.payload.authorHasProfile),
    dateText: moment.payload.momentDateText || "",
    body: moment.payload.momentBody || "",
    imageUrls: moment.payload.momentImageUrls || [],
    replyLines,
    choiceOptions,
    selectedOptionId,
    comments,
    isFavorite: Boolean(moment.payload.isFavorite),
  };

  return (
    <MakerPhoneShell>
      <MakerPhoneTopBar
        title={moment.title}
        subtitle={item.authorName}
        backHref="/maker/moments"
        rightSlot={
  <div className="maker-top-actions">
    <Link
      href={`/maker/moments/${momentId}/edit`}
      className="maker-top-icon-button"
      aria-label="모멘트 수정"
      title="모멘트 수정"
    >
      <span className="material-symbols-rounded">edit</span>
    </Link>

    <form action={softDeleteMakerMoment}>
      <input type="hidden" name="momentId" value={momentId} />
      <button
        type="submit"
        className="maker-top-icon-button maker-top-icon-button-delete"
        aria-label="모멘트 삭제"
        title="모멘트 삭제"
      >
        <span className="material-symbols-rounded">close</span>
      </button>
    </form>
  </div>
}
      />

      <div className="phone-content">
        <div className="moment-feed">
          <MakerMomentFeedPost item={item} useChoiceModal />
        </div>
      </div>

      <MakerPhoneTabNav active="moments" />
    </MakerPhoneShell>
  );
}