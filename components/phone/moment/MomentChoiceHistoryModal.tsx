"use client";

import { useEffect } from "react";

export type MomentChoiceOption = {
  id: string;
  label: string;
  isHistory?: boolean;
};

type MomentChoiceHistoryModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  options: MomentChoiceOption[];
  selectedOptionId?: string | null;
  onSelect: (optionId: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function MomentChoiceHistoryModal({
  open,
  title = "회상 선택지",
  description = "선택지를 바꾸면 이 모멘트에 표시되는 답변이 변경됩니다.",
  options,
  selectedOptionId,
  onSelect,
  onClose,
  onConfirm,
}: MomentChoiceHistoryModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="moment-choice-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="moment-choice-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="moment-choice-modal-header">
          <h3 className="moment-choice-modal-title">{title}</h3>
          <button
            type="button"
            className="moment-choice-modal-close"
            onClick={onClose}
            aria-label="닫기"
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <p className="moment-choice-modal-desc">{description}</p>

        <div className="moment-choice-option-list">
          {options.map((option) => {
            const active = selectedOptionId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                className={`moment-choice-option ${active ? "active" : ""}`}
                onClick={() => onSelect(option.id)}
              >
                <span className="moment-choice-option-label">{option.label}</span>
                {option.isHistory ? (
                  <span className="moment-choice-option-badge">회상</span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="moment-choice-modal-footer">
          <button
            type="button"
            className="moment-choice-confirm"
            onClick={onConfirm}
            disabled={!selectedOptionId}
          >
            확인 변경
          </button>
          <p className="moment-choice-modal-note">
            회상 선택지는 이 모멘트의 표시 내용만 바꿉니다.
          </p>
        </div>
      </div>
    </div>
  );
}