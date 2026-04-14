export const STORY_SUBTYPE_OPTIONS = [
  { value: "card_story", label: "카드 스토리" },
  { value: "main_story", label: "메인스토리" },
  { value: "side_story", label: "외전" },
  { value: "asmr", label: "너의 곁에" },
  { value: "behind_story", label: "막후의 장" },
  { value: "xiyue_story", label: "서월국" },
  { value: "myhome_story", label: "마이홈 스토리" },
  { value: "company_project", label: "회사 프로젝트" },
] as const;

export const STORY_SUBTYPE_LABEL_MAP = Object.fromEntries(
  STORY_SUBTYPE_OPTIONS.map((item) => [item.value, item.label])
) as Record<string, string>;

export const SERVER_OPTIONS = [
  { value: "kr", label: "KR" },
  { value: "cn", label: "CN" },
  { value: "cn+kr", label: "CN+KR" },
] as const;

export const SERVER_LABEL_MAP: Record<string, string> = {
  kr: "KR",
  cn: "CN",
  "cn+kr": "CN+KR",
};