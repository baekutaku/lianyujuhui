"use client";

type ConfirmSubmitButtonProps = {
  label: string;
  confirmMessage: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function ConfirmSubmitButton({
  label,
  confirmMessage,
  className,
  style,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      className={className}
      style={style}
      onClick={(event) => {
        const ok = window.confirm(confirmMessage);
        if (!ok) {
          event.preventDefault();
        }
      }}
    >
      {label}
    </button>
  );
}