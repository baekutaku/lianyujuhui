"use client";

import { useMemo, useState } from "react";
import MomentChoiceHistoryModal, {
  type MomentChoiceOption,
} from "@/components/phone/moment/MomentChoiceHistoryModal";

type MomentChoiceTriggerProps = {
  title?: string;
  options: MomentChoiceOption[];
  selectedOptionId?: string | null;
  buttonClassName?: string;
  buttonTitle?: string;
};

export default function MomentChoiceTrigger({
  title,
  options,
  selectedOptionId = null,
  buttonClassName,
  buttonTitle = "선택지 다시 보기",
}: MomentChoiceTriggerProps) {
  const [open, setOpen] = useState(false);
  const [draftSelectedId, setDraftSelectedId] = useState<string | null>(
    selectedOptionId
  );

  const selectedLabel = useMemo(() => {
    return options.find((option) => option.id === draftSelectedId)?.label || "";
  }, [draftSelectedId, options]);

  const handleConfirm = () => {
    console.log("TODO: 선택지 저장", {
      selectedOptionId: draftSelectedId,
      selectedLabel,
    });

    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={buttonClassName || "moment-choice-trigger"}
        onClick={() => setOpen(true)}
        aria-label={buttonTitle}
        title={buttonTitle}
      >
        <span className="material-symbols-rounded">autorenew</span>
      </button>

      <MomentChoiceHistoryModal
        open={open}
        title={title ? `${title} · 회상 선택지` : "회상 선택지"}
        options={options}
        selectedOptionId={draftSelectedId}
        onSelect={setDraftSelectedId}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}