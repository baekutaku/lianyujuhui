import PvImageFields
  from "@/components/extra/pv/PvImageFields";

const CHARACTERS = [
  ["baiqi", "백기"],
  ["lizeyan", "이택언"],
  ["zhouqiluo", "주기락"],
  ["xumo", "허묵"],
  ["lingxiao", "연시호"],
] as const;

type PvItem = {
  id?: string;

  title?: string;
  slug?: string;

  release_date?:
    string | null;

  character_keys?:
    string[] | null;

  video_cn_url?:
    string | null;

  video_kr_url?:
    string | null;

  original_text?:
    string | null;

  translation_text?:
    string | null;

  image_urls?:
    string[] | null;

  related_event_slug?:
    string | null;

  is_published?:
    boolean;
};

export default function PvForm({
  action,
  item,
  events = [],
}: {
  action:
    (
      formData: FormData
    ) =>
      void |
      Promise<void>;

  item?: PvItem;

  events?: {
    slug: string;
    title: string;
  }[];
}) {
  const selected =
    new Set(
      item?.character_keys ??
        []
    );

  return (
    <form
      action={action}
      className="extra-pv-form"
    >

      {item?.id ? (
        <>
          <input
            type="hidden"
            name="id"
            value={item.id}
          />

          <input
            type="hidden"
            name="oldSlug"
            value={
              item.slug ?? ""
            }
          />
        </>
      ) : null}


      <section className="form-section">

        <div className="section-heading">
          <h2>
            PV 기본 정보
          </h2>

          <p>
            스토리와 별개인
            PV 전용 콘텐츠입니다.
          </p>
        </div>

        <div className="form-grid">

          <label className="field full">
            <span>
              제목
            </span>

            <input
              name="title"
              required
              defaultValue={
                item?.title ?? ""
              }
            />
          </label>

          <label className="field">
            <span>
              슬러그
            </span>

            <input
              name="slug"
              defaultValue={
                item?.slug ?? ""
              }
              placeholder="비우면 제목으로 자동 생성"
            />
          </label>

          <label className="field">
            <span>
              출시일
            </span>

            <input
              type="date"
              name="releaseDate"
              defaultValue={
                item?.release_date ??
                ""
              }
            />
          </label>

        </div>

      </section>


      <section className="form-section">

        <div className="section-heading">
          <h2>
            캐릭터
          </h2>
          <p>
            여러 명 선택 가능
          </p>
        </div>

        <div className="extra-pv-character-checks">

          {CHARACTERS.map(
            ([key, label]) => (
              <label key={key}>

                <input
                  type="checkbox"
                  name="characterKeys"
                  value={key}
                  defaultChecked={
                    selected.has(
                      key
                    )
                  }
                />

                <span>
                  {label}
                </span>

              </label>
            )
          )}

        </div>

      </section>


      <section className="form-section">

        <div className="section-heading">
          <h2>
            영상
          </h2>
        </div>

        <div className="form-grid">

          <label className="field full">
            <span>
              중국 서버 영상 URL
            </span>

            <input
              name="videoCnUrl"
              defaultValue={
                item?.video_cn_url ??
                ""
              }
              placeholder="YouTube / Bilibili 등"
            />
          </label>

          <label className="field full">
            <span>
              한국 서버 영상 URL
            </span>

            <input
              name="videoKrUrl"
              defaultValue={
                item?.video_kr_url ??
                ""
              }
            />
          </label>

        </div>

      </section>


      <section className="form-section">

        <div className="section-heading">

          <h2>
            이미지
          </h2>

          <p>
            여러 장 업로드 가능
          </p>

        </div>

        <PvImageFields
          initialUrls={
            item?.image_urls ??
            []
          }
        />

      </section>


      <section className="form-section">

        <div className="section-heading">
          <h2>
            원문 · 번역
          </h2>
        </div>

        <div className="form-grid">

          <label className="field full">

            <span>
              원문
            </span>

            <textarea
              name="originalText"
              rows={10}
              defaultValue={
                item?.original_text ??
                ""
              }
            />

          </label>

          <label className="field full">

            <span>
              번역
            </span>

            <textarea
              name="translationText"
              rows={10}
              defaultValue={
                item?.translation_text ??
                ""
              }
            />

          </label>

        </div>

      </section>


      <section className="form-section">

        <div className="section-heading">
          <h2>
            관련 이벤트
          </h2>
        </div>

        <label className="field full">

          <span>
            이벤트 연결
          </span>

          <select
            name="relatedEventSlug"
            defaultValue={
              item?.related_event_slug ??
              ""
            }
          >

            <option value="">
              연결 없음
            </option>

            {events.map(
              (event) => (
                <option
                  key={
                    event.slug
                  }
                  value={
                    event.slug
                  }
                >
                  {event.title}
                </option>
              )
            )}

          </select>

        </label>

      </section>


      <label className="extra-pv-publish">

        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={
            item?.is_published ??
            true
          }
        />

        <span>
          공개
        </span>

      </label>


      <div className="extra-pv-form-actions">

        <button
          type="submit"
          className="primary-button"
        >
          {item?.id
            ? "수정 저장"
            : "PV 등록"}
        </button>

      </div>

    </form>
  );
}
