export const CHARACTER_NAME_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
};

export const CHARACTER_DEFAULT_AVATAR_MAP: Record<string, string> = {
  baiqi: "/profile/baiqi.png",
  lizeyan: "/profile/lizeyan.png",
  zhouqiluo: "/profile/zhouqiluo.png",
  xumo: "/profile/xumo.png",
  lingxiao: "/profile/lingxiao.png",
};

export function getDefaultAvatarByCharacterKey(characterKey?: string) {
  if (!characterKey) return "";
  return CHARACTER_DEFAULT_AVATAR_MAP[characterKey] ?? "";
}

export function getCharacterDisplayName(characterKey?: string) {
  if (!characterKey) return "";
  return CHARACTER_NAME_MAP[characterKey] ?? "";
}