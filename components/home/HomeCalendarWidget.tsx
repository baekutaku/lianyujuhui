"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCalendarEntry,
  updateCalendarEntry,
  deleteCalendarEntry,
} from "@/app/admin/actions";

type CalendarEntry = {
  id: string;
  title: string;
  schedule_date: string;
  end_date: string | null;
  note: string | null;
  kind: string;
};

type Props = {
  entries: CalendarEntry[];
  isAdmin: boolean;
};

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function moveMonth(date: Date, diff: number) {
  return new Date(date.getFullYear(), date.getMonth() + diff, 1);
}

function buildCells(viewDate: Date) {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startWeekday = first.getDay();
  const lastDate = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0
  ).getDate();

  const cells: Array<Date | null> = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);

  for (let day = 1; day <= lastDate; day += 1) {
    cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
  }

  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 35) cells.push(null);

  return cells;
}

function getEndDate(entry: CalendarEntry) {
  if (entry.end_date && entry.end_date >= entry.schedule_date) {
    return entry.end_date;
  }
  return entry.schedule_date;
}

function includesDate(entry: CalendarEntry, key: string) {
  return entry.schedule_date <= key && key <= getEndDate(entry);
}

function isRange(entry: CalendarEntry) {
  return getEndDate(entry) > entry.schedule_date;
}

function formatDateText(value: string) {
  return value.replaceAll("-", ".");
}

type ModalMode = "create" | "edit";

