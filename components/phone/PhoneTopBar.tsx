"use client";

import { useRouter } from "next/navigation";

type PhoneTopBarProps = {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  backHref?: string;
};

export default function PhoneTopBar({
  title,
  subtitle,
  rightSlot,
  backHref = "/phone-items",
}: PhoneTopBarProps) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(backHref);
  }

  return (
    <div className="phone-topbar">
      <button
        type="button"
        className="phone-back-button"
        onClick={handleBack}
        aria-label="뒤로가기"
      >
        ←
      </button>

      <div className="phone-topbar-center">
        <div className="phone-topbar-title">{title}</div>
        {subtitle ? <div className="phone-topbar-subtitle">{subtitle}</div> : null}
      </div>

      <div className="phone-topbar-right">
        {rightSlot ?? <div className="phone-topbar-spacer" />}
      </div>
    </div>
  );
}