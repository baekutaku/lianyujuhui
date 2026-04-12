import { ReactNode } from "react";

type PhoneAdminLayoutProps = {
  phone: ReactNode;
  panel: ReactNode;
};

export default function PhoneAdminLayout({
  phone,
  panel,
}: PhoneAdminLayoutProps) {
  return (
    <div className="phone-admin-layout">
      <div className="phone-admin-phone">{phone}</div>
      <aside className="phone-admin-panel">{panel}</aside>
    </div>
  );
}