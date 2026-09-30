export const MAKER_GUEST_ID_COOKIE = "maker_guest_id";
export const MAKER_GUEST_NAME_COOKIE = "maker_guest_name";

export const MAKER_DEFAULT_MY_NAME = "유연";
export const MAKER_DEFAULT_MY_AVATAR = "/profile/mc.png";

export const MAKER_CHARACTER_NAME_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
  npc: "",
  mc: "유연",
  other: "",
};

export const MAKER_CHARACTER_AVATAR_MAP: Record<string, string> = {
  baiqi: "/profile/baiqi.png",
  lizeyan: "/profile/lizeyan.png",
  zhouqiluo: "/profile/zhouqiluo.png",
  xumo: "/profile/xumo.png",
  lingxiao: "/profile/lingxiao.png",
  mc: "/profile/mc.png",
};

export function getMakerCharacterName(key?: string) {
  return MAKER_CHARACTER_NAME_MAP[String(key || "").trim()] ?? "";
}

export function getMakerCharacterAvatar(key?: string) {
  return MAKER_CHARACTER_AVATAR_MAP[String(key || "").trim()] ?? "";
}