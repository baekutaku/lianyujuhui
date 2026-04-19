export default function MakerPhoneShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="phone-page">
      <div className="phone-shell">
        <div className="phone-shell-inner">{children}</div>
      </div>
    </main>
  );
}