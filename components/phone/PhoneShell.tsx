import { ReactNode } from "react";

type PhoneShellProps = {
  children: ReactNode;
};

export default function PhoneShell({ children }: PhoneShellProps) {
  return (
    <section className="phone-shell">
      <div className="phone-shell-inner">{children}</div>
    </section>
  );
}