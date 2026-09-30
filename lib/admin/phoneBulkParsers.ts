export type MessageEntry =
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
      type: "system";
      text: string;
    };

export type ParsedMessageThread = {
  title: string;
  preview: string;
  threadKey: string;
  characterKey?: string;
  avatarUrl?: string;
  entries: MessageEntry[];
};

export type ParsedMomentPost = {
  id: string;
  characterKey: string;
  authorName: string;
  authorAvatar?: string;
  authorLevel?: number;
  body: string;
  quoteText?: string;
  images?: string[];
};

function normalizeLines(input: string) {
  return input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function parseMetaLine(line: string) {
  const match = line.match(/^([a-zA-Z0-9_]+)\s*:\s*(.*)$/);
  if (!match) return null;

  return {
    key: match[1].trim(),
    value: match[2].trim(),
  };
}

export type ParsedMessageEntry =
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

function splitPipe(value: string) {
  return value
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parseMessageBulk(raw: string): ParsedMessageEntry[] {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim());

  const entries: ParsedMessageEntry[] = [];

  for (const line of lines) {
    if (!line) continue;

    if (line.startsWith("SYS:")) {
      entries.push({
        type: "system",
        text: line.slice(4).trim(),
      });
      continue;
    }

    if (line.startsWith("L:")) {
      entries.push({
        type: "text",
        side: "left",
        text: line.slice(2).trim(),
      });
      continue;
    }

    if (line.startsWith("R:")) {
      entries.push({
        type: "text",
        side: "right",
        text: line.slice(2).trim(),
      });
      continue;
    }

    if (line.startsWith("LIMG:")) {
      const [url, caption] = splitPipe(line.slice(5).trim());
      if (!url) continue;

      entries.push({
        type: "image",
        side: "left",
        url,
        caption,
      });
      continue;
    }

    if (line.startsWith("RIMG:")) {
      const [url, caption] = splitPipe(line.slice(5).trim());
      if (!url) continue;

      entries.push({
        type: "image",
        side: "right",
        url,
        caption,
      });
      continue;
    }

    if (line.startsWith("LAUD:")) {
      const [url, duration, transcript] = splitPipe(line.slice(5).trim());
      if (!url) continue;

      entries.push({
        type: "audio",
        side: "left",
        url,
        duration,
        transcript,
      });
      continue;
    }

    if (line.startsWith("RAUD:")) {
      const [url, duration, transcript] = splitPipe(line.slice(5).trim());
      if (!url) continue;

      entries.push({
        type: "audio",
        side: "right",
        url,
        duration,
        transcript,
      });
      continue;
    }

    if (line.startsWith("CHOICE:")) {
      const options = splitPipe(line.slice(7).trim());
      if (options.length === 0) continue;

      entries.push({
        type: "choice",
        options,
      });
      continue;
    }

    throw new Error(`알 수 없는 메시지 문법: ${line}`);
  }

  return entries;
}

export function parseMomentBulk(raw: string): ParsedMomentPost[] {
  const input = normalizeLines(raw);
  const blocks = input
    .split(/^===\s*post\s*===\s*$/gm)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block.split("\n");

    let characterKey = "";
    let authorName = "";
    let authorAvatar = "";
    let authorLevel: number | undefined;
    let body = "";
    let quoteText = "";
    const images: string[] = [];

    let mode: "meta" | "body" | "quote" | "images" = "meta";

    for (const originalLine of lines) {
      const line = originalLine.trimEnd();
      const trimmed = line.trim();

      if (!trimmed) {
        if (mode === "body") body += "\n";
        else if (mode === "quote") quoteText += "\n";
        continue;
      }

      if (trimmed === "body:") {
        mode = "body";
        continue;
      }

      if (trimmed === "quote:") {
        mode = "quote";
        continue;
      }

      if (trimmed === "images:") {
        mode = "images";
        continue;
      }

      if (mode === "meta") {
        const meta = parseMetaLine(trimmed);
        if (meta) {
          switch (meta.key) {
            case "characterKey":
              characterKey = meta.value;
              break;
            case "authorName":
              authorName = meta.value;
              break;
            case "authorAvatar":
              authorAvatar = meta.value;
              break;
            case "authorLevel":
              authorLevel = meta.value ? Number(meta.value) : undefined;
              break;
          }
        }
        continue;
      }

      if (mode === "body") {
        body += (body ? "\n" : "") + line;
        continue;
      }

      if (mode === "quote") {
        quoteText += (quoteText ? "\n" : "") + line;
        continue;
      }

      if (mode === "images") {
        images.push(trimmed.replace(/^- /, "").trim());
      }
    }

    return {
      id: `${characterKey || "moment"}-${index + 1}`,
      characterKey,
      authorName,
      authorAvatar: authorAvatar || undefined,
      authorLevel,
      body: body.trim(),
      quoteText: quoteText.trim() || undefined,
      images: images.length ? images : undefined,
    };
  });
}