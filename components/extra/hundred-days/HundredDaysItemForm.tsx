"use client";

import {
  useState,
  type FormEvent,
} from "react";

import {
  useRouter,
} from "next/navigation";

import HundredDaysImageField
  from "@/components/extra/hundred-days/HundredDaysImageField";


export default function HundredDaysItemForm({
  mode,
  series,
  item,
}: {
  mode: "create" | "update";
  series: any;
  item?: any;
}) {
  const router =
    useRouter();

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  const [
    entryType,
    setEntryType,
  ] =
    useState(
      item?.entry_type ??
      "day"
    );

  const [
    isVoice,
    setIsVoice,
  ] =
    useState(
      Boolean(
        item?.is_voice
      )
    );

  const meta =
    item?.meta_json &&
    typeof item.meta_json ===
      "object"
      ? item.meta_json
      : {};


  async function submit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (busy) {
      return;
    }

    setBusy(true);

    try {
      const formData =
        new FormData(
          event.currentTarget
        );

      formData.set(
        "kind",
        "item"
      );

      formData.set(
        "seriesId",
        series.id
      );

      formData.set(
        "seriesSlug",
        series.slug
      );

      if (item?.id) {
        formData.set(
          "id",
          item.id
        );
      }

      const response =
        await fetch(
          "/api/admin/hundred-days",
          {
            method:
              mode === "create"
                ? "POST"
                : "PATCH",

            body:
              formData,
          }
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        !json.ok
      ) {
        throw new Error(
          json.error ||
          "저장 실패"
        );
      }

      router.push(
        "/extra/hundred-days/" +
        encodeURIComponent(
          series.slug
        )
      );

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "저장 실패"
      );
    } finally {
      setBusy(false);
    }
  }


  async function remove() {
    if (
      !item?.id ||
      !confirm(
        "이 항목을 삭제할까요?"
      )
    ) {
      return;
    }

    setBusy(true);

    try {
      const response =
        await fetch(
          "/api/admin/hundred-days?kind=item&id=" +
          encodeURIComponent(
            item.id
          ),
          {
            method: "DELETE",
          }
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        !json.ok
      ) {
        throw new Error(
          json.error ||
          "삭제 실패"
        );
      }

      router.push(
        "/extra/hundred-days/" +
        encodeURIComponent(
          series.slug
        )
      );

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "삭제 실패"
      );
    } finally {
      setBusy(false);
    }
  }


  return (
    <form
      onSubmit={submit}
      className="hundred-days-form"
    >

      <div className="form-grid">

        <label className="field">
          <span>항목 종류</span>

          <select
            name="entryType"
            value={entryType}
            onChange={(e) =>
              setEntryType(
                e.target.value
              )
            }
          >
            <option value="day">
              DAY
            </option>

            <option value="prologue">
              사전 이야기
            </option>

            <option value="special">
              특별 / 총결 / 彩蛋
            </option>
          </select>
        </label>


        {entryType === "day" ? (
          <label className="field">
            <span>DAY</span>

            <input
              name="dayNumber"
              type="number"
              min="0"
              max="100"
              required
              defaultValue={
                item?.day_number ??
                0
              }
            />
          </label>
        ) : null}


        <label className="field">
          <span>날짜</span>

          <input
            name="releaseDate"
            type="date"
            defaultValue={
              item?.release_date ??
              ""
            }
          />
        </label>


        <label className="field">
          <span>시간</span>

          <input
            name="timeText"
            defaultValue={
              item?.time_text ??
              ""
            }
            placeholder="예: 12:00"
          />
        </label>


        <label className="field full">
          <span>제목</span>

          <input
            name="title"
            defaultValue={
              item?.title ??
              ""
            }
            placeholder={
              entryType === "day"
                ? "선택 사항"
                : "예: 이벤트 스토리 / 백일총결"
            }
          />
        </label>


        <label className="field">
          <span>장소</span>

          <input
            name="location"
            defaultValue={
              meta.location ??
              ""
            }
            placeholder="예: 特遣署"
          />
        </label>


        <label className="field">
          <span>분류</span>

          <input
            name="category"
            defaultValue={
              meta.category ??
              ""
            }
            placeholder="예: 工作"
          />
        </label>


        <label className="field full">
          <span>목표</span>

          <input
            name="goal"
            defaultValue={
              meta.goal ??
              ""
            }
            placeholder="2026 목표형 등에 사용"
          />
        </label>


        <label className="field">
          <span>상세 시간</span>

          <input
            name="detailTime"
            defaultValue={
              meta.detail_time ??
              ""
            }
            placeholder="예: 07:29~08:44"
          />
        </label>


        <label className="field">
          <span>누락 항목</span>

          <input
            name="missedGoal"
            defaultValue={
              meta.missed_goal ??
              ""
            }
            placeholder="2023 缺卡 등에 사용"
          />
        </label>


        <label className="field full">
          <span>기타 메모</span>

          <input
            name="note"
            defaultValue={
              meta.note ??
              ""
            }
          />
        </label>


        <label className="field full">
          <span>중문 원문</span>

          <textarea
            name="originalText"
            rows={8}
            defaultValue={
              item?.original_text ??
              ""
            }
          />
        </label>


        <label className="field full">
          <span>한국어 번역</span>

          <textarea
            name="translationText"
            rows={8}
            defaultValue={
              item?.translation_text ??
              ""
            }
          />
        </label>

      </div>


      <section className="hundred-days-media-box">

        <label className="hundred-days-check">
          <input
            type="checkbox"
            name="isVoice"
            checked={isVoice}
            onChange={(e) =>
              setIsVoice(
                e.target.checked
              )
            }
          />

          음성 있음
        </label>


        <div className="form-grid">

          <label className="field">
            <span>미디어 방식</span>

            <select
              name="mediaType"
              defaultValue={
                item?.media_type ??
                "none"
              }
            >
              <option value="none">
                없음
              </option>

              <option value="youtube">
                YouTube / Shorts
              </option>

              <option value="audio">
                MP3 / M4A
              </option>

              <option value="image">
                이미지
              </option>
            </select>
          </label>


          <label className="field full">
            <span>미디어 URL</span>

            <input
              name="mediaUrl"
              type="url"
              defaultValue={
                item?.media_url ??
                ""
              }
              placeholder={
                isVoice
                  ? "YouTube Shorts 또는 음성 파일 URL"
                  : "선택 사항"
              }
            />
          </label>


          <div className="field full">
            <HundredDaysImageField
              name="imageUrl"
              label="본문 이미지"
              initialUrl={
                item?.image_url ??
                ""
              }
              hint="필요한 DAY에만 추가"
            />
          </div>


          <label className="field">
            <span>정렬 번호</span>

            <input
              name="sortOrder"
              type="number"
              defaultValue={
                item?.sort_order ??
                ""
              }
              placeholder="비우면 자동"
            />
          </label>

        </div>

      </section>


      <label className="hundred-days-check">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={
            item?.is_published ??
            true
          }
        />

        공개
      </label>


      <div className="hundred-days-form-actions">

        {mode === "update" ? (
          <button
            type="button"
            className="mini-button hundred-days-delete"
            disabled={busy}
            onClick={remove}
          >
            항목 삭제
          </button>
        ) : null}


        <button
          type="submit"
          className="primary-button"
          disabled={busy}
        >
          {busy
            ? "저장 중..."
            : mode === "create"
              ? "항목 등록"
              : "수정 저장"}
        </button>

      </div>

    </form>
  );
}
