import {
  type MakerFlatMessageEntry,
  type MakerMessageChoiceNode,
  type MakerMessageNode,
  createMakerChoiceOption,
  createMakerSystemNode,
  createMakerMessageId,
} from "@/lib/maker/message-types";

export function flattenMakerMessageNodes(
  nodes: MakerMessageNode[]
): MakerFlatMessageEntry[] {
  return nodes.map((node) => {
    if (node.type === "choice") {
      return {
        type: "choice",
        options: node.options.map((option) => option.label),
        selectedIndex:
          typeof node.selectedIndex === "number" ? node.selectedIndex : 0,
      };
    }

    return node;
  });
}

export function buildMakerEditorNodesFromStoredEntries(
  entries: any[]
): MakerMessageNode[] {
  if (!Array.isArray(entries)) return [];

  return entries.map((entry) => {
    if (!entry || typeof entry !== "object") {
      return createMakerSystemNode();
    }

    if (entry.type === "choice") {
      const options = Array.isArray(entry.options) ? entry.options : [];

      if (options.length > 0 && typeof options[0] === "object") {
        return {
          type: "choice",
          selectedIndex:
            typeof entry.selectedIndex === "number" ? entry.selectedIndex : 0,
          options: options.map((option: any) => ({
            id: String(option?.id || createMakerMessageId()),
            label: String(option?.label || ""),
            result: buildMakerEditorNodesFromStoredEntries(option?.result || []),
          })),
        } satisfies MakerMessageChoiceNode;
      }

      return {
        type: "choice",
        selectedIndex:
          typeof entry.selectedIndex === "number" ? entry.selectedIndex : 0,
        options:
          options.length > 0
            ? options.map((label: string) => ({
                id: createMakerMessageId(),
                label: String(label || ""),
                result: [],
              }))
            : [createMakerChoiceOption()],
      } satisfies MakerMessageChoiceNode;
    }

    if (entry.type === "text") {
      return {
        type: "text",
        side: entry.side === "right" ? "right" : "left",
        text: String(entry.text || ""),
      };
    }

    if (entry.type === "image") {
      return {
        type: "image",
        side: entry.side === "right" ? "right" : "left",
        url: String(entry.url || ""),
        caption: String(entry.caption || ""),
      };
    }

    if (entry.type === "audio") {
      return {
        type: "audio",
        side: entry.side === "right" ? "right" : "left",
        url: String(entry.url || ""),
        duration: String(entry.duration || ""),
        transcript: String(entry.transcript || ""),
      };
    }

    return {
      type: "system",
      text: String(entry.text || ""),
    };
  });
}

export function buildMakerMessagePreview(
  entries: MakerMessageNode[],
  fallback = ""
) {
  for (const entry of entries) {
    if (entry.type === "text" && entry.text.trim()) {
      return entry.text.trim();
    }

    if (entry.type === "system" && entry.text.trim()) {
      return entry.text.trim();
    }

    if (entry.type === "choice") {
      const label = entry.options.find((option) => option.label.trim())?.label?.trim();
      if (label) return label;
    }
  }

  return fallback.trim();
}

export function parseMakerMessageJsonField<T>(
  value: string,
  fieldName: string,
  fallback: T
): T {
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error(`${fieldName} JSON이 올바르지 않습니다.`);
  }
}