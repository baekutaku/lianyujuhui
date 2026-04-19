// import Link from "next/link";
// import { notFound } from "next/navigation";
// import PhoneShell from "@/components/phone/PhoneShell";
// import PhoneTopBar from "@/components/phone/PhoneTopBar";
// import PhoneTabNav from "@/components/phone/PhoneTabNav";
// import MessageThreadView from "@/components/phone/message/MessageThreadView";
// import { supabase } from "@/lib/supabase/server";
// import { getCurrentViewerProfile } from "@/lib/phone/get-current-viewer-profile";

// const DEFAULT_AVATAR_MAP: Record<string, string> = {
//   baiqi: "/profile/baiqi.png",
//   lizeyan: "/profile/lizeyan.png",
//   zhouqiluo: "/profile/zhouqiluo.png",
//   xumo: "/profile/xumo.png",
//   lingxiao: "/profile/lingxiao.png",
// };

// const DEFAULT_NAME_MAP: Record<string, string> = {
//   baiqi: "백기",
//   lizeyan: "이택언",
//   zhouqiluo: "주기락",
//   xumo: "허묵",
//   lingxiao: "연시호",
// };

// type PageProps = {
//   params: Promise<{
//     characterKey: string;
//   }>;
// };

// export default async function CharacterMessagePage({ params }: PageProps) {
//   const { characterKey } = await params;

//   const { data, error } = await supabase
//     .from("phone_items")
//     .select("id, title, slug, created_at, content_json, is_published")
//     .eq("subtype", "message")
//     .eq("is_published", true)
//     .order("created_at", { ascending: false });

//   if (error) {
//     notFound();
//   }

//   const item = (data ?? []).find((row) => {
//     return (row.content_json?.characterKey ?? "baiqi") === characterKey;
//   });

//   if (!item) {
//     notFound();
//   }

//   const characterName =
//     item.content_json?.characterName ||
//     DEFAULT_NAME_MAP[characterKey] ||
//     "이름 없음";

//   const avatarUrl =
//     item.content_json?.avatarUrl?.trim() ||
//     DEFAULT_AVATAR_MAP[characterKey] ||
//     "/profile/baiqi.png";

//   const entries = Array.isArray(item.content_json?.editorEntries)
//     ? item.content_json.editorEntries
//     : Array.isArray(item.content_json?.entries)
//       ? item.content_json.entries
//       : [];

//   const otherProfileHref = `/phone-items/me/${characterKey}`;
//   const myProfileHref = "/phone-items/me";

//   return (
//     <main className="phone-page">
//       <PhoneShell>
//         <PhoneTopBar
//           title={item.title?.trim() || characterName}
//           subtitle={characterName}
//           backHref="/phone-items/messages"
//           rightSlot={
//             <Link
//   href={`/phone-items/messages/${characterKey}/history`}
//   className="phone-topbar-icon-button phone-topbar-history-button"
//   aria-label="대화기록"
//   title="대화기록"
// >
//   <span className="sr-only">대화기록</span>
// </Link>
//           }
//         />

//         <div className="phone-content">
//           <MessageThreadView
//             avatarUrl={avatarUrl}
//             entries={entries}
//             otherProfileHref={otherProfileHref}
//             myProfileHref={myProfileHref}
//           />
//         </div>

//         <PhoneTabNav currentPath="/phone-items/messages" />
//       </PhoneShell>
//     </main>
//   );
// }

import Link from "next/link";
import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import MessageThreadView from "@/components/phone/message/MessageThreadView";
import { supabase } from "@/lib/supabase/server";
import { getCurrentViewerProfile } from "@/lib/phone/get-current-viewer-profile";

const DEFAULT_AVATAR_MAP: Record<string, string> = {
  baiqi: "/profile/baiqi.png",
  lizeyan: "/profile/lizeyan.png",
  zhouqiluo: "/profile/zhouqiluo.png",
  xumo: "/profile/xumo.png",
  lingxiao: "/profile/lingxiao.png",
};

const DEFAULT_NAME_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
};

type PageProps = {
  params: Promise<{
    characterKey: string;
  }>;
};

export default async function CharacterMessagePage({ params }: PageProps) {
  const { characterKey } = await params;
  const viewerProfile = await getCurrentViewerProfile();

  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, created_at, content_json, is_published")
    .eq("subtype", "message")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    notFound();
  }

  const item = (data ?? []).find((row) => {
    return (row.content_json?.characterKey ?? "baiqi") === characterKey;
  });

  if (!item) {
    notFound();
  }

  const characterName =
    item.content_json?.characterName ||
    DEFAULT_NAME_MAP[characterKey] ||
    "이름 없음";

  const avatarUrl =
    item.content_json?.avatarUrl?.trim() ||
    DEFAULT_AVATAR_MAP[characterKey] ||
    "/profile/baiqi.png";

  const entries = Array.isArray(item.content_json?.editorEntries)
    ? item.content_json.editorEntries
    : Array.isArray(item.content_json?.entries)
      ? item.content_json.entries
      : [];

  const otherProfileHref = `/phone-items/me/${characterKey}`;
  const myProfileHref = "/phone-items/me";

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title={item.title?.trim() || characterName}
          subtitle={characterName}
          backHref="/phone-items/messages"
          rightSlot={
            <Link
              href={`/phone-items/messages/${characterKey}/history`}
              className="phone-topbar-icon-button phone-topbar-history-button"
              aria-label="대화기록"
              title="대화기록"
            >
              <span className="sr-only">대화기록</span>
            </Link>
          }
        />

        <div className="phone-content">
          <MessageThreadView
            avatarUrl={avatarUrl}
            myAvatarUrl={viewerProfile.avatarUrl}
            entries={entries}
            otherProfileHref={otherProfileHref}
            myProfileHref={myProfileHref}
          />
        </div>

        <PhoneTabNav currentPath="/phone-items/messages" />
      </PhoneShell>
    </main>
  );
}