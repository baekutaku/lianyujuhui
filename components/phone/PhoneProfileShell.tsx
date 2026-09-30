import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  tabbar: ReactNode;
};

export default function PhoneProfileShell({ children, tabbar }: Props) {
  return (
    <div className="phone-shell-wrap">
      <div className="phone-shell phone-profile-shell">
        <div className="phone-profile-shell-inner">
          <div className="phone-profile-content">{children}</div>
          {tabbar}
        </div>
      </div>
    </div>
  );
}