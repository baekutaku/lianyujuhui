export default function PhoneShell({
  children,
  fullBleed = false,
}: {
  children: React.ReactNode;
  fullBleed?: boolean;
}) {
  return (
    <div className="phone-shell">
      <div className={`phone-shell-inner ${fullBleed ? "phone-shell-fullbleed" : ""}`}>
        {children}
      </div>
    </div>
  );
}