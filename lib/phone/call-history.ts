export const CALL_HISTORY_CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "story", label: "스토리" },
  { value: "card", label: "카드" },
  { value: "birthday", label: "생일" },
  { value: "event", label: "이벤트" },
  { value: "anniversary", label: "기념일" },
] as const;

export const CALL_HISTORY_CATEGORY_LABEL_MAP: Record<string, string> = {
  all: "전체",
  story: "스토리",
  card: "카드",
  birthday: "생일",
  event: "이벤트",
  anniversary: "기념일",
};