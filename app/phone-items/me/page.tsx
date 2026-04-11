import { supabase } from "@/lib/supabase/server";
import PhoneMeScreen from "@/components/phone/PhoneMeScreen";
import PhoneTabNav from "@/components/phone/PhoneTabNav";

type PhoneItemRow = {
  id: string;
  subtype: string;
  content_json?: {
    characterKey?: string;
  } | null;
};

const CHARACTERS = [
  { key: "baiqi", label: "백기", avatarUrl: "/profile/baiqi.png", affinity: 51 },
  { key: "lizeyan", label: "이택언", avatarUrl: "/profile/lizeyan.png", affinity: 43 },
  { key: "zhouqiluo", label: "주기락", avatarUrl: "/profile/zhouqiluo.png", affinity: 41 },
  { key: "xumo", label: "허묵", avatarUrl: "/profile/xumo.png", affinity: 40 },
  { key: "lingxiao", label: "연시호", avatarUrl: "/profile/lingxiao.png", affinity: 17 },
] as const;

function getMomentCount(items: PhoneItemRow[], characterKey: string) {
  return items.filter(
    (item) =>
      item.content_json?.characterKey === characterKey &&
      item.subtype === "moment"
  ).length;
}

export default async function PhoneMePage() {
  const [
    { data: phoneItems, error: phoneError },
    { data: profiles, error: profileError },
  ] = await Promise.all([
    supabase
      .from("phone_items")
      .select("id, subtype, content_json")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),

    supabase
      .from("phone_profile_options")
      .select("id, title, image_url, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  if (phoneError) throw new Error(phoneError.message);
  if (profileError) throw new Error(profileError.message);

  const items = (phoneItems as PhoneItemRow[] | null) ?? [];

  const characters = CHARACTERS.map((character) => ({
    ...character,
    moments: getMomentCount(items, character.key),
  }));

  return (
    <main
      className="phone-page-root"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "start center",
        padding: "24px 0 40px",
      }}
    >
      <div
        className="phone-page-frame"
        style={{
          width: "100%",
          maxWidth: 520,
          minHeight: 820,
          display: "flex",
          flexDirection: "column",
          background: "rgba(255,255,255,0.78)",
          borderRadius: 30,
          overflow: "hidden",
          border: "1px solid rgba(226, 208, 224, 0.7)",
          boxShadow: "0 10px 30px rgba(196, 177, 199, 0.12)",
        }}
      >
        <div
          className="phone-page-content"
          style={{
            flex: 1,
            minHeight: 0,
          }}
        >
          <PhoneMeScreen
            viewerName="유연"
            defaultAvatarUrl="/profile/mc.png"
            characters={characters}
            profileOptions={
              profiles?.map((item) => ({
                id: item.id,
                title: item.title ?? "",
                imageUrl: item.image_url,
              })) ?? []
            }
          />
        </div>

        <div
          className="phone-page-tabbar"
          style={{
            marginTop: "auto",
            borderTop: "1px solid rgba(220, 210, 220, 0.7)",
            background: "rgba(255,255,255,0.94)",
            padding: "8px 10px 10px",
          }}
        >
          <PhoneTabNav currentPath="/phone-items/me" />
        </div>
      </div>
    </main>
  );
}