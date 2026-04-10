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

export function parseMessageBulk(raw: string): ParsedMessageThread {
  const input = normalizeLines(raw);
  const lines = input.split("\n");

  let title = "";
  let preview = "";
  let threadKey = "";
  let characterKey = "";
  let avatarUrl = "";

  const entries: MessageEntry[] = [];

  let inContent = false;

  for (const originalLine of lines) {
    const line = originalLine.trimEnd();

    if (!inContent) {
      if (!line.trim()) {
        inContent = true;
        continue;
      }

      if (
        line.startsWith("L:") ||
        line.startsWith("R:") ||
        line.startsWith("SYS:") ||
        line.startsWith("LIMG:") ||
        line.startsWith("RIMG:")
      ) {
        inContent = true;
      } else {
        const meta = parseMetaLine(line);
        if (meta) {
          switch (meta.key) {
            case "title":
              title = meta.value;
              continue;
            case "preview":
              preview = meta.value;
              continue;
            case "threadKey":
              threadKey = meta.value;
              continue;
            case "characterKey":
              characterKey = meta.value;
              continue;
            case "avatarUrl":
              avatarUrl = meta.value;
              continue;
          }
        }
      }
    }

    if (!line.trim()) continue;

    if (line.startsWith("SYS:")) {
      entries.push({
        type: "system",
        text: line.replace(/^SYS:\s*/, ""),
      });
      continue;
    }

    if (line.startsWith("LIMG:") || line.startsWith("RIMG:")) {
      const side = line.startsWith("LIMG:") ? "left" : "right";
      const payload = line.replace(/^LIMG:\s*|^RIMG:\s*/, "");
      const [urlPart, captionPart] = payload.split("|").map((v) => v?.trim());

      if (!urlPart) continue;

      entries.push({
        type: "image",
        side,
        url: urlPart,
        caption: captionPart || undefined,
      });
      continue;
    }

    if (line.startsWith("L:") || line.startsWith("R:")) {
      const side = line.startsWith("L:") ? "left" : "right";
      const text = line.replace(/^L:\s*|^R:\s*/, "");

      entries.push({
        type: "text",
        side,
        text,
      });
      continue;
    }

    const last = entries[entries.length - 1];

    if (!last) continue;

    if (last.type === "text") {
      last.text += `\n${line}`;
    } else if (last.type === "system") {
      last.text += `\n${line}`;
    }
  }

  if (!threadKey) {
    threadKey =
      characterKey ||
      title
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
  }

  if (!title) {
    title = threadKey;
  }

  if (!preview) {
    const firstText = entries.find((entry) => entry.type === "text");
    preview = firstText?.type === "text" ? firstText.text.slice(0, 40) : "";
  }

  return {
    title,
    preview,
    threadKey,
    characterKey: characterKey || undefined,
    avatarUrl: avatarUrl || undefined,
    entries,
  };
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