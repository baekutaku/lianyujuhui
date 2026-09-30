export default function MakerPhoneShell({
  children,
  noTabbar = false,
}: {
  children: React.ReactNode;
  noTabbar?: boolean;
}) {
  return (
    <main className="phone-page maker-page">
      <div className="phone-shell maker-shell">
        <div
          className={`phone-shell-inner maker-shell-inner ${
            noTabbar ? "no-tabbar" : ""
          }`}
        >
          {children}
        </div>
      </div>
    </main>
  );
}