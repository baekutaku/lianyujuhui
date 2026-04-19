export type MakerMessageTextNode = {
  type: "text";
  side: "left" | "right";
  text: string;
};

export type MakerMessageSystemNode = {
  type: "system";
  text: string;
};

export type MakerMessageImageNode = {
  type: "image";
  side: "left" | "right";
  url: string;
  caption?: string;
};

export type MakerMessageAudioNode = {
  type: "audio";
  side: "left" | "right";
  url: string;
  duration?: string;
  transcript?: string;
};

export type MakerMessageChoiceOption = {
  id: string;
  label: string;
  result: MakerMessageNode[];
};

export type MakerMessageChoiceNode = {
  type: "choice";
  options: MakerMessageChoiceOption[];
  selectedIndex?: number;
};

export type MakerMessageNode =
  | MakerMessageTextNode
  | MakerMessageSystemNode
  | MakerMessageImageNode
  | MakerMessageAudioNode
  | MakerMessageChoiceNode;

export type MakerFlatMessageEntry =
  | {
      type: "text";
      side: "left" | "right";
      text: string;
    }
  | {
      type: "system";
      text: string;
    }
  | {
      type: "image";
      side: "left" | "right";
      url: string;
      caption?: string;
    }
  | {
      type: "audio";
      side: "left" | "right";
      url: string;
      duration?: string;
      transcript?: string;
    }
  | {
      type: "choice";
      options: string[];
      selectedIndex?: number;
    };

export type MakerMessagePayload = {
  preview: string;
  characterKey: string;
  characterName: string;
  avatarUrl: string;
  entries: MakerFlatMessageEntry[];
  editorEntries: MakerMessageNode[];
};

export function createMakerMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createMakerTextNode(
  side: "left" | "right" = "left"
): MakerMessageTextNode {
  return {
    type: "text",
    side,
    text: "",
  };
}

export function createMakerSystemNode(): MakerMessageSystemNode {
  return {
    type: "system",
    text: "",
  };
}

export function createMakerImageNode(
  side: "left" | "right" = "left"
): MakerMessageImageNode {
  return {
    type: "image",
    side,
    url: "",
    caption: "",
  };
}

export function createMakerAudioNode(
  side: "left" | "right" = "left"
): MakerMessageAudioNode {
  return {
    type: "audio",
    side,
    url: "",
    duration: "",
    transcript: "",
  };
}

export function createMakerChoiceOption(): MakerMessageChoiceOption {
  return {
    id: createMakerMessageId(),
    label: "",
    result: [],
  };
}

export function createMakerChoiceNode(): MakerMessageChoiceNode {
  return {
    type: "choice",
    options: [
      createMakerChoiceOption(),
      createMakerChoiceOption(),
      createMakerChoiceOption(),
    ],
    selectedIndex: 0,
  };
}