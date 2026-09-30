"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  buttonTitle = "회상 선택지",
}: MomentChoiceTriggerProps) {
  const [open, setOpen] = useState(false);
  const [draftSelectedId, setDraftSelectedId] = useState<string | null>(
    selectedOptionId
  );

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setDraftSelectedId(selectedOptionId);
  }, [selectedOptionId]);

  const handleConfirm = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (draftSelectedId) {
      params.set("choice", draftSelectedId);
    } else {
      params.delete("choice");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
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
     <span className="material-symbols-rounded moment-choice-trigger-icon">
  autorenew
</span>
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