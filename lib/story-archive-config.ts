export const STORY_TABS = [
  { key: "all", label: "전체목록" },
  { key: "main", label: "시작" },
  { key: "card", label: "데이트" },
  { key: "asmr", label: "너의 곁에" },
  { key: "event", label: "이벤트 / 기념일" },
  { key: "side", label: "외전" },
  { key: "xiyue", label: "서월국" },
  { key: "myhome", label: "마이홈" },
  { key: "company", label: "촬영장 / 회사 프로젝트" },
] as const;

export const CHARACTER_FILTERS = [
  { key: "baiqi", label: "백기" },
  { key: "lizeyan", label: "이택언" },
  { key: "xumo", label: "허묵" },
  { key: "zhouqiluo", label: "주기락" },
  { key: "lingxiao", label: "연시호" },
] as const;

export const STORY_SUBFILTERS = {
  all: [],

  main: [
    { key: "all", label: "전체" },
    { key: "part1", label: "1부" },
    { key: "part2", label: "2부" },
    { key: "part3", label: "3부" },
    { key: "behind_story", label: "막후의 장" },
  ],

  card: [{ key: "all", label: "전체" }, ...CHARACTER_FILTERS],

  asmr: [{ key: "all", label: "전체" }, ...CHARACTER_FILTERS],

  event: [
    { key: "all", label: "전체" },
    { key: "birthday_character", label: "캐릭터 생일" },
    { key: "birthday_mc", label: "유저 생일" },
    { key: "anniversary", label: "N주년" },
    { key: "festival", label: "명절 / 기념일" },
    { key: "seasonal", label: "시즌 이벤트" },
    { key: "collab", label: "콜라보" },
    { key: "return", label: "복귀 이벤트" },
  ],

  side: [{ key: "all", label: "전체" }, ...CHARACTER_FILTERS],
  xiyue: [{ key: "all", label: "전체" }, ...CHARACTER_FILTERS],
  myhome: [{ key: "all", label: "전체" }, ...CHARACTER_FILTERS],
  company: [{ key: "all", label: "전체" }, ...CHARACTER_FILTERS],
} as const;

export type StoryTabKey = (typeof STORY_TABS)[number]["key"];
export type CharacterKey = (typeof CHARACTER_FILTERS)[number]["key"];

export type StoryResolver = {
  mode: "stories" | "events" | "mixed";
  storySubtypes?: string[];
  eventSubtypes?: string[];
  characterKey?: string;
  partNo?: number;
  tagKeys?: string[];
};

const CHARACTER_KEYS = new Set(CHARACTER_FILTERS.map((item) => item.key));

export function resolveStoriesQuery(
  tab: string | undefined,
  sub: string | undefined
): StoryResolver {
  const safeTab = (tab || "all") as StoryTabKey;
  const safeSub = sub || "all";

  switch (safeTab) {
    case "main":
      if (safeSub === "part1") {
        return { mode: "stories", storySubtypes: ["main_story"], partNo: 1 };
      }
      if (safeSub === "part2") {
        return { mode: "stories", storySubtypes: ["main_story"], partNo: 2 };
      }
      if (safeSub === "part3") {
        return { mode: "stories", storySubtypes: ["main_story"], partNo: 3 };
      }
      if (safeSub === "behind_story") {
        return { mode: "stories", storySubtypes: ["behind_story"] };
      }
      return {
        mode: "stories",
        storySubtypes: ["main_story", "behind_story"],
      };

    case "card":
      if (CHARACTER_KEYS.has(safeSub as CharacterKey)) {
        return {
          mode: "stories",
          storySubtypes: ["card_story"],
          characterKey: safeSub,
        };
      }
      return { mode: "stories", storySubtypes: ["card_story"] };

    case "asmr":
      if (CHARACTER_KEYS.has(safeSub as CharacterKey)) {
        return {
          mode: "stories",
          storySubtypes: ["asmr"],
          characterKey: safeSub,
        };
      }
      return { mode: "stories", storySubtypes: ["asmr"] };

    case "side":
      if (CHARACTER_KEYS.has(safeSub as CharacterKey)) {
        return {
          mode: "stories",
          storySubtypes: ["side_story"],
          characterKey: safeSub,
        };
      }
      return { mode: "stories", storySubtypes: ["side_story"] };

    case "xiyue":
      if (CHARACTER_KEYS.has(safeSub as CharacterKey)) {
        return {
          mode: "stories",
          storySubtypes: ["xiyue_story"],
          characterKey: safeSub,
        };
      }
      return { mode: "stories", storySubtypes: ["xiyue_story"] };

    case "myhome":
      if (CHARACTER_KEYS.has(safeSub as CharacterKey)) {
        return {
          mode: "stories",
          storySubtypes: ["myhome_story"],
          characterKey: safeSub,
        };
      }
      return { mode: "stories", storySubtypes: ["myhome_story"] };

    case "company":
      if (CHARACTER_KEYS.has(safeSub as CharacterKey)) {
        return {
          mode: "stories",
          storySubtypes: ["company_project"],
          characterKey: safeSub,
        };
      }
      return { mode: "stories", storySubtypes: ["company_project"] };

    case "event":
      if (safeSub === "birthday_character") {
        return { mode: "events", eventSubtypes: ["birthday_baiqi"] };
      }
      if (safeSub === "birthday_mc") {
        return { mode: "events", eventSubtypes: ["birthday_mc"] };
      }
      if (safeSub === "anniversary") {
        return { mode: "events", eventSubtypes: ["anniversary_event"] };
      }
      if (safeSub === "seasonal") {
        return { mode: "events", eventSubtypes: ["seasonal_event"] };
      }
      if (safeSub === "return") {
        return { mode: "events", eventSubtypes: ["return_event"] };
      }
      if (safeSub === "festival") {
        return {
          mode: "events",
          eventSubtypes: ["game_event"],
          tagKeys: ["festival"],
        };
      }
      if (safeSub === "collab") {
        return {
          mode: "events",
          eventSubtypes: ["game_event"],
          tagKeys: ["collab"],
        };
      }
      return {
        mode: "events",
        eventSubtypes: [
          "birthday_baiqi",
          "birthday_mc",
          "game_event",
          "anniversary_event",
          "seasonal_event",
          "return_event",
        ],
      };

    default:
      return { mode: "mixed" };
  }
}