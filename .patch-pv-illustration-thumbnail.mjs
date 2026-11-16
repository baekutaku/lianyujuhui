import fs from "node:fs";

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function write(file, text) {
  fs.writeFileSync(file, text, "utf8");
}

function mustReplace(src, oldText, newText, label) {
  if (!src.includes(oldText)) {
    throw new Error(`[NOT FOUND] ${label}`);
  }

  return src.replace(oldText, newText);
}


/* =========================================================
   1. relation-data.ts
   illustrations 후보 추가
========================================================= */

{
  const file =
    "lib/extra/pv/relation-data.ts";

  let src = read(file);


  src = mustReplace(
    src,
`  eventCandidates: RelationCandidate[];

  initialCards?: RelationCandidate[];`,
`  eventCandidates: RelationCandidate[];
  illustrationCandidates: RelationCandidate[];

  initialCards?: RelationCandidate[];`,
    "PvRelationPools illustrationCandidates"
  );


  src = mustReplace(
    src,
`  initialEvents?: RelationCandidate[];
};`,
`  initialEvents?: RelationCandidate[];
  initialIllustrations?: RelationCandidate[];
};`,
    "PvRelationPools initialIllustrations"
  );


  src = mustReplace(
    src,
`    { data: events },
  ] =
    await Promise.all([`,
`    { data: events },
    { data: illustrations },
  ] =
    await Promise.all([`,
    "Promise result illustrations"
  );


  const eventQueryEnd =
`      supabaseAdmin
        .from("events")
        .select(
          "id, title, slug, subtype, primary_character_id"
        )
        .order(
          "release_year",
          { ascending: false }
        ),
    ]);`;

  const eventQueryNew =
`      supabaseAdmin
        .from("events")
        .select(
          "id, title, slug, subtype, primary_character_id"
        )
        .order(
          "release_year",
          { ascending: false }
        ),

      supabaseAdmin
        .from("illustrations")
        .select(
          "id, title, image_url, release_year, release_date, primary_character_id, is_published"
        )
        .eq(
          "is_published",
          true
        )
        .order(
          "release_year",
          { ascending: false }
        )
        .order(
          "release_date",
          { ascending: false }
        ),
    ]);`;

  src = mustReplace(
    src,
    eventQueryEnd,
    eventQueryNew,
    "illustrations query"
  );


  const marker =
`  const eventCandidates:
    RelationCandidate[] =
      (events ?? []).map(`;

  const markerPos =
    src.indexOf(marker);

  if (markerPos < 0) {
    throw new Error(
      "[NOT FOUND] eventCandidates"
    );
  }

  const returnPos =
    src.indexOf(
      "  return {",
      markerPos
    );

  if (returnPos < 0) {
    throw new Error(
      "[NOT FOUND] candidate return"
    );
  }

  const illustrationBlock =
`
  const illustrationCandidates:
    RelationCandidate[] =
      (illustrations ?? []).map(
        (item: any) => ({
          id: item.id,

          /* RelationPicker 검색용.
             실제 저장은 serializeBy=id */
          slug: item.id,

          title:
            item.title ||
            "제목 없음",

          characterKey:
            characterMap.get(
              item.primary_character_id
            ) ?? null,
        })
      );

`;

  if (
    !src.includes(
      "const illustrationCandidates:"
    )
  ) {
    src =
      src.slice(0, returnPos) +
      illustrationBlock +
      src.slice(returnPos);
  }


  src = mustReplace(
    src,
`    eventCandidates,
  };`,
`    eventCandidates,
    illustrationCandidates,
  };`,
    "candidate return illustration"
  );


  src = mustReplace(
    src,
`    initialEvents:
      selected(
        "event",
        pools.eventCandidates
      ),
  };`,
`    initialEvents:
      selected(
        "event",
        pools.eventCandidates
      ),

    initialIllustrations:
      selected(
        "illustration",
        pools.illustrationCandidates
      ),
  };`,
    "initial illustration relations"
  );


  write(file, src);

  console.log(
    "[PATCHED] relation-data illustrations"
  );
}


/* =========================================================
   2. PvForm.tsx
   연결 카드 외 일러스트 RelationPicker
========================================================= */

