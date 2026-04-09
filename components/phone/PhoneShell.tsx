export default function PhoneShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="phone-shell">
      <div className="phone-shell-inner">{children}</div>
    </div>
  );
}