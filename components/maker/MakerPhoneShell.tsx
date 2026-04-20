export default function MakerPhoneShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="phone-page maker-page">
      <div className="phone-shell maker-shell">
        <div className="phone-shell-inner maker-shell-inner">{children}</div>
      </div>
    </main>
  );
}