{
  const file =
    "components/extra/pv/PvForm.tsx";

  let src = read(file);


  src = mustReplace(
    src,
`  eventCandidates:
    RelationCandidate[];

  initialCards?:`,
`  eventCandidates:
    RelationCandidate[];

  illustrationCandidates:
    RelationCandidate[];

  initialCards?:`,
    "PvForm illustrationCandidates"
  );


  src = mustReplace(
    src,
`  initialEvents?:
    RelationCandidate[];
};`,
`  initialEvents?:
    RelationCandidate[];

  initialIllustrations?:
    RelationCandidate[];
};`,
    "PvForm initialIllustrations"
  );


  const cardPicker =
`      <RelationPicker
        label="연결 카드"
        name="linkedCardSlugs"
        candidates={
          relations.cardCandidates
        }
        initialSelected={
          relations.initialCards ?? []
        }
        characterOptions={
          CHARACTER_OPTIONS
        }
      />`;

  const cardPickerNew =
`${cardPicker}


      <RelationPicker
        label="연결 카드 외 일러스트"
        name="linkedIllustrationIds"
        candidates={
          relations.illustrationCandidates
        }
        initialSelected={
          relations.initialIllustrations ?? []
        }
        characterOptions={
          CHARACTER_OPTIONS
        }
        serializeBy="id"
      />`;

  src = mustReplace(
    src,
    cardPicker,
    cardPickerNew,
    "illustration RelationPicker"
  );


  write(file, src);

  console.log(
    "[PATCHED] PvForm illustration picker"
  );
}


/* =========================================================
   3. actions.ts
   illustration relation 저장
   + 첫 번째 영상 썸네일 자동 수집
========================================================= */

{
  const file =
    "app/extra/pv/actions.ts";

  let src = read(file);


  /* VideoItem thumbnail field */

  src = src.replace(
`type VideoItem = {
  server: "CN" | "KR" | "OTHER";
  url: string;
};`,
`type VideoItem = {
  server: "CN" | "KR" | "OTHER";
  url: string;
  thumbnail_url?: string | null;
};`
  );


  /* thumbnail resolver 삽입 */

  const insertBefore =
`function getTargetTable(
  type: string
) {`;

  if (
    !src.includes(
      "async function resolveVideoThumbnail("
    )
  ) {
    const helper =
`
function decodeHtml(
  value: string
) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}


function youtubeId(
  url: string
) {
  const match =
    url.match(
      /(?:youtu\\.be\\/|youtube\\.com\\/(?:watch\\?v=|embed\\/|shorts\\/))([A-Za-z0-9_-]{6,})/
    );

  return match?.[1] ?? "";
}


async function resolveVideoThumbnail(
  url: string
) {
  const yt =
    youtubeId(url);

  if (yt) {
    return \`https://img.youtube.com/vi/\${yt}/hqdefault.jpg\`;
  }


  try {
    const response =
      await fetch(
        url,
        {
          redirect: "follow",

          headers: {
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/157 Safari/537.36",

            accept:
              "text/html,application/xhtml+xml",
          },
        }
      );


    if (!response.ok) {
      return null;
    }


    const contentType =
      response.headers.get(
        "content-type"
      ) ?? "";


    if (
      !contentType.includes(
        "text/html"
      )
    ) {
      return null;
    }


    const html =
      await response.text();


    const patterns = [
      /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["'][^>]*>/i,

      /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/i,
    ];


    for (
      const pattern
      of patterns
    ) {
      const match =
        html.match(pattern);

      const image =
        String(
          match?.[1] ?? ""
        ).trim();

      if (image) {
        return decodeHtml(
          image
        );
      }
    }
  } catch {
    /* Weibo 등 외부 사이트가
       서버 요청을 막는 경우는
       썸네일 없이 처리 */
  }


  return null;
}


async function enrichVideoThumbnails(
  videos: VideoItem[]
) {
  const result:
    VideoItem[] = [];


  for (
    const video
    of videos
  ) {
    result.push({
      ...video,

      thumbnail_url:
        await resolveVideoThumbnail(
          video.url
        ),
    });
  }


  return result;
}


`;

    src = mustReplace(
      src,
      insertBefore,
      helper + insertBefore,
      "video thumbnail helper"
    );
  }


  /* illustration 전용 sync 함수 */

  const syncAllMarker =
`async function syncAllRelations(
  pvId: string,
  formData: FormData
) {`;

  if (
    !src.includes(
      "async function syncPvIllustrationRelations("
    )
  ) {
    const illustrationSync =
`
async function syncPvIllustrationRelations(
  pvId: string,
  illustrationIds: string[]
) {
  const cleanIds =
    Array.from(
      new Set(
        illustrationIds
          .map(
            (id) =>
              id.trim()
          )
          .filter(Boolean)
      )
    );


  const { error: deleteError } =
    await supabaseAdmin
      .from(
        "extra_pv_relations"
      )
      .delete()
      .eq(
        "pv_id",
        pvId
      )
      .eq(
        "target_type",
        "illustration"
      );


  if (deleteError) {
    throw new Error(
      deleteError.message
    );
  }


  if (!cleanIds.length) {
    return;
  }


  const {
    data: validRows,
    error: lookupError,
  } =
    await supabaseAdmin
      .from(
        "illustrations"
      )
      .select("id")
      .in(
        "id",
        cleanIds
      );


  if (lookupError) {
    throw new Error(
      lookupError.message
    );
  }


  const validIds =
    new Set(
      (validRows ?? [])
        .map(
          (row: any) =>
            row.id
        )
    );


  const rows =
    cleanIds
      .filter(
        (id) =>
          validIds.has(id)
      )
      .map(
        (id, index) => ({
          pv_id:
            pvId,

          target_type:
            "illustration",

          target_id:
            id,

          sort_order:
            index,
        })
      );


  if (!rows.length) {
    return;
  }


  const { error } =
    await supabaseAdmin
      .from(
        "extra_pv_relations"
      )
      .insert(rows);


  if (error) {
    throw new Error(
      error.message
    );
  }
}


`;

    src = mustReplace(
      src,
      syncAllMarker,
      illustrationSync +
        syncAllMarker,
      "illustration sync helper"
    );
  }


  /* syncAllRelations에 illustration 추가 */

  const cardSyncEnd =
`  await syncPvRelations({
    pvId,
    targetType: "card",
    slugs:
      parseLines(
        formData.get(
          "linkedCardSlugs"
        )
      ),
  });`;

  const cardSyncNew =
`${cardSyncEnd}


  await syncPvIllustrationRelations(
    pvId,
    parseLines(
      formData.get(
        "linkedIllustrationIds"
      )
    )
  );`;

  if (
    !src.includes(
      'formData.get(\n          "linkedIllustrationIds"'
    )
  ) {
    src = mustReplace(
      src,
      cardSyncEnd,
      cardSyncNew,
      "sync illustration call"
    );
  }


  /* buildPayload async */

  src = src.replace(
`function buildPayload(
  formData: FormData
) {`,
`async function buildPayload(
  formData: FormData
) {`
  );


  src = src.replace(
`  const videos =
    parseVideos(
      formData
    );`,
`  const videos =
    await enrichVideoThumbnails(
      parseVideos(
        formData
      )
    );`
  );


  src = src.replace(
`  const payload =
    buildPayload(
      formData
    );`,
`  const payload =
    await buildPayload(
      formData
    );`
  );

  /* create + update 두 군데 모두 */
  src = src.replace(
`  const payload =
    buildPayload(
      formData
    );`,
`  const payload =
    await buildPayload(
      formData
    );`
  );


  write(file, src);

  console.log(
    "[PATCHED] actions illustration + thumbnails"
  );
}


