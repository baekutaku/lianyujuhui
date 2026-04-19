import Link from "next/link";
import { redirect } from "next/navigation";
import MakerPhoneShell from "@/components/maker/MakerPhoneShell";
import MakerPhoneTopBar from "@/components/maker/MakerPhoneTopBar";
import MakerPhoneTabNav from "@/components/maker/MakerPhoneTabNav";
import MakerMomentFeedPost, {
  type MakerMomentFeedItem,
} from "@/components/maker/moment/MakerMomentFeedPost";
import { getMakerActor } from "@/lib/maker/auth";
import { getMakerViewerProfile } from "@/lib/maker/profile";
import { listMakerMoments } from "@/lib/maker/moment-reader";

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

export default async function MakerMomentsPage() {
  const actor = await getMakerActor();

  if (actor.needsInit) {
    redirect("/maker/init?next=/maker/moments");
  }

  const viewerProfile = await getMakerViewerProfile();
  const moments = await listMakerMoments();

  return (
    <MakerPhoneShell>
      <MakerPhoneTopBar
        title="모멘트"
        subtitle="내가 만든 게시글"
        backHref="/maker/me"
        rightSlot={
          <Link
            href="/maker/moments/new"
            className="phone-topbar-history-button"
            aria-label="모멘트 추가"
            title="모멘트 추가"
          >
            추가
          </Link>
        }
      />

      <div className="phone-content">
        {moments.length > 0 ? (
          <div className="moment-feed">
            {moments.map((moment) => {
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
  selectedOptionId: moment.payload.momentSelectedOptionId || null,
  comments,
  isFavorite: Boolean(moment.payload.isFavorite),
};

              return <MakerMomentFeedPost key={moment.id} item={item} />;
            })}
          </div>
        ) : (
          <div className="phone-empty">아직 만든 모멘트가 없음</div>
        )}
      </div>

      <MakerPhoneTabNav active="moments" />
    </MakerPhoneShell>
  );
}