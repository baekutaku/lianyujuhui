import PvImageFields
  from "@/components/extra/pv/PvImageFields";

import PvVideoFields, {
  type PvVideoItem,
} from "@/components/extra/pv/PvVideoFields";

import RelationPicker, {
  type RelationCandidate,
} from "@/components/admin/relations/RelationPicker";


const CHARACTERS = [
  ["baiqi", "백기"],
  ["lizeyan", "이택언"],
  ["zhouqiluo", "주기락"],
  ["xumo", "허묵"],
  ["lingxiao", "연시호"],
] as const;


const CHARACTER_OPTIONS = [
  { value: "baiqi", label: "백기" },
  { value: "lizeyan", label: "이택언" },
  { value: "zhouqiluo", label: "주기락" },
  { value: "xumo", label: "허묵" },
  { value: "lingxiao", label: "연시호" },
];


const STORY_SUBTYPE_OPTIONS = [
  { value: "main_story", label: "메인스토리" },
  { value: "behind_story", label: "막후의 장" },
  { value: "card_story", label: "데이트" },
  { value: "side_story", label: "비밀이야기 / 외전" },
  { value: "asmr", label: "너의 곁에" },
  { value: "xiyue_story", label: "서월국" },
  { value: "myhome_story", label: "마이홈" },
  { value: "company_project", label: "촬영장 / 회사 프로젝트" },
];


const PHONE_SUBTYPE_OPTIONS = [
  { value: "message", label: "메시지" },
  { value: "moment", label: "모멘트" },
  { value: "call", label: "전화" },
  { value: "video_call", label: "영상통화" },
  { value: "article", label: "기사" },
];


type PvItem = {
  id?: string;

  title?: string;
  slug?: string;

  release_date?:
    string | null;

  character_keys?:
    string[] | null;

  videos?:
    PvVideoItem[] | null;

  image_urls?:
    string[] | null;

  original_text?:
    string | null;

  translation_text?:
    string | null;

  is_published?:
    boolean;
};


type RelationProps = {
  cardCandidates:
    RelationCandidate[];

  illustrationCandidates:
    RelationCandidate[];

  storyCandidates:
    RelationCandidate[];

  phoneCandidates:
    RelationCandidate[];

  eventCandidates:
    RelationCandidate[];

  initialCards?:
    RelationCandidate[];

  initialIllustrations?:
    RelationCandidate[];

  initialStories?:
    RelationCandidate[];

  initialPhoneItems?:
    RelationCandidate[];

  initialEvents?:
    RelationCandidate[];
};


export default function PvForm({
  action,
  item,
  relations,
}: {
  action:
    (
      formData: FormData
    ) =>
      void |
      Promise<void>;

  item?: PvItem;

  relations:
    RelationProps;
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
        </div>

        <div className="form-grid">

          <label className="field full">

            <span>제목</span>

            <input
              name="title"
              required
              defaultValue={
                item?.title ??
                ""
              }
            />

          </label>


          <label className="field">

            <span>슬러그</span>

            <input
              name="slug"
              defaultValue={
                item?.slug ??
                ""
              }
              placeholder="비우면 제목으로 자동 생성"
            />

          </label>


          <label className="field">

            <span>출시일</span>

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

          <h2>캐릭터</h2>

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
                    selected.has(key)
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

          <h2>영상</h2>

          <p>
            순서상 첫 번째 영상이
            PV 목록 대표 썸네일 기준입니다.
          </p>

        </div>


        <PvVideoFields
          initialVideos={
            item?.videos ??
            []
          }
        />

      </section>


      <section className="form-section">

        <div className="section-heading">

          <h2>이미지</h2>

          <p>
            상세 페이지용 이미지입니다.
            목록 썸네일로는 사용하지 않습니다.
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
          <h2>원문 · 번역</h2>
        </div>


        <div className="form-grid">

          <label className="field full">

            <span>원문</span>

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

            <span>번역</span>

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


      <RelationPicker
        label="연결 카드"
        name="linkedCardSlugs"
        candidates={
          relations.cardCandidates
        }
        initialSelected={
          relations.initialCards ??
          []
        }
        characterOptions={
          CHARACTER_OPTIONS
        }
      />


      <RelationPicker
        label="연결 카드 외 일러스트"
        name="linkedIllustrationIds"
        candidates={
          relations.illustrationCandidates
        }
        initialSelected={
          relations.initialIllustrations ??
          []
        }
        characterOptions={
          CHARACTER_OPTIONS
        }
        serializeBy="id"
      />


      <RelationPicker
        label="연결 스토리"
        name="linkedStorySlugs"
        candidates={
          relations.storyCandidates
        }
        initialSelected={
          relations.initialStories ??
          []
        }
        characterOptions={
          CHARACTER_OPTIONS
        }
        subtypeOptions={
          STORY_SUBTYPE_OPTIONS
        }
      />


      <RelationPicker
        label="연결 휴대폰"
        name="linkedPhoneItemSlugs"
        candidates={
          relations.phoneCandidates
        }
        initialSelected={
          relations.initialPhoneItems ??
          []
        }
        characterOptions={
          CHARACTER_OPTIONS
        }
        subtypeOptions={
          PHONE_SUBTYPE_OPTIONS
        }
      />


      <RelationPicker
        label="연결 이벤트"
        name="linkedEventSlugs"
        candidates={
          relations.eventCandidates
        }
        initialSelected={
          relations.initialEvents ??
          []
        }
        characterOptions={
          CHARACTER_OPTIONS
        }
      />


      <label className="extra-pv-publish">

        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={
            item?.is_published ??
            true
          }
        />

        <span>공개</span>

      </label>


      <div className="extra-pv-form-actions">

        <button
          type="submit"
          className="primary-button"
        >
          {
            item?.id
              ? "수정 저장"
              : "PV 등록"
          }
        </button>

      </div>

    </form>
  );
}
