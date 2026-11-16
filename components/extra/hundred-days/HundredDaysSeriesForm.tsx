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


type CharacterOption = {
  value: string;
  label: string;
};


export default function HundredDaysSeriesForm({
  mode,
  item,
  characterOptions,
}: {
  mode: "create" | "update";

  item?: any;

  characterOptions:
    CharacterOption[];
}) {
  const router =
    useRouter();

  const [
    busy,
    setBusy,
  ] =
    useState(false);


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
        "series"
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
          json.slug
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
        "이 시리즈를 삭제할까요?\n등록된 DAY 항목도 함께 삭제됩니다."
      )
    ) {
      return;
    }

    setBusy(true);

    try {
      const response =
        await fetch(
          "/api/admin/hundred-days?kind=series&id=" +
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
        "/extra/hundred-days"
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
          <span>캐릭터</span>

          <select
            name="characterKey"
            defaultValue={
              item?.character_key ??
              "baiqi"
            }
          >
            {characterOptions.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>
        </label>


        <label className="field">
          <span>연도</span>

          <input
            name="year"
            type="number"
            min="2017"
            max="2100"
            required
            defaultValue={
              item?.year ??
              new Date()
                .getFullYear()
            }
          />
        </label>


        <label className="field">
          <span>한국어명</span>

          <input
            name="titleKo"
            defaultValue={
              item?.title_ko ??
              ""
            }
            placeholder="예: 백일 궤적"
          />
        </label>


        <label className="field">
          <span>중문명</span>

          <input
            name="titleCn"
            required
            defaultValue={
              item?.title_cn ??
              ""
            }
            placeholder="예: 百日轨迹"
          />
        </label>


        <label className="field">
          <span>slug</span>

          <input
            name="slug"
            defaultValue={
              item?.slug ??
              ""
            }
            placeholder="비워두면 자동 생성"
          />
        </label>


        <label className="field">
          <span>형식</span>

          <select
            name="seriesType"
            defaultValue={
              item?.series_type ??
              "custom"
            }
          >
            <option value="letters">
              편지형
            </option>

            <option value="daily_message">
              일일 메시지형
            </option>

            <option value="mixed_voice">
              텍스트 + 음성형
            </option>

            <option value="checkin">
              체크인형
            </option>

            <option value="diary">
              일기형
            </option>

            <option value="trajectory">
              기록형
            </option>

            <option value="challenge">
              목표 챌린지형
            </option>

            <option value="custom">
              기타
            </option>
          </select>
        </label>


        <label className="field">
          <span>시작일</span>

          <input
            name="startDate"
            type="date"
            defaultValue={
              item?.start_date ??
              ""
            }
          />
        </label>


        <label className="field">
          <span>종료일</span>

          <input
            name="endDate"
            type="date"
            defaultValue={
              item?.end_date ??
              ""
            }
          />
        </label>


        <div className="field full">
          <HundredDaysImageField
            name="thumbnailUrl"
            label="대표 이미지"
            initialUrl={
              item?.thumbnail_url ??
              ""
            }
            hint="드래그 · 파일 선택 · URL 입력"
          />
        </div>


        <label className="field full">
          <span>설명</span>

          <textarea
            name="description"
            rows={5}
            defaultValue={
              item?.description ??
              ""
            }
          />
        </label>

      </div>


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
            시리즈 삭제
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
              ? "시리즈 등록"
              : "수정 저장"}
        </button>

      </div>
    </form>
  );
}