/* =========================================================
   4. /extra/pv 목록
   썸네일 = 첫 번째 영상
   gallery image 사용 금지
========================================================= */

{
  const file =
    "app/extra/pv/page.tsx";

  let src = read(file);


  /* select에 videos 포함 */

  if (
    !src.includes(
      "        videos,"
    )
  ) {
    src = src.replace(
`        character_keys,
        video_cn_url,`,
`        character_keys,
        videos,
        video_cn_url,`
    );
  }


  const oldThumb =
`              const videoId =
                youtubeId(
                  item.video_kr_url
                ) ||
                youtubeId(
                  item.video_cn_url
                );

              const thumb =
                item.image_urls?.[0] ||
                (
                  videoId
                    ? \`https://img.youtube.com/vi/\${videoId}/hqdefault.jpg\`
                    : ""
                );`;

  const newThumb =
`              const storedVideos =
                Array.isArray(
                  item.videos
                )
                  ? item.videos
                  : [];

              const firstVideo =
                storedVideos[0] ??
                (
                  item.video_cn_url
                    ? {
                        server: "CN",
                        url:
                          item.video_cn_url,
                      }
                    : item.video_kr_url
                      ? {
                          server: "KR",
                          url:
                            item.video_kr_url,
                        }
                      : null
                );

              const firstUrl =
                String(
                  firstVideo?.url ??
                  ""
                );

              const firstYoutubeId =
                youtubeId(
                  firstUrl
                );

              /*
                중요:
                PV 썸네일은 gallery image가 아니라
                첫 번째 등록 영상의 썸네일만 사용.
              */
              const thumb =
                String(
                  firstVideo?.thumbnail_url ??
                  ""
                ).trim() ||
                (
                  firstYoutubeId
                    ? \`https://img.youtube.com/vi/\${firstYoutubeId}/hqdefault.jpg\`
                    : ""
                );`;

  if (
    src.includes(oldThumb)
  ) {
    src =
      src.replace(
        oldThumb,
        newThumb
      );
  } else if (
    !src.includes(
      "PV 썸네일은 gallery image"
    )
  ) {
    console.log(
      "[WARN] 목록 thumbnail 블록 자동 교체 실패"
    );
  }


  write(file, src);

  console.log(
    "[PATCHED] PV list first-video thumbnail"
  );
}


