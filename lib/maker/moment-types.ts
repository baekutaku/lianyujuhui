export type MakerMomentReplyLine = {
  id: string;
  speakerKey: string;
  speakerName: string;
  targetName: string;
  content: string;
  isReplyToMc?: boolean;
};

export type MakerMomentChoiceOption = {
  id: string;
  label: string;
  isHistory?: boolean;
  replySpeakerKey: string;
  replySpeakerName: string;
  replyTargetName: string;
  replyContent: string;
};

export type MakerMomentComment = {
  id: string;
  speakerKey: string;
  speakerName: string;
  avatarUrl: string;
  content: string;
  likeCount: number;
};

export type MakerMomentPayload = {
  authorKey: string;
  authorName: string;
  authorAvatarUrl: string;
  authorHasProfile: boolean;

  momentCategory: string;
  momentCategoryLabel: string;
  momentYear: number | null;
  momentDateText: string;

  momentBody: string;
  momentSummary: string;
  momentSource: string;
  momentImageUrls: string[];

  momentReplyLines: MakerMomentReplyLine[];
  momentChoiceOptions: MakerMomentChoiceOption[];
  momentSelectedOptionId: string | null;
  momentComments: MakerMomentComment[];

  isFavorite: boolean;
  isComplete: boolean;
};

export function createMakerMomentRowId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createMakerReplyLine(): MakerMomentReplyLine {
  return {
    id: createMakerMomentRowId(),
    speakerKey: "baiqi",
    speakerName: "",
    targetName: "유연",
    content: "",
    isReplyToMc: false,
  };
}

export function createMakerChoiceOption(): MakerMomentChoiceOption {
  return {
    id: createMakerMomentRowId(),
    label: "",
    isHistory: false,
    replySpeakerKey: "baiqi",
    replySpeakerName: "",
    replyTargetName: "유연",
    replyContent: "",
  };
}

export function createMakerComment(): MakerMomentComment {
  return {
    id: createMakerMomentRowId(),
    speakerKey: "other",
    speakerName: "",
    avatarUrl: "",
    content: "",
    likeCount: 0,
  };
}