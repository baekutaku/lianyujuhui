// 메인 캐릭터 키 — 순서가 곧 우선순위
export const MAIN_CHARACTER_KEYS = [
  "baiqi",
  "lizeyan",
  "zhouqiluo",
  "xumo",
  "lingxiao",
] as const;

// 주기락의 다른 인격들 — 독립 키지만 2순위로 취급
export const ZHOUQILUO_ALT_KEYS = ["helios", "unknown"] as const;

export type MainCharacterKey = (typeof MAIN_CHARACTER_KEYS)[number];
export type ZhouqiluoAltKey = (typeof ZHOUQILUO_ALT_KEYS)[number];
export type KnownCharacterKey = MainCharacterKey | ZhouqiluoAltKey;

export const DEFAULT_AVATAR_MAP: Record<string, string> = {
  baiqi: "/profile/baiqi.png",
  lizeyan: "/profile/lizeyan.png",
  zhouqiluo: "/profile/zhouqiluo.png",
  xumo: "/profile/xumo.png",
  lingxiao: "/profile/lingxiao.png",
  helios: "/profile/helios.png",
  unknown: "/profile/npc.png",
};

export const DEFAULT_NAME_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
  helios: "Helios",
  unknown: "알 수 없음",
};

// 0 = 백기, 1 = 메인 4인, 2 = 주기락 계열 알트, 3 = NPC
export function getCharacterPriority(characterKey: string): number {
  if (characterKey === "baiqi") return 0;
  if (
    characterKey === "lizeyan" ||
    characterKey === "zhouqiluo" ||
    characterKey === "xumo" ||
    characterKey === "lingxiao"
  )
    return 1;
  if (characterKey === "helios" || characterKey === "unknown") return 2;
  return 3;
}

export function isMainCharacter(key: string): key is MainCharacterKey {
  return MAIN_CHARACTER_KEYS.includes(key as MainCharacterKey);
}

export function isKnownCharacter(key: string): key is KnownCharacterKey {
  return (
    isMainCharacter(key) ||
    ZHOUQILUO_ALT_KEYS.includes(key as ZhouqiluoAltKey)
  );
}

// NPC 그룹 키 — characterName 기준으로 묶음
// 알려진 캐릭터는 characterKey, NPC는 "npc:{이름}" 으로 구분
export function getGroupingKey(
  characterKey: string,
  characterName: string
): string {
  if (isKnownCharacter(characterKey)) {
    return `known:${characterKey}`;
  }
  // NPC는 이름이 같으면 같은 발신자로 취급
  const name = characterName.trim() || characterKey;
  return `npc:${name}`;
}