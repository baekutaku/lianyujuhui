export function makeSafeToken(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .replace(/-+/g, "-");
}

export function makeRandomSuffix() {
  return Math.random().toString(36).slice(2, 6);
}

export function buildCardKeys(params: {
  characterKey: string;
  title: string;
  year: number;
  serverKey: string;
}) {
  const titleToken = makeSafeToken(params.title) || "item";
  const suffix = makeRandomSuffix();

  const slug = `${params.characterKey}-${titleToken}-${params.year}-${params.serverKey}-${suffix}`;
  const originKey = `card_${params.characterKey}_${titleToken}_${params.year}_${suffix}`;
  const contentId = `${originKey}_${params.serverKey}`;

  return { slug, originKey, contentId };
}

export function buildStoryKeys(params: {
  subtype: string;
  characterKey: string;
  title: string;
  year: number;
  serverKey: string;
}) {
  const titleToken = makeSafeToken(params.title) || "story";
  const suffix = makeRandomSuffix();

  const slug = `${params.characterKey}-${titleToken}-${params.year}-${params.serverKey}-${suffix}`;
  const originKey = `story_${params.subtype}_${params.characterKey}_${titleToken}_${params.year}_${suffix}`;
  const contentId = `${originKey}_${params.serverKey}`;

  return { slug, originKey, contentId };
}
