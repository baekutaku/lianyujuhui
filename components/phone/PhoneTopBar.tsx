type PhoneTopBarProps = {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
};

export default function PhoneTopBar({
  title,
  subtitle,
  rightSlot,
}: PhoneTopBarProps) {
  return (
    <div className="phone-topbar">
      <button type="button" className="phone-back-button">
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