export default function PhoneShell({
  topbar,
  children,
  tabbar,
}: {
  topbar?: React.ReactNode;
  children: React.ReactNode;
  tabbar?: React.ReactNode;
}) {
  return (
    <div className="phone-shell-wrap">
      <div className="phone-shell">
        <div className="phone-shell-inner">
          {topbar}
          {children}
          {tabbar}
        </div>
      </div>
    </div>
  );
}