export default function HomeCalendarWidget({ entries, isAdmin }: Props) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(monthStart(today));
  const [selectedDate, setSelectedDate] = useState(dateKey(today));
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [editingEntry, setEditingEntry] = useState<CalendarEntry | null>(null);
  const [toast, setToast] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const cells = useMemo(() => buildCells(viewDate), [viewDate]);

  const selectedEntries = useMemo(() => {
    return entries
      .filter((entry) => includesDate(entry, selectedDate))
      .sort((a, b) => {
        const byDate = a.schedule_date.localeCompare(b.schedule_date);
        return byDate !== 0 ? byDate : a.title.localeCompare(b.title, "ko");
      });
  }, [entries, selectedDate]);

  const monthEntryCount = useMemo(() => {
    const first = dateKey(
      new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
    );
    const last = dateKey(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
    );

    return entries.filter(
      (entry) => entry.schedule_date <= last && getEndDate(entry) >= first
    ).length;
  }, [entries, viewDate]);

  function openCreateModal() {
    setMode("create");
    setEditingEntry(null);
    setOpen(true);
  }

  function openEditModal(entry: CalendarEntry) {
    setMode("edit");
    setEditingEntry(entry);
    setOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    try {
      setIsSubmitting(true);

      if (mode === "create") {
        await createCalendarEntry(formData);
        setToast("일정이 추가됨");
      } else {
        await updateCalendarEntry(formData);
        setToast("일정이 수정됨");
      }

      startTransition(() => router.refresh());
      setOpen(false);
      setEditingEntry(null);
    } catch (error) {
      console.error(error);
      setToast(error instanceof Error ? error.message : "저장 실패");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("이 일정을 삭제할까?")) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("id", id);
      await deleteCalendarEntry(formData);
      setToast("일정이 삭제됨");
      startTransition(() => router.refresh());
    } catch (error) {
      console.error(error);
      setToast("삭제 실패");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="home-calendar">
        <div className="home-calendar-top">
          <div className="home-calendar-month">
            {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
          </div>

          <div className="home-calendar-controls">
            <button
              type="button"
              className="home-calendar-nav"
              onClick={() => {
                const next = moveMonth(viewDate, -1);
                setViewDate(next);
                setSelectedDate(dateKey(next));
              }}
              aria-label="이전 달"
            >
              ‹
            </button>

            <button
              type="button"
              className="home-calendar-nav"
              onClick={() => {
                const next = moveMonth(viewDate, 1);
                setViewDate(next);
                setSelectedDate(dateKey(next));
              }}
              aria-label="다음 달"
            >
              ›
            </button>
          </div>
        </div>

        {isAdmin ? (
          <div className="home-calendar-admin-row">
            <button
              type="button"
              className="home-calendar-add-button"
              onClick={openCreateModal}
            >
              + 일정 추가
            </button>
          </div>
        ) : null}

        <div className="home-calendar-week">
          {WEEK.map((day) => (
            <div key={day} className="home-calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="home-calendar-grid">
          {cells.map((cell, index) => {
            if (!cell) {
              return (
                <div
                  key={`empty-${index}`}
                  className="home-calendar-cell is-empty"
                />
              );
            }

            const key = dateKey(cell);
            const dayEntries = entries.filter((entry) =>
              includesDate(entry, key)
            );
            const rangeEntries = dayEntries.filter(isRange);
            const oneDayEntries = dayEntries.filter((entry) => !isRange(entry));

            const hasRange = rangeEntries.length > 0;
            const hasOneDay = oneDayEntries.length > 0;
            const isSelected = selectedDate === key;

            const rangeStarts =
              hasRange &&
              (cell.getDay() === 0 ||
                rangeEntries.some((entry) => entry.schedule_date === key));

            const rangeEnds =
              hasRange &&
              (cell.getDay() === 6 ||
                rangeEntries.some((entry) => getEndDate(entry) === key));

            return (
              <button
                key={key}
                type="button"
                className={[
                  "home-calendar-cell",
                  isSelected ? "is-selected" : "",
                  hasOneDay ? "has-entry" : "",
                  hasRange ? "has-range" : "",
                  rangeStarts ? "range-start" : "",
                  rangeEnds ? "range-end" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedDate(key)}
              >
                {hasRange ? (
                  <span
                    className="home-calendar-range-fill"
                    aria-hidden="true"
                  />
                ) : null}

                <span className="home-calendar-date-number">
                  {cell.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        <div className="home-calendar-divider" />

        <div className="home-calendar-bottom-title">
          <span>선택한 날짜 일정</span>
          <span className="home-calendar-month-count">
            이번달 {monthEntryCount}건
          </span>
        </div>

        {selectedEntries.length > 0 ? (
          <div className="home-calendar-entry-list">
            {selectedEntries.map((entry) => {
              const end = getEndDate(entry);
              const rangeText =
                end === entry.schedule_date
                  ? formatDateText(entry.schedule_date)
                  : `${formatDateText(entry.schedule_date)} ~ ${formatDateText(end)}`;

              return (
                <div key={entry.id} className="home-calendar-entry">
                  <div
                    className={`home-calendar-entry-badge kind-${entry.kind}`}
                  />

                  <div className="home-calendar-entry-body">
                    <div className="home-calendar-entry-title-row">
                      <div>
                        <div className="home-calendar-entry-title">
                          {entry.title}
                        </div>
                        <div className="home-calendar-entry-range">
                          {rangeText}
                        </div>
                      </div>

                      {isAdmin ? (
                        <div className="home-calendar-entry-actions">
                          <button
                            type="button"
                            className="home-calendar-entry-action edit"
                            onClick={() => openEditModal(entry)}
                            disabled={isSubmitting}
                          >
                            수정
                          </button>

                          <button
                            type="button"
                            className="home-calendar-entry-action delete"
                            onClick={() => handleDelete(entry.id)}
                            disabled={isSubmitting}
                          >
                            삭제
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {entry.note ? (
                      <div className="home-calendar-entry-note">
                        {entry.note}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="home-calendar-empty">일정이 없어요 ෆ</div>
        )}
      </div>

      {open ? (
        <div
          className="calendar-modal-backdrop"
          onClick={() => setOpen(false)}
        >
          <div
            className="calendar-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="calendar-modal-header">
              <h4 className="calendar-modal-title">
                {mode === "create" ? "일정 추가" : "일정 수정"}
              </h4>

              <button
                type="button"
                className="calendar-modal-close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            <form action={handleSubmit} className="calendar-modal-form">
              {mode === "edit" ? (
                <input
                  type="hidden"
                  name="id"
                  value={editingEntry?.id ?? ""}
                />
              ) : null}

              <label className="calendar-modal-field">
                <span>제목</span>
                <input
                  name="title"
                  required
                  defaultValue={
                    mode === "edit" ? editingEntry?.title ?? "" : ""
                  }
                />
              </label>

              <div className="calendar-modal-date-row">
                <label className="calendar-modal-field">
                  <span>시작 날짜</span>
                  <input
                    name="scheduleDate"
                    type="date"
                    required
                    defaultValue={
                      mode === "edit"
                        ? editingEntry?.schedule_date ?? selectedDate
                        : selectedDate
                    }
                  />
                </label>

                <label className="calendar-modal-field">
                  <span>종료 날짜 · 선택</span>
                  <input
                    name="endDate"
                    type="date"
                    defaultValue={
                      mode === "edit"
                        ? editingEntry?.end_date ?? ""
                        : ""
                    }
                  />
                </label>
              </div>

              <div className="calendar-modal-range-hint">
                종료 날짜를 비우면 하루 일정으로 표시됩니다.
              </div>

              <label className="calendar-modal-field">
                <span>종류</span>
                <select
                  name="kind"
                  defaultValue={
                    mode === "edit"
                      ? editingEntry?.kind ?? "event"
                      : "event"
                  }
                >
                  <option value="event">event</option>
                  <option value="important">important</option>
                  <option value="birthday">birthday</option>
                </select>
              </label>

              <label className="calendar-modal-field">
                <span>메모</span>
                <textarea
                  name="note"
                  rows={4}
                  defaultValue={
                    mode === "edit" ? editingEntry?.note ?? "" : ""
                  }
                />
              </label>

              <div className="calendar-modal-actions">
                <button
                  type="submit"
                  className="calendar-modal-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "처리 중..."
                    : mode === "create"
                      ? "저장"
                      : "수정 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {toast ? <div className="calendar-toast">{toast}</div> : null}
    </>
  );
}
