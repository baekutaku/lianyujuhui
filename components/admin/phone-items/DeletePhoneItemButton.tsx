"use client";

type DeletePhoneItemButtonProps = {
  label?: string;
  confirmMessage?: string;
  className?: string;
  icon?: string;
};

export default function DeletePhoneItemButton({
  label = "삭제",
  confirmMessage = "이 항목을 삭제할까요?",
  className = "",
  icon = "delete",
}: DeletePhoneItemButtonProps) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        const ok = window.confirm(confirmMessage);
        if (!ok) e.preventDefault();
      }}
      aria-label={label}
      title={label}
    >
      <span className="material-symbols-rounded">{icon}</span>
    </button>
  );
}