import { ReactNode } from "react";

type PhoneAdminLayoutProps = {
  phone: ReactNode;
  panel?: ReactNode;
};

export default function PhoneAdminLayout({
  phone,
  panel,
}: PhoneAdminLayoutProps) {
  return (
    <div className={`phone-admin-layout${panel ? "" : " phone-admin-layout-single"}`}>
      <div className="phone-admin-phone">{phone}</div>
      {panel ? <aside className="phone-admin-panel">{panel}</aside> : null}
    </div>
  );
}