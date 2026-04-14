export type CharacterKey = "baiqi" | "xumo" | "lizeyan" | "lingxiao" | "mc";

export const MOMENT_CHARACTER_MAP = {
  baiqi: {
    name: "백기",
    items: [
      {
        id: "baiqi-1",
        characterKey: "baiqi",
        authorName: "백기",
        authorAvatar:
          "https://lianyujuhui.ivyro.net/data/file/pic/2009648324_0qlIJGgx_72d730ad05cc87c44f0829a386a0c0cfc426b609.jpg",
        authorLevel: 45,
        body: "헬러윈 가면 무도회엔 이상한 옷차림이 많다… 변장이 이 정도로 자유로워진 건가?",
        quoteText:
          "유연 : 요즘은 엄청 자유로워졌어요.\n백기답장유연 : 네가 곁에 있다면, 난 아무거나 괜찮아.",
      },
      {
        id: "baiqi-2",
        characterKey: "baiqi",
        authorName: "백기",
        authorAvatar:
          "https://lianyujuhui.ivyro.net/data/file/pic/2009648324_0qlIJGgx_72d730ad05cc87c44f0829a386a0c0cfc426b609.jpg",
        authorLevel: 45,
        body: "고개를 들어 컵에 적힌 문구를 보면, 뭘 마셔야 한다는 걸 상기하게 된다.",
        quoteText:
          "유연 : 오호~ 어떤 컵 말인가요?\n백기답장유연 : 지난번에 네가 나한테 준 그 따뜻한 물 많이 마시기 컵이야.",
      },
    ],
  },
  lingxiao
  : {
    name: "연시호",
    items: [
      {
        id: "lingxiao-1",
        characterKey: "lingxiao",
        authorName: "연시호",
        authorAvatar:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop",
        authorLevel: 16,
        body: "단번에 클리어할 수 있는 게임이 뭐가 재미 있다는 거지?",
        quoteText:
          "유연 : 몰입형 게임은 클리어만이 목표가 아니에요.\n연시호답장유연 : 어떤 고건이 있는지 말해봐요.",
      },
    ],
  },
  mc: {
    name: "유연",
    items: [
      {
        id: "mc-1",
        characterKey: "mc",
        authorName: "유연",
        authorAvatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop",
        body: "무조건 믿을 수 있는 사람을 만났다는 건 정말 행운인 것 같다.",
        quoteText:
          "주기락 : 내 얘기네!!\n백기 : 누구?\n이택언 : 바보.",
      },
      {
        id: "mc-2",
        characterKey: "mc",
        authorName: "유연",
        authorAvatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop",
        body: "내가 만든 슈크림빵, 당신 입맛에 맞기를",
        imageUrl:
          "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
} as const;

export const ARTICLE_DETAIL_MAP = {
  baiqi: {
    "rainbow-news": {
      title: "비 온 뒤 거대 무지개 출현! 점성사 왈 '무지개 보면 애정운 폭발!'",
      author: "편집자 오공",
      sourceName: "뉴스 미리보기",
      imageUrl:
        "https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1200&auto=format&fit=crop",
      body:
        "오늘 비로 인해 오랜만에 연모시에서 무지개를 볼 수 있게 되었다.\n연모시 곳곳에서 시민들이 가던 길을 멈추고 무지개 사진을 찍는 진풍경이 연출되었다.\n한 점술사는 이 무지개가 십 년에 한 번 나타날까 말까 한 애정 무지개로, 본 사람들에겐 좋은 인연이 찾아올 것이라 말했다.",
    },
  },
  mc: {
    french: {
      title: "세상에서 가장 아름다운 불어 10마디를 알아볼까요?",
      author: "오늘의 불어",
      sourceName: "오늘의 불어",
      imageUrl:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
      body:
        "bonjour, mon coeur, mon amour 같은 표현은 맥락에 따라 훨씬 부드럽고 감정적으로 들린다.\n짧은 단어라도 억양과 관계성에 따라 전혀 다른 온도를 띤다.",
    },
  },
} as const;