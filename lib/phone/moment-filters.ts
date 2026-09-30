export const MOMENT_AUTHOR_KEYS = [
  "all",
  "baiqi",
  "lizeyan",
  "zhouqiluo",
  "xumo",
  "lingxiao",
  "mc",
  "other",
] as const;

export const MOMENT_AUTHOR_LABEL_MAP: Record<string, string> = {
  all: "전체",
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
  mc: "나",
  other: "기타",
};

export const MOMENT_CATEGORY_KEYS = [
  "all",
  "daily",
  "card",
  "story",
] as const;

export const MOMENT_CATEGORY_LABEL_MAP: Record<string, string> = {
  all: "전체",
  daily: "일상",
  card: "카드",
  story: "스토리",
};

export function normalizeMomentCategory(value?: string) {
  if (value === "daily" || value === "card" || value === "story") {
    return value;
  }
  return "all";
}

export function normalizeMomentAuthor(value?: string) {
  if (
    value === "baiqi" ||
    value === "lizeyan" ||
    value === "zhouqiluo" ||
    value === "xumo" ||
    value === "lingxiao" ||
    value === "mc" ||
    value === "other"
  ) {
    return value;
  }
  return "all";
}