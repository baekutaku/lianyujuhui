type PhoneItemHrefInput = {
  slug?: string | null;
  subtype?: string | null;
  content_json?: {
    characterKey?: string;
    authorKey?: string;
  } | null;
};

export function getPhoneItemHref(item: PhoneItemHrefInput) {
  const slug = String(item.slug || "").trim();
  const json = item.content_json ?? {};

  if (item.subtype === "moment") {
    const characterKey = String(json.authorKey || "").trim() || "other";
    if (!slug) return "/phone-items/moments";
    return `/phone-items/moments/${characterKey}/${encodeURIComponent(slug)}`;
  }

  if (item.subtype === "message") {
    const characterKey = String(json.characterKey || "").trim() || "baiqi";
    if (!slug) return "/phone-items/messages";
    return `/phone-items/messages/${characterKey}/${encodeURIComponent(slug)}`;
  }

 if (item.subtype === "call" || item.subtype === "video_call") {
    const characterKey = String(json.characterKey || "").trim() || "baiqi";
    if (!slug) return "/phone-items/calls";
    return `/phone-items/calls/${characterKey}/${encodeURIComponent(slug)}`;
  }

  if (item.subtype === "article") {
    if (!slug) return "/phone-items/articles";
    return `/phone-items/articles/${encodeURIComponent(slug)}`;
  }

  return "/phone-items";
}