/* =========================================================
   5. 상세페이지
   illustration relation 조회 + 표시
========================================================= */

{
  const file =
    "app/extra/pv/[slug]/page.tsx";

  let src = read(file);


  /* loadType union */

  src = src.replace(
`      | "phone_item"
      | "event"`,
`      | "phone_item"
      | "event"
      | "illustration"`
  );


  /* query 분기 */

  const oldQueryBranch =
`    if (type === "phone_item") {
      query =
        db
          .from("phone_items")
          .select(
            "id, title, slug, subtype, content_json"
          )
          .in(
            "id",
            ids
          );
    } else {
      const table =
        type === "card"
          ? "cards"
          : type === "story"
            ? "stories"
            : "events";

      query =
        db
          .from(table)
          .select(
            "id, title, slug"
          )
          .in(
            "id",
            ids
          );
    }`;

  const newQueryBranch =
`    if (
      type ===
      "phone_item"
    ) {
      query =
        db
          .from(
            "phone_items"
          )
          .select(
            "id, title, slug, subtype, content_json"
          )
          .in(
            "id",
            ids
          );
    } else if (
      type ===
      "illustration"
    ) {
      query =
        db
          .from(
            "illustrations"
          )
          .select(
            "id, title, image_url"
          )
          .in(
            "id",
            ids
          );
    } else {
      const table =
        type === "card"
          ? "cards"
          : type === "story"
            ? "stories"
            : "events";

      query =
        db
          .from(table)
          .select(
            "id, title, slug"
          )
          .in(
            "id",
            ids
          );
    }`;

  if (
    src.includes(
      oldQueryBranch
    )
  ) {
    src =
      src.replace(
        oldQueryBranch,
        newQueryBranch
      );
  }


  src = mustReplace(
    src,
`  const [
    cards,
    stories,
    phoneItems,
    events,
  ] =
    await Promise.all([
      loadType("card"),
      loadType("story"),
      loadType("phone_item"),
      loadType("event"),
    ]);

  return {
    cards,
    stories,
    phoneItems,
    events,
  };`,
`  const [
    cards,
    illustrations,
    stories,
    phoneItems,
    events,
  ] =
    await Promise.all([
      loadType("card"),
      loadType("illustration"),
      loadType("story"),
      loadType("phone_item"),
      loadType("event"),
    ]);

  return {
    cards,
    illustrations,
    stories,
    phoneItems,
    events,
  };`,
    "load illustration relations"
  );


  /* illustration component */

  const relationComponentMarker =
`function RelationSection({`;

  if (
    !src.includes(
      "function IllustrationRelationSection("
    )
  ) {
    const illustrationComponent =
`
function IllustrationRelationSection({
  items,
}: {
  items: any[];
}) {
  if (!items.length) {
    return null;
  }


  return (
    <section className="extra-pv-related-section">

      <h2>
        연결 카드 외 일러스트
      </h2>


      <div className="extra-pv-illustration-grid">

        {items.map(
          (item) => (
            <Link
              key={item.id}
              href={
                \`/illustrations/\${item.id}\`
              }
              className="extra-pv-illustration-card"
            >

              {item.image_url ? (
                <img
                  src={
                    item.image_url
                  }
                  alt={
                    item.title ||
                    ""
                  }
                />
              ) : null}

              <span>
                {
                  item.title ||
                  "제목 없음"
                }
              </span>

            </Link>
          )
        )}

      </div>

    </section>
  );
}


`;

    src = mustReplace(
      src,
      relationComponentMarker,
      illustrationComponent +
        relationComponentMarker,
      "illustration detail component"
    );
  }


  /* 카드 다음에 illustration */

  const cardSection =
`        <RelationSection
          title="연결 카드"
          items={
            relations.cards
          }
          type="card"
        />`;

  const cardSectionNew =
`${cardSection}


        <IllustrationRelationSection
          items={
            relations.illustrations
          }
        />`;

  if (
    !src.includes(
      "<IllustrationRelationSection"
    )
  ) {
    src = mustReplace(
      src,
      cardSection,
      cardSectionNew,
      "illustration detail render"
    );
  }


  write(file, src);

  console.log(
    "[PATCHED] PV detail illustration display"
  );
}


console.log("");
console.log(
  "=== PV ILLUSTRATION + THUMBNAIL PATCH COMPLETE ==="
);
