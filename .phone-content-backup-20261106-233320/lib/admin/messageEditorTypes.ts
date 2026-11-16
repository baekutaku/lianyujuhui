export type MessageTextNode = {
  type: "text";
  side: "left" | "right";
  text: string;
};

export type MessageSystemNode = {
  type: "system";
  text: string;
};

export type MessageImageNode = {
  type: "image";
  side: "left" | "right";
  url: string;
  caption?: string;
};

export type MessageAudioNode = {
  type: "audio";
  side: "left" | "right";
  url: string;
  duration?: string;
  transcript?: string;
};

export type MessageChoiceOption = {
  id: string;
  label: string;
  result: MessageNode[];
};

export type MessageChoiceNode = {
  type: "choice";
  options: MessageChoiceOption[];
};

export type MessageNode =
  | MessageTextNode
  | MessageSystemNode
  | MessageImageNode
  | MessageAudioNode
  | MessageChoiceNode;

export type FlatMessageEntry =
  | {
      type: "text";
      side: "left" | "right";
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
      type: "system";
      text: string;
    }
  | {
      type: "choice";
      options: string[];
      selectedIndex?: number;
    };

export function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createTextNode(
  side: "left" | "right" = "left"
): MessageTextNode {
  return {
    type: "text",
    side,
    text: "",
  };
}

export function createSystemNode(): MessageSystemNode {
  return {
    type: "system",
    text: "",
  };
}

export function createImageNode(
  side: "left" | "right" = "left"
): MessageImageNode {
  return {
    type: "image",
    side,
    url: "",
    caption: "",
  };
}

export function createAudioNode(
  side: "left" | "right" = "left"
): MessageAudioNode {
  return {
    type: "audio",
    side,
    url: "",
    duration: "",
    transcript: "",
  };
}

export function createChoiceOption(): MessageChoiceOption {
  return {
    id: createId(),
    label: "",
    result: [],
  };
}

export function createChoiceNode(): MessageChoiceNode {
  return {
    type: "choice",
    options: [createChoiceOption(), createChoiceOption(), createChoiceOption()],
  };
}

export function flattenMessageNodes(nodes: MessageNode[]): FlatMessageEntry[] {
  return nodes.map((node) => {
    if (node.type === "choice") {
      return {
        type: "choice",
        options: node.options.map((option) => option.label),
        selectedIndex: 0,
      };
    }

    return node;
  });
}

export function buildEditorNodesFromStoredEntries(entries: any[]): MessageNode[] {
  if (!Array.isArray(entries)) return [];

  return entries.map((entry) => {
    if (!entry || typeof entry !== "object") {
      return createSystemNode();
    }

    if (entry.type === "choice") {
      const options = Array.isArray(entry.options) ? entry.options : [];

      if (options.length > 0 && typeof options[0] === "object") {
        return {
          type: "choice",
          options: options.map((option: any) => ({
            id: option.id || createId(),
            label: option.label || "",
            result: buildEditorNodesFromStoredEntries(option.result || []),
          })),
        } satisfies MessageChoiceNode;
      }

      return {
        type: "choice",
        options:
          options.length > 0
            ? options.map((label: string) => ({
                id: createId(),
                label,
                result: [],
              }))
            : [createChoiceOption()],
      } satisfies MessageChoiceNode;
    }

    if (entry.type === "text") {
      return {
        type: "text",
        side: entry.side === "right" ? "right" : "left",
        text: entry.text || "",
      } satisfies MessageTextNode;
    }

    if (entry.type === "image") {
      return {
        type: "image",
        side: entry.side === "right" ? "right" : "left",
        url: entry.url || "",
        caption: entry.caption || "",
      } satisfies MessageImageNode;
    }

    if (entry.type === "audio") {
      return {
        type: "audio",
        side: entry.side === "right" ? "right" : "left",
        url: entry.url || "",
        duration: entry.duration || "",
        transcript: entry.transcript || "",
      } satisfies MessageAudioNode;
    }

    return {
      type: "system",
      text: entry.text || "",
    } satisfies MessageSystemNode;
  });
}