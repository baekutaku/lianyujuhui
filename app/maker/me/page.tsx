import { redirect } from "next/navigation";
import MakerPhoneShell from "@/components/maker/MakerPhoneShell";
import MakerPhoneTopBar from "@/components/maker/MakerPhoneTopBar";
import MakerPhoneTabNav from "@/components/maker/MakerPhoneTabNav";
import MakerProfileScreen from "@/components/maker/profile/MakerProfileScreen";
import { getMakerActor } from "@/lib/maker/auth";
import { getMakerViewerProfile } from "@/lib/maker/profile";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function MakerMePage() {
  const actor = await getMakerActor();

  if (actor.needsInit) {
    redirect("/maker/init?next=/maker/me");
  }

  const viewer = await getMakerViewerProfile();

  const [{ count: messageCount }, { count: momentCount }] = await Promise.all([
    supabaseAdmin
      .from("maker_message_threads")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", actor.ownerId)
      .eq("is_deleted", false),
    supabaseAdmin
      .from("maker_moments")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", actor.ownerId)
      .eq("is_deleted", false),
  ]);

  return (
    <MakerPhoneShell>
      <MakerPhoneTopBar title="나" subtitle="프로필" />
      <div className="maker-phone-content">
        <MakerProfileScreen
          displayName={viewer.displayName}
          avatarUrl={viewer.avatarUrl}
          baseProfileOptions={viewer.baseProfileOptions}
          customProfileOptions={viewer.customProfileOptions}
          selectedSourceType={viewer.selectedSourceType}
          selectedSourceId={viewer.selectedSourceId}
          messageCount={messageCount ?? 0}
          momentCount={momentCount ?? 0}
        />
      </div>
      <MakerPhoneTabNav active="me" />
    </MakerPhoneShell>
  